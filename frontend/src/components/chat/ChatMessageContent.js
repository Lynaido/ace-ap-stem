import React from 'react';
import { MathText } from '../primitives/LatexRenderer';

// Tutor replies use light Markdown (paragraphs, lists, **bold**) plus LaTeX.
// Display math can span lines, so it is split out before looking at lines.
const DISPLAY_MATH = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,4}\s+/;

const Inline = ({ text }) => text.split(/(\*\*[^*\n]+?\*\*)/g).map((part, index) => {
  if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
    return <strong key={index}><MathText source={part.slice(2, -2)} /></strong>;
  }
  return part ? <MathText key={index} source={part} /> : null;
});

const renderText = (text, keyPrefix) => {
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const lines = paragraph;
    blocks.push(
      <p key={`${keyPrefix}-p-${blocks.length}`}>
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {index > 0 && <br />}
            <Inline text={line} />
          </React.Fragment>
        ))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const ListTag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <ListTag key={`${keyPrefix}-l-${blocks.length}`}>
        {list.items.map((item, index) => <li key={index}><Inline text={item} /></li>)}
      </ListTag>
    );
    list = null;
  };

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const ordered = NUMBERED.test(line);
    if (ordered || BULLET.test(line)) {
      flushParagraph();
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(line.replace(ordered ? NUMBERED : BULLET, ''));
      return;
    }

    if (HEADING.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(
        <p className="chat-rich__heading" key={`${keyPrefix}-h-${blocks.length}`}>
          <Inline text={line.replace(HEADING, '').replace(/^\*\*|\*\*$/g, '')} />
        </p>
      );
      return;
    }

    // A wrapped line directly after a list item continues that item.
    if (list && /^\s{2,}/.test(rawLine)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
};

const ChatMessageContent = ({ content, children }) => {
  const source = String(content || '');
  const segments = source.split(DISPLAY_MATH);

  return (
    <div className="chat-rich">
      {segments.map((segment, index) => {
        if (!segment) return null;
        if (index % 2 === 1) {
          return <div className="chat-rich__math" key={`m-${index}`}><MathText source={segment} /></div>;
        }
        return <React.Fragment key={`t-${index}`}>{renderText(segment, index)}</React.Fragment>;
      })}
      {children}
    </div>
  );
};

export default ChatMessageContent;
