import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';

const LatexRenderer = ({ content }) => {
  if (!content) {
    return null;
  }

  // Split by block-level math delimiters ($$)
  const parts = content.split(/(\$\$[\s\S]*?\$\$)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // It's a block math part
          const math = part.substring(2, part.length - 2);
          return <BlockMath key={index} math={math} />;
        }

        // It's a text part, so we need to check for inline math
        const inlineParts = part.split(/(\$[^$]+?\$)/);

        return (
          <React.Fragment key={index}>
            {inlineParts.map((inlinePart, inlineIndex) => {
              if (inlinePart.startsWith('$') && inlinePart.endsWith('$') && inlinePart.length > 2) {
                const math = inlinePart.substring(1, inlinePart.length - 1);
                return <InlineMath key={inlineIndex} math={math} />;
              }
              // It's a regular text part
              return <span key={inlineIndex}>{inlinePart}</span>;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default LatexRenderer;
