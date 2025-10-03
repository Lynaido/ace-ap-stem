/**
 * Debug script for concept notes JSON parsing issues
 * Run with: node test-concept-notes-debug.js
 */

// Test cases for JSON parsing issues
const testCases = [
  {
    name: "Valid JSON",
    input: '{"conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Content"}], "subject": "Physics", "difficulty": "medium"}',
    shouldPass: true
  },
  {
    name: "JSON with BOM",
    input: '\uFEFF{"conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Content"}], "subject": "Physics", "difficulty": "medium"}',
    shouldPass: true
  },
  {
    name: "JSON in markdown",
    input: '```json\n{"conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Content"}], "subject": "Physics", "difficulty": "medium"}\n```',
    shouldPass: true
  },
  {
    name: "JSON with extra whitespace",
    input: '  \n  {"conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Content"}], "subject": "Physics", "difficulty": "medium"}  \n  ',
    shouldPass: true
  },
  {
    name: "Invalid JSON - position 2 error",
    input: '{ "conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Content"}], "subject": "Physics", "difficulty": "medium"}',
    shouldPass: false
  },
  {
    name: "JSON with escaped characters",
    input: '{"conceptNotes": [{"id": "1", "type": "definition", "title": "Test", "description": "Desc", "content": "Power is defined as P = W/t\\nwhere W is work"}], "subject": "Physics", "difficulty": "medium"}',
    shouldPass: true
  }
];

function extractJson(text) {
  // Remove BOM and trim
  text = text.replace(/^\uFEFF/, '').trim();
  
  // If using response_format: json_object, the entire response should be JSON
  // Try parsing directly first
  if (text.startsWith('{') || text.startsWith('[')) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1 && lastBracket > firstBracket) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
  }

  // Fallback: Try to find the JSON block in markdown
  const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // Another fallback: find any JSON block in code fences
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const content = codeBlockMatch[1].trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }

  // Last resort: find the first and last brace or bracket anywhere
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1 && lastBracket > firstBracket) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }

  return null;
}

function testParsing(testCase) {
  console.log(`\n--- Testing: ${testCase.name} ---`);
  console.log(`Input (first 100 chars): ${testCase.input.substring(0, 100)}`);
  
  try {
    const extracted = extractJson(testCase.input);
    if (!extracted) {
      console.log('❌ Failed to extract JSON');
      return false;
    }
    
    console.log(`Extracted (first 100 chars): ${extracted.substring(0, 100)}`);
    
    // Try cleaning
    let cleaned = extracted
      .trim()
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/^\uFEFF/, '');
    
    const parsed = JSON.parse(cleaned);
    console.log('✅ Successfully parsed JSON');
    console.log(`Has conceptNotes: ${Array.isArray(parsed.conceptNotes)}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to parse: ${error.message}`);
    if (error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const extracted = extractJson(testCase.input);
        if (extracted) {
          console.log(`Character at position ${pos}: '${extracted.charAt(pos)}' (code: ${extracted.charCodeAt(pos)})`);
          console.log(`Context around position: '${extracted.substring(Math.max(0, pos - 10), pos + 10)}'`);
        }
      }
    }
    return false;
  }
}

// Run all tests
console.log('=== JSON Parsing Debug Tests ===\n');
let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  const result = testParsing(testCase);
  if (result) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
