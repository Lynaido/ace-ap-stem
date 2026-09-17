import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';

const humanizeKey = (key) => key
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/^./, (character) => character.toUpperCase());

const MathFallback = ({ source }) => <span className="math-fallback">{source}</span>;

export const MathText = ({ source }) => {
  const blockParts = String(source).split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);

  return blockParts.map((part, index) => {
    const isDollarBlock = part.startsWith('$$') && part.endsWith('$$');
    const isBracketBlock = part.startsWith('\\[') && part.endsWith('\\]');

    if (isDollarBlock || isBracketBlock) {
      return (
        <BlockMath
          key={`block-${index}`}
          math={part.slice(2, -2)}
          renderError={() => <MathFallback source={part} />}
        />
      );
    }

    const inlineParts = part.split(/(\$[^$\n]+?\$|\\\([^\n]*?\\\))/g);
    return (
      <React.Fragment key={`text-${index}`}>
        {inlineParts.map((inlinePart, inlineIndex) => {
          const isDollarInline = inlinePart.startsWith('$') && inlinePart.endsWith('$');
          const isParenInline = inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)');

          if ((isDollarInline || isParenInline) && inlinePart.length > 2) {
            return (
              <InlineMath
                key={`inline-${inlineIndex}`}
                math={inlinePart.slice(isDollarInline ? 1 : 2, isDollarInline ? -1 : -2)}
                renderError={() => <MathFallback source={inlinePart} />}
              />
            );
          }

          return <React.Fragment key={`plain-${inlineIndex}`}>{inlinePart}</React.Fragment>;
        })}
      </React.Fragment>
    );
  });
};

const StructuredValue = ({ value, depth = 0 }) => {
  if (value === null || value === undefined || value === '') return null;

  if (Array.isArray(value)) {
    return (
      <div className="structured-math-list">
        {value.map((item, index) => (
          <div className="structured-math-list__item" key={`${depth}-${index}`}>
            <StructuredValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <dl className="structured-math-object">
        {Object.entries(value).map(([key, item]) => (
          <div className="structured-math-object__row" key={key}>
            <dt>{humanizeKey(key)}</dt>
            <dd><StructuredValue value={item} depth={depth + 1} /></dd>
          </div>
        ))}
      </dl>
    );
  }

  return <MathText source={String(value)} />;
};

const LatexRenderer = ({ content, className = '' }) => {
  if (content === null || content === undefined || content === '') return null;

  return (
    <div className={`latex-content ${className}`.trim()}>
      <StructuredValue value={content} />
    </div>
  );
};

export default LatexRenderer;
