import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * QuestionRenderer
 * Renders question and solution HTML while natively preserving MathML (<math>, <mrow>, <mo>, <mi>, <mn>, etc.)
 * Sanitizes against script execution or dangerous attributes while allowing educational markup.
 * Normalizes legacy inline black font styling to ensure flawless dark-mode readability.
 */
export default function QuestionRenderer({ htmlContent, className = '' }) {
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) return '';

    // Step 1: Strip or normalize hardcoded black inline styles safely before DOM insertion
    // Upstream questions contain legacy inline style="color:#000000" which makes text invisible in dark mode.
    const normalized = htmlContent
      .replace(/style=(["'])color\s*:\s*(#000000|#000|black)\s*;?\s*\1/gi, '')
      .replace(/color\s*:\s*(#000000|#000|black)\s*;?/gi, '');

    // Step 2: Configure DOMPurify to allow standard HTML and MathML tags
    return DOMPurify.sanitize(normalized, {
      ADD_TAGS: [
        'math', 'mrow', 'mi', 'mn', 'mo', 'mfrac', 'msqrt', 'mroot', 
        'msub', 'msup', 'msubsup', 'mover', 'munder', 'munderover', 
        'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'semantics', 'annotation',
        'mstyle'
      ],
      ADD_ATTR: [
        'display', 'xmlns', 'mathvariant', 'columnalign', 'rowalign', 
        'columnspacing', 'rowspacing', 'stretchy', 'fence', 'lspace', 'rspace',
        'displaystyle', 'linebreak', 'width', 'form'
      ]
    });
  }, [htmlContent]);

  if (!htmlContent) {
    return <div className="text-xs text-[#626965] italic">No content provided.</div>;
  }

  return (
    <div
      className={`prose prose-invert max-w-none text-xs leading-relaxed text-[#f4f3ee] select-text question-markup ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}


