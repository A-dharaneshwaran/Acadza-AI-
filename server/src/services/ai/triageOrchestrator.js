const investigationContextService = require('./investigationContextService');
const triagePromptService = require('./triagePromptService');
const nvidiaClient = require('./nvidiaClient');
const { triageOutputSchema } = require('./triageOutputSchema');
const taxonomyService = require('../triage/taxonomyService');
const InvestigationCase = require('../../models/InvestigationCase');

/**
 * Triage Orchestrator Service
 * Coordinates context building, prompt construction, NVIDIA NIM inference,
 * strict Zod validation, and safe persistence to MongoDB.
 */
class TriageOrchestrator {
  /**
   * Run AI investigation triage for a single case.
   * @param {string} caseIdentifier - caseId or questionId
   * @param {Object} options - e.g. { force: boolean }
   * @returns {Promise<Object>} Validated recommendation
   */
  async triageCase(caseIdentifier, options = {}) {
    // 1. Build authoritative context
    const context = await investigationContextService.buildContext(caseIdentifier);

    // 2. Retrieve authoritative taxonomy rules
    const taxonomyRules = await taxonomyService.getTaxonomy();

    // 3. Construct isolated prompts
    const systemPrompt = triagePromptService.buildSystemPrompt(taxonomyRules);
    const userPrompt = triagePromptService.buildUserPrompt(context);

    // 4. Send request through NVIDIA NIM client
    let rawOutput;
    try {
      rawOutput = await nvidiaClient.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    } catch (err) {
      // Record failure on investigation case safely
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
      throw err;
    }

    // 5. Parse JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawOutput);
    } catch (jsonErr) {
      // Strip markdown fences if present
      const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    }

    // 6. Validate with Zod schema
    const validationResult = triageOutputSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      await InvestigationCase.updateOne(
        { caseId: context.caseId },
        {
          $set: {
            'aiTriage.status': 'validation_failed',
            'aiTriage.error': errorMsg,
            'aiTriage.failedAt': new Date()
          }
        }
      );
      throw new Error(`AI Triage output validation failed: ${errorMsg}`);
    }

    const validatedData = validationResult.data;

    // 7. Verify caseId and questionId match context
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

    // 9. Persist validated recommendation to MongoDB InvestigationCase
    const aiTriageRecord = {
      status: 'completed',
      provider: 'NVIDIA NIM Hosted Inference',
      model: nvidiaClient.model,
      promptVersion: 'v1.0-secure-quarantine',
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
      proposedEdit: validatedData.proposedEdit || null,
      studentReplyPreview: validatedData.studentReplyPreview || '',
      generatedAt: new Date()
    };

    // Update case in MongoDB
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
