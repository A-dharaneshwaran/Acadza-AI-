const investigationContextService = require('./investigationContextService');
const triagePromptService = require('./triagePromptService');
const { callNvidiaInference, modelId } = require('./nvidiaService');
const { triageOutputSchema } = require('./triageOutputSchema');
const taxonomyService = require('../triage/taxonomyService');
const InvestigationCase = require('../../models/InvestigationCase');

/**
 * Triage Orchestrator (Phase 03)
 * Orchestrates context construction, NVIDIA inference, strict Zod validation,
 * and persistence of token usage metadata.
 */
class TriageOrchestrator {
  /**
   * Run investigation triage for one case.
   */
  async triageCase(caseIdentifier, options = {}) {
    // 1. Build context
    const context = await investigationContextService.buildContext(caseIdentifier);

    // Rule: Skip if already completed unless force mode is explicitly passed
    const existing = await InvestigationCase.findOne({ caseId: context.caseId });
    if (existing?.aiTriage?.status === 'completed' && !options.force) {
      return {
        success: true,
        skipped: true,
        caseId: context.caseId,
        message: 'Case already triaged. Use --force to reprocess.',
        recommendation: existing.aiTriage
      };
    }

    // Rule: Prevent double-submission if request is actively in-flight
    if (existing?.aiTriage?.status === 'processing') {
      return {
        success: false,
        skipped: true,
        caseId: context.caseId,
        message: 'Case is already in processing state. Duplicate request blocked.'
      };
    }

    // Mark status as processing in database before initiating network call
    await InvestigationCase.updateOne(
      { caseId: context.caseId },
      { $set: { 'aiTriage.status': 'processing', 'aiTriage.startedAt': new Date() } }
    );

    // 2. Fetch taxonomy
    const taxonomyRules = await taxonomyService.getTaxonomy();

    // 3. Prepare secure, token-optimized prompts
    const systemPrompt = triagePromptService.buildSystemPrompt(taxonomyRules);
    const userPrompt = triagePromptService.buildUserPrompt(context);

    // 4. Send inference request through NVIDIA NIM client
    let inferenceResult;
    try {
      inferenceResult = await callNvidiaInference([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    } catch (err) {
      // Record failure on investigation case safely without overwriting previous successful triage
      if (existing?.aiTriage?.status !== 'completed') {
        await InvestigationCase.updateOne(
          { caseId: context.caseId },
          {
            $set: {
              'aiTriage.status': 'failed',
              'aiTriage.error': err.message,
              'aiTriage.failedAt': new Date()
            }
          }
        );
      }
      throw err;
    }

    // 5. Parse JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(inferenceResult.content);
    } catch (jsonErr) {
      const cleaned = inferenceResult.content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    }

    // 6. Validate with Zod
    const validationResult = triageOutputSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`AI Triage output validation failed: ${errorMsg}`);
    }

    const validatedData = validationResult.data;

    // 7. Verify IDs
    if (validatedData.caseId !== context.caseId || validatedData.questionId !== context.questionId) {
      throw new Error(`Identifier mismatch: AI returned ${validatedData.caseId}/${validatedData.questionId}, expected ${context.caseId}/${context.questionId}`);
    }

    // 8. Validate taxonomy boundaries
    const isValidVerdict = await taxonomyService.isValidVerdict(validatedData.verdict);
    if (!isValidVerdict) {
      throw new Error(`Invalid taxonomy verdict returned: ${validatedData.verdict}`);
    }

    if (validatedData.repairType) {
      const isValidRepair = await taxonomyService.isValidRepair(validatedData.repairType);
      if (!isValidRepair) {
        throw new Error(`Invalid taxonomy repair type returned: ${validatedData.repairType}`);
      }
    }

    // 9. Persist validated recommendation with token usage
    const aiTriageRecord = {
      status: 'completed',
      provider: 'NVIDIA NIM Hosted API',
      model: inferenceResult.model,
      promptVersion: 'v3.0-free-endpoint-optimized',
      verdict: validatedData.verdict,
      repairType: validatedData.repairType || null,
      targetFields: validatedData.targetFields,
      summary: validatedData.summary,
      reasoning: validatedData.reasoning,
      evidence: validatedData.evidence,
      confidence: validatedData.confidence,
      facultyReviewRequired: validatedData.facultyReviewRequired,
      injectionRiskConsidered: validatedData.injectionRiskConsidered,
      uncertainties: validatedData.uncertainties,
      recommendedAction: validatedData.recommendedAction,
      generatedAt: new Date(),
      usage: inferenceResult.usage || null,
      durationMs: inferenceResult.durationMs
    };

    await InvestigationCase.updateOne(
      { caseId: context.caseId },
      {
        $set: {
          status: validatedData.facultyReviewRequired ? 'needs_faculty_review' : 'ai_completed',
          triageResult: aiTriageRecord,
          aiTriage: aiTriageRecord
        }
      }
    );

    return {
      success: true,
      caseId: context.caseId,
      questionId: context.questionId,
      recommendation: aiTriageRecord
    };
  }
}

module.exports = new TriageOrchestrator();
