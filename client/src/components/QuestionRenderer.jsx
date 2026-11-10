import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * QuestionRenderer
 * Renders question and solution HTML while natively preserving MathML (<math>, <mrow>, <mo>, <mi>, <mn>, etc.)
 * Sanitizes against script execution or dangerous attributes while allowing educational markup.
 */
export default function QuestionRenderer({ htmlContent, className = '' }) {
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) return '';

    // Configure DOMPurify to allow standard HTML and MathML tags
    return DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: [
        'math', 'mrow', 'mi', 'mn', 'mo', 'mfrac', 'msqrt', 'mroot', 
        'msub', 'msup', 'msubsup', 'mover', 'munder', 'munderover', 
        'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'semantics', 'annotation'
      ],
      ADD_ATTR: [
        'display', 'xmlns', 'mathvariant', 'columnalign', 'rowalign', 
        'columnspacing', 'rowspacing', 'stretchy', 'fence', 'lspace', 'rspace'
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

