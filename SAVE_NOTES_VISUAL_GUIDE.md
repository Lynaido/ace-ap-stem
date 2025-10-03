# Save Notes Feature - Visual Guide

## 🎨 UI Components Overview

### 1. Save Notes Modal
```
┌─────────────────────────────────────────┐
│  Save Solution                      ✕   │
├─────────────────────────────────────────┤
│                                         │
│  Title *                                │
│  ┌─────────────────────────────────┐   │
│  │ Problem Title - Solution        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Folder (Optional)                      │
│  ┌─────────────────────────────────┐   │
│  │ ▼ Select folder...              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Tags (Optional)                        │
│  ┌─────────────────────────────────┐   │
│  │ physics, mechanics, energy      │   │
│  └─────────────────────────────────┘   │
│  Example: physics, mechanics, energy    │
│                                         │
│  ☑ Mark as starred                      │
│                                         │
│  ┌────────┐  ┌──────────────────┐      │
│  │ Cancel │  │ Save to Notes    │      │
│  └────────┘  └──────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

### 2. View Saved Item Modal
```
┌────────────────────────────────────────────────┐
│  [SOLUTION] Problem Title              ✕       │
│  physics  |  mechanics  |  energy               │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │  Problem                              │     │
│  │  ────────────────────────────────     │     │
│  │  What is the velocity of object...    │     │
│  │                                        │     │
│  │  [Problem Image if available]          │     │
│  └──────────────────────────────────────┘     │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │  Solution                              │     │
│  │  ────────────────────────────────     │     │
│  │  Step 1 of 5                           │     │
│  │  ▓▓▓▓░░░░░░ 20%                        │     │
│  │                                        │     │
│  │  [Step by step solution display]       │     │
│  │                                        │     │
│  │  Final Answer: 15 m/s                  │     │
│  └──────────────────────────────────────┘     │
│                                                 │
├────────────────────────────────────────────────┤
│  [Practice This]  [Delete]  [Close]           │
└────────────────────────────────────────────────┘
```

### 3. Notes Hub with Cards
```
┌─────────────────────────────────────────────────────────────┐
│  Notes Hub                                                   │
│  Review saved solutions, chats, and custom practice sets     │
│                                                              │
│  ┌──────────────────┐  ┌────────┐  ┌──────────┐           │
│  │ 🔍 Search notes..│  │Filters●│  │New Folder│[Save Item]│
│  └──────────────────┘  └────────┘  └──────────┘           │
│                                                              │
│  ★ Starred ────────────────────────────────── 2 saved       │
│  ┌──────────┐  ┌──────────┐                               │
│  │ SOLUTION │  │ CONCEPT  │  ──▶                           │
│  │ Physics  │  │ Math     │                                │
│  └──────────┘  └──────────┘                               │
│                                                              │
│  All Items ──────────────────────────────────               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ SOLUTION │  │ CONCEPT  │  │ HINT     │                │
│  │ Physics  │  │ Biology  │  │ Chem     │                │
│  │ Problem 1│  │ Cell Div.│  │ Balance  │                │
│  │ ★        │  │          │  │ ★        │                │
│  │ physics  │  │ biology  │  │ chemistry│                │
│  │[Review]  │  │[Review]  │  │[Review]  │                │
│  │[Study]   │  │[Study]   │  │[Study]   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 User Interaction Flow

### Saving a Solution
```
Solve Problem Page
        │
        ├─► Generate Solution
        │         │
        ├─────────▼
        │   [Save Solution] button clicked
        │         │
        │         ▼
        │   SaveNotesModal opens
        │         │
        │         ├─► User enters title
        │         ├─► User selects folder
        │         ├─► User adds tags
        │         ├─► User marks as starred
        │         │
        │         ▼
        │   [Save to Notes] clicked
        │         │
        │         ▼
        │   API call to /api/saved-items
        │         │
        │         ├─► Success
        │         │     │
        │         │     ├─► Toast notification
        │         │     └─► Modal closes
        │         │
        │         └─► Error
        │               └─► Error message shown
        │
        ▼
   Navigate to Notes Hub
        │
        └─► Item appears in grid
```

