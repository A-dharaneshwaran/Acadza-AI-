/**
 * Prompt Injection Risk Detection Service
 *
 * Dedicated security scanner for student comments.
 *
 * CORE PRINCIPLE:
 * Every student comment is untrusted user input by default.
 * This detector provides early warning telemetry and risk categorization.
 * System instructions, taxonomy boundaries, and database write privileges
 * are isolated deterministically and never exposed to or influenced by student comments.
 */

// Patterns indicating adversarial prompt injection, privilege escalation, or instruction overriding
const INJECTION_PATTERNS = [
  {
    indicator: 'instruction_override',
    pattern: /\b(?:ignore\s+(?:all\s+)?previous\s+instructions|disregard\s+(?:all\s+)?prior\s+instructions|forget\s+all\s+instructions)\b/i,
    severity: 'critical',
    description: 'Direct command attempting to override system or prompt instructions.'
  },
  {
    indicator: 'role_impersonation',
    pattern: /\b(?:you\s+are\s+(?:now\s+)?(?:the\s+)?(?:admin|root|system|developer|supervisor|bot|moderator)|act\s+as\s+(?:the\s+)?admin)\b/i,
    severity: 'critical',
    description: 'Attempt to hijack model persona or claim elevated administrative role.'
  },
  {
    indicator: 'verdict_or_answer_manipulation',
    pattern: /\b(?:change\s+the\s+answer\s+to|mark\s+this\s+report\s+as\s+corrected|force\s+verdict|set\s+verdict\s+to|auto[\s_-]?apply)\b/i,
    severity: 'high',
    description: 'Imperative command attempting to dictate verdict or force answer-key modification.'
  },
  {
    indicator: 'system_prompt_exfiltration',
    pattern: /\b(?:reveal\s+(?:your\s+)?(?:system\s+prompt|instructions|secret|api[\s_-]?key)|print\s+system\s+prompt|what\s+are\s+your\s+instructions)\b/i,
    severity: 'high',
    description: 'Attempt to exfiltrate internal system prompts or confidential configuration.'
  },
  {
    indicator: 'code_or_delimiters_injection',
    pattern: /(?:```|<system>|<\/system>|\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<prompt>)/i,
    severity: 'medium',
    description: 'Inclusion of LLM system delimiters or prompt container syntax.'
  }
];

class InjectionDetectionService {
  /**
   * Scan a single student comment string for adversarial injection patterns.
   * @param {string} comment - Raw student comment
   * @returns {Object} Structured analysis
   */
  detect(comment) {
    if (!comment || typeof comment !== 'string') {
      return {
        injectionDetected: false,
        riskLevel: 'none',
        matchedIndicators: [],
        explanation: 'Comment is empty or non-textual.'
      };
    }

    const matchedIndicators = [];
    let highestSeverity = 'none';

    for (const rule of INJECTION_PATTERNS) {
      if (rule.pattern.test(comment)) {
        matchedIndicators.push({
          indicator: rule.indicator,
          severity: rule.severity,
          description: rule.description
        });

        if (rule.severity === 'critical') {
          highestSeverity = 'critical';
        } else if (rule.severity === 'high' && highestSeverity !== 'critical') {
          highestSeverity = 'high';
        } else if (rule.severity === 'medium' && !['critical', 'high'].includes(highestSeverity)) {
          highestSeverity = 'medium';
        }
      }
    }

    const injectionDetected = matchedIndicators.length > 0;
    let explanation = 'No suspicious prompt manipulation detected. Comment treated as standard untrusted report.';

    if (injectionDetected) {
      const indicatorNames = matchedIndicators.map(m => m.indicator).join(', ');
      explanation = `Suspicious prompt manipulation pattern detected (${indicatorNames}). Potential adversarial attack.`;
    }

    return {
      injectionDetected,
      riskLevel: highestSeverity,
      matchedIndicators,
      explanation
    };
  }

  /**
   * Scan an array of student comments (e.g. from a duplicate group) and synthesize overall case risk.
   * @param {Array<Object>} comments - Array of { reportId, comment }
   * @returns {Object} Aggregate risk profile
   */
  evaluateGroup(comments) {
    let groupRisk = 'none';
    let anyInjection = false;
    const reportFindings = [];

    for (const item of comments) {
      const result = this.detect(item.comment);
      reportFindings.push({
        reportId: item.reportId,
        ...result
      });

      if (result.injectionDetected) {
        anyInjection = true;
        if (result.riskLevel === 'critical' || groupRisk !== 'critical') {
          if (result.riskLevel === 'critical' || (result.riskLevel === 'high' && groupRisk !== 'high')) {
            groupRisk = result.riskLevel;
          }
        }
      }
    }

    return {
      injectionDetected: anyInjection,
      riskLevel: anyInjection ? (groupRisk === 'none' ? 'medium' : groupRisk) : 'none',
      reportFindings
    };
  }
}

module.exports = new InjectionDetectionService();

