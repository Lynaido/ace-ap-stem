# Duplicate Subject Tags Fix

## Problem Description

Duplicate subject tags were appearing on saved item cards for Solutions and Concept Notes. For example, "ap_physics_1_2" would appear twice in the tags section.

## Root Causes

1. **NotesHubPage.js Issue**: When transforming saved items for display, the code was filtering out duplicate subject/difficulty tags for PROBLEM type items, but NOT for SOLUTION, HINT, and CONCEPT_NOTE types.

2. **SavedItemCard.js Issue**: The card component was displaying both `item.subject` as a separate tag AND all tags from `item.tags[]` array, which often included the subject again.

## Files Modified

### 1. `src/pages/NotesHubPage.js`

**Lines Modified:** 142-176 (SOLUTION, HINT, and CONCEPT_NOTE cases)

**Changes:**
- Added tag filtering for SOLUTION type items to remove subject/difficulty duplicates
- Added tag filtering for HINT type items to remove subject/difficulty duplicates  
- Added tag filtering for CONCEPT_NOTE type items to remove subject/difficulty duplicates

**Code Added:**
```javascript
// Remove subject/difficulty from tags to avoid duplication
tags: (item.tags || []).filter(tag => 
  tag !== item.problem.subject && tag !== item.problem.difficulty
)
```

This filter was already present for PROBLEM type items but missing for other types.

### 2. `src/components/notes/SavedItemCard.js`

**Line Modified:** 101

**Changes:**
- Added filter to prevent displaying subject in tags array if it's already displayed separately

**Before:**
```javascript
{item.tags?.map((tag) => (
  <span key={tag}>{tag}</span>
))}
```

**After:**
```javascript
{item.tags?.filter(tag => tag !== item.subject).map((tag) => (
  <span key={tag}>{tag}</span>
))}
```

## Solution Strategy

Implemented a **defense-in-depth** approach:

1. **Primary Fix (NotesHubPage.js)**: Filter out duplicate tags at the data transformation layer when preparing items for display
2. **Secondary Fix (SavedItemCard.js)**: Add an extra safeguard at the display layer to prevent duplicates even if they slip through

This ensures duplicates are prevented at multiple levels.

## Testing

### Before Fix:
- Subject tag appeared twice: once as `item.subject` badge and once in `item.tags[]`
- Example: "ap_physics_1_2" shown twice on Solution and Concept Note cards

### After Fix:
- Subject appears only once as the primary badge
- Only additional tags (like "concepts") appear in the tags section
- No duplicate subject tags visible

## Verification Steps

1. Navigate to Notes Hub page
2. View saved Solution items - verify subject appears only once
3. View saved Concept Note items - verify subject appears only once, "concepts" tag also appears
4. View saved Hint items - verify subject appears only once
5. View saved Problem items - verify no regression (this already worked)

## Build Status

✅ Build successful with no new warnings or errors

```bash
npm run build
# File sizes after gzip:
#   119.39 kB (+45 B)  build\static\js\main.b0f21d10.js
```

## Related Issues

This fix also addresses:
- Better data normalization in the transform layer
- Consistent tag handling across all saved item types
- Cleaner UI display without visual clutter

---

**Fixed:** October 3, 2025  
**Issue:** Duplicate subject tags on saved item cards  
**Resolution:** Added tag deduplication at data transformation and display layers