### Viewing a Saved Item
```
Notes Hub Page
        │
        ├─► User sees saved items grid
        │         │
        ├─────────▼
        │   User clicks on card
        │         │
        │         ▼
        │   ViewSavedItemModal opens
        │         │
        │         ├─► Shows problem context
        │         ├─► Shows saved content
        │         │     │
        │         │     ├─► Solution: Step display
        │         │     ├─► Concept: Formatted text
        │         │     ├─► Hint: Hint content
        │         │     └─► Problem: Full details
        │         │
        │         ▼
        │   User chooses action:
        │         │
        │         ├─► [Practice This]
        │         │     └─► Navigate to Study Mode
        │         │
        │         ├─► [Delete]
        │         │     ├─► Confirm deletion
        │         │     └─► Item removed
        │         │
        │         └─► [Close]
        │               └─► Modal closes
        │
        ▼
   Back to Notes Hub
```

## 🎯 Component Relationships

```
SolveProblemsPage
    │
    ├─► SolutionDisplay
    │       │
    │       └─► SaveNotesModal
    │               │
    │               └─► AppContext.saveItem()
    │                       │
    │                       └─► API.savedItemsAPI.create()
    │
    └─► ConceptNotesDisplay
            │
            └─► SaveNotesModal
                    │
                    └─► AppContext.saveItem()


NotesHubPage
    │
    ├─► SavedItemCard (multiple)
    │       │
    │       └─► onClick → setViewingItem()
    │
    └─► ViewSavedItemModal
            │
            ├─► Displays item content
            │       │
            │       ├─► SolutionDisplay (for solutions)
            │       ├─► Formatted content (for concepts)
            │       └─► Simple content (for hints)
            │
            └─► Actions
                    │
                    ├─► Practice This → Navigate
                    ├─► Delete → API call
                    └─► Close → setViewingItem(null)
```

## 🎨 Style Guide

### Colors
```
Primary Action: #f97316 (Orange)
   Usage: Save buttons, primary CTAs

Solution Badge: #3b82f6 (Blue)
   Usage: Solution type indicator

Concept Badge: #f59e0b (Amber)
   Usage: Concept note type indicator

Hint Badge: #8b5cf6 (Purple)
   Usage: Hint type indicator

Problem Badge: #ec4899 (Pink)
   Usage: Problem type indicator

Background: #ffffff (White)
   Usage: Cards, modals

Border: rgba(15, 23, 42, 0.08)
   Usage: Card borders

Text Primary: #0f172a (Dark)
   Usage: Headings, important text

Text Secondary: #64748b (Gray)
   Usage: Descriptions, metadata
```

### Typography
```
Headings:
  H1: 2.1rem, font-weight: 600
  H2: 1.5rem, font-weight: 600
  H3: 1.125rem, font-weight: 600

Body:
  Regular: 0.95rem, font-weight: 400
  Small: 0.875rem, font-weight: 400
  Tiny: 0.75rem, font-weight: 500

Buttons:
  Regular: 0.95rem, font-weight: 600
  Small: 0.875rem, font-weight: 600
```

### Spacing
```
Card Padding: 1.75rem
Modal Padding: 1.5rem
Gap between items: 1rem - 2rem
Border Radius: 8px - 20px
```

### Shadows
```
Card: 0 12px 32px -16px rgba(15, 23, 42, 0.25)
Card Hover: 0 20px 48px -20px rgba(249, 115, 22, 0.35)
Modal: 0 32px 64px -32px rgba(15, 23, 42, 0.4)
```

## 📱 Responsive Breakpoints

```
Desktop: > 1024px
  - Multi-column grid (3-4 columns)
  - Side-by-side layout
  - Full featured modals

Tablet: 768px - 1024px
  - 2-3 column grid
  - Adjusted modal sizes
  - Touch-friendly

Mobile: < 768px
  - Single column
  - Full-screen modals
  - Stacked buttons
  - Larger touch targets
```

## ⚡ Performance Tips

1. **Lazy Loading**
   - Modals only render when open
   - Images load on demand

2. **Memoization**
   - Use React.memo for cards
   - useMemo for filtered lists

3. **Debouncing**
   - Search input debounced
   - Filter changes debounced

4. **Optimistic Updates**
   - UI updates before API response
   - Rollback on error

## 🔐 Security Considerations

1. **Authentication**
   - All API calls require auth token
   - User can only access own items

2. **Validation**
   - Title required
   - Tag format validation
   - Folder ownership check

3. **Sanitization**
   - User input sanitized
   - XSS prevention
   - SQL injection prevention

---

**Visual Guide Version**: 1.0.0
**Last Updated**: October 3, 2025
