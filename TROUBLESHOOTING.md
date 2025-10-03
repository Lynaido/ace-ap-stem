# Troubleshooting Guide

## If Buttons Still Don't Work

### Check Console for Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking buttons

### Common Issues:

#### Issue: "Cannot read property 'conceptNotes' of undefined"
**Solution**: The API response format might have changed. Check the network tab.

#### Issue: Button does nothing when clicked
**Check**:
1. Is `createdProblemId` set? (Should be set after problem creation)
2. Are the handlers properly connected? (Check React DevTools props)
3. Is there a network request when clicking? (Check Network tab)

### Debug Steps:
```javascript
// Add this to SolveProblemsPage.js temporarily to debug
console.log('Problem ID:', createdProblemId);
console.log('Current display mode:', problemDisplayMode);
console.log('Existing concept notes:', problemConceptNotes);
```

## If Concept Notes Content Is Still Poor

### Check the API Response

1. **Open Network tab** in DevTools
2. **Generate concept notes**
3. **Find the request** to `/api/problems/:id/concept-notes`
4. **Check the response**:

#### What to look for:
```json
{
  "conceptNotes": [
    {
      "id": "concept-1",
      "type": "definition",
      "title": "...",
      "description": "...",
      "content": "200-400 word explanation...",  ← Should be long
      "relatedTopics": [...]
    },
    // ... should have 5-7 notes total
  ]
}
```

### Red Flags:

❌ **Only 3-4 notes returned**
- AI didn't follow the prompt
- Token limit hit (check `finishReason` in logs)
- Solution: Increase tokens further or use GPT-4 instead of mini

❌ **Content field is empty or short**
- AI didn't generate detailed content
- Check backend logs for truncation
- Solution: Be more explicit in prompt about content length

❌ **Wrong note types**
- Check the actual type values in response
- Update component filtering if needed

### Backend Logs to Check:

```
[INFO] Received response from OpenAI
    contentLength: 2534  ← Should be 2000-4000+
    model: "gpt-4o-mini"
    finishReason: "stop"  ← Should be "stop", not "length"

[INFO] Successfully parsed concept notes
    count: 5  ← Should be 5-7
```

### If finishReason is "length":
The response was truncated. Increase tokens:
```typescript
// In openaiService.ts
max_completion_tokens: 5000, // Increase from 4000
```

### If count is less than 5:
The AI didn't generate enough notes. Options:
1. Make prompt even more explicit
2. Add temperature parameter: `temperature: 0.7`
3. Use GPT-4 instead of GPT-4-mini for complex problems

## Quick Fixes

### Force AI to Generate More Notes:
Edit `createConceptNotesPrompt` to be even more explicit:

```typescript
**Task:** You MUST generate EXACTLY 6 detailed concept notes. Do not generate fewer than 6 notes.

I repeat: Generate AT LEAST 6 notes. This is mandatory.
```

### Force Detailed Content:
```typescript
**Each note MUST contain:**
- content: A detailed explanation of AT LEAST 200 words (count them!)
- Do NOT write short content. Each explanation must be comprehensive.
```

### Switch to GPT-4 for Better Quality:
In `openaiService.ts`, find the model selection:
```typescript
case 'concepts':
  return 'gpt-4o'; // Changed from 'gpt-4o-mini'
```

## Component Not Showing Notes?

### Check Type Filtering:
If notes aren't appearing in tabs, check what types are actually returned:

```javascript
// Add to ConceptNotesDisplay.js
console.log('All note types:', conceptNotes.map(n => n.type));
console.log('Filtered for concepts:', getFilteredNotes('concepts'));
```

### Expected Types:
- Key Concepts tab: `definition`, `concept`, `application`
- Formulas tab: `formula`
- Examples tab: `example`
- Study Tips tab: `tip`, `common-mistake`

If AI returns different types, update the filtering logic.

## Still Having Issues?

### 1. Check the JSON_PARSING_FIX.md
The JSON parsing issues from earlier might still be affecting responses.

### 2. Verify All Files Are Saved
Make sure all changes are saved and server is restarted.

### 3. Clear Cache
Sometimes the browser caches the old JavaScript:
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Or clear cache in DevTools

### 4. Check Backend Is Running
```bash
cd backend
npm run dev
# Should show: Server started on port 5000
```

### 5. Verify Frontend Build
If using production build:
```bash
npm run build
# Check for errors
```

## Contact Points for Further Help

### Log Files to Share:
1. Backend console output when generating notes
2. Browser console errors (if any)
3. Network tab showing the API request/response
4. The actual problem text being used

### Information to Provide:
- What problem you're testing with
- Which tab has issues (Formulas, Examples, etc.)
- How many notes are generated vs expected
- Whether buttons are completely non-functional or just not showing results

## Emergency Rollback

If you need to revert changes:
```bash
git diff HEAD  # See all changes
git checkout -- backend/src/services/openaiService.ts  # Revert backend
git checkout -- src/components/problem-solving/ConceptNotesDisplay.js  # Revert frontend
```
