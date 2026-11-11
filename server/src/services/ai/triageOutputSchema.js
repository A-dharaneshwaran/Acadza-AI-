const { z } = require('zod');

/**
 * Strict Zod Schema for NVIDIA NIM Triage Output (Phase 03)
 */
const evidenceItemSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  reportId: z.string().nullable().optional(),
  exactText: z.string().default(''),
  explanation: z.string().min(1, 'Explanation is required')
});

const triageOutputSchema = z.object({
  caseId: z.string().min(1),
  questionId: z.string().min(1),
  verdict: z.enum([
    'defect',
    'no_error',
    'display_issue',
    'app_issue',
    'language_mode',
    'already_fixed',
    'not_actionable'
  ]),
  repairType: z.string().nullable().optional(),
  targetFields: z.array(z.string()).default([]),
  summary: z.string().min(1),
  reasoning: z.string().min(1),
  evidence: z.array(evidenceItemSchema).min(1),
  confidence: z.number().min(0).max(1),
  facultyReviewRequired: z.boolean(),
  injectionRiskConsidered: z.boolean().default(true),
  uncertainties: z.array(z.string()).default([]),
  recommendedAction: z.string().default('faculty_review')
});

module.exports = {
  triageOutputSchema,
  evidenceItemSchema
};
