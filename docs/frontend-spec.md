# AAS Frontend Specification (v4)

Status: Revised (Frontend only – backend & infra to follow later)
Owner: Frontend Team
Last Updated: 2025-09-16

## 1. Goals
Deliver a modular, accessible, and easily extensible React frontend for Ace AP STEM (AAS) to support: User Authentication, Problem Solving, Step-by-Step Hints, AI Tutor Chat, Notes Hub, and Study Mode. Focus now is purely UI/UX + frontend state management with clean seams for future backend/API integration.

## 2. Tech Stack
- React (CRA scaffold currently) – consider migration to Vite later for faster builds.
- Styling: Existing CSS files + utility classes. Introduce design tokens via CSS variables in `src/styles/main.css`.
- State: Local component state + lightweight global context (to be added).
- Routing: `react-router-dom`.
- Forms: Controlled components using new `<Input />` primitive.

## 3. Global App Structure
```
<App>
  <Header />
  <Route Switch> ... </Route>
  <Footer />
  <ChatPanel />
</App>
```

## 4. Design Language
(Content Unchanged - see `src/styles/main.css` for tokens)

## 5. Shared Components (Primitives)
| Component | Props | Purpose |
|-----------|-------|---------|
| `Button` | `variant`, `size`, `disabled`, `icon`, `onClick` | Consistent buttons |
| `Tabs` | `tabs[]`, `active`, `onChange` | Switch between panels |
| `Select` | `options[]`, `value`, `onChange`, `placeholder` | Custom styled dropdown |
| `Card` | `title`, `children`, `actions[]` | Uniform surface for content |
| `Input` | `type`, `value`, `onChange`, `placeholder`, `label` | Styled and accessible form inputs |
| `Spinner` | `size` | Loading indicator |
| `EmptyState` | `icon`, `title`, `message`, `action` | For blank content areas |

## 6. Domain Components
### 6.1 Header
- **Logged-Out State:** Shows the AAS logo, primary navigation links (Features, About, etc.), and a primary `Button` for "Sign In".
- **Logged-In State:** Replaces the "Sign In" button with a user avatar/menu. Clicking the avatar opens a dropdown with links to "Notes Hub" and a "Sign Out" button.
- The `Sign Out` button will log the user out (mocked) and revert the header to its logged-out state.

(Subsequent sections renumbered)

## 7. Pages
### 7.1 LandingPage
- **Summary:** The main marketing and entry page for the application.
- **Design and UI:** This page uses a full-width hero section to grab attention. Subsequent sections (`HowItWorks`, `FeatureCards`) are contained within a standard `PageContainer` width for readability. The design is vibrant, using images and gradient text to be engaging.

### 7.2 SolveProblemsPage
- **Summary:** The core feature page where users input problems to be solved.
- **Design and UI:** Uses a `TwoColumnLayout`. The left column contains the main content, and the right contains the docked `ChatPanel`. The problem input area is a `<Card>` at the top. Below it, a second `<Card>` will appear to display the results (`SolutionDisplay` or `HintsDisplay`). This creates a clear visual hierarchy of action and result.

### 7.4 TutorPage
- **Summary:** A dedicated, focused view for interacting with the AI Tutor.
- **Design and UI:** This is a simple, single-column page. The `ChatPanel` component is expanded to fill the entire main content area, providing a familiar, messenger-like experience. A banner may appear at the top to show the context of the active problem.

### 7.5 NotesHubPage
- **Summary:** The user's personal library of saved problems, solutions, and chats.
- **Design and UI:** A two-column layout. The left column is the `<FolderSidebar>`, a vertical list where the active folder is highlighted. The right, main content area is a responsive grid of `<SavedItemCard>` components. An `<EmptyState>` component is shown if no items exist in the selected folder.

### 7.6 StudyModePage
- **Summary:** Allows users to practice variations of a saved problem.
- **Design and UI:** If no problem is selected, it shows a centered `<EmptyState>` guiding the user to the Notes Hub. When a problem is active, the top of the page shows the selected problem in a `<Card>`. Below it, a list of generated "variant" problems are displayed, each in its own `<Card>`.

### 7.7 AboutUsPage / PrivacyPage / FAQPage / ContactPage
- **Summary:** Static informational pages.
- **Design and UI:** These pages use a simple, clean, single-column layout. Content is placed in a `PageContainer` for consistent width and readability. The focus is on clear typography and spacing, using variables from the design language.

### 7.8 SignInPage
- **Summary:** The page for existing users to log in.
- **Design and UI:** A minimalist, single-column page with a `<Card>` centered vertically and horizontally. The page background uses `--color-bg-alt` to make the card stand out. The card contains a title, two `<Input>` primitives for email and password, and a full-width primary `<Button>`. All elements have consistent spacing and corner radii, creating a sleek and focused experience.

### 7.9 SignUpPage
- **Summary:** The page for new users to register.
- **Design and UI:** The design is nearly identical to the `SignInPage` for consistency—a centered `<Card>` on a subtle background. It will contain more `<Input>` fields for registration (e.g., Full Name, Confirm Password) but follows the same clean, modern aesthetic.

(Sections 8-18 are re-validated but largely unchanged)

## 19. Deferred / Not In Scope
- Real backend API integration and database persistence.
- File upload to cloud storage.
- Rich math rendering (e.g., LaTeX) – will use plain text for now.
- PDF export or printing of content.

## 20. QA Checklist (Before Merge)
(Content Unchanged)

## 21. Implementation Task List
- [x] **Phase 1: Core Setup & Primitives**
  - [x] Create folder structure for new components and pages.
  - [x] Implement `AppContext` with initial state and mock actions.
  - [x] Implement shared primitive components: `Button`, `Card`, `Select`, `Spinner`, `EmptyState`, `Tabs`, `Input`.
- [x] **Phase 2: Authentication UI**
  - [x] Build the `SignInPage` with email/password inputs.
  - [x] Build the `SignUpPage` with name/email/password inputs.
  - [x] Ensure forms use primitive components.
- [ ] **Phase 3: Problem Solving Core Feature**
  - [ ] Build the `ProblemInputModule` component.
  - [ ] Build the `SolutionDisplay` and `HintsDisplay` components.
  - [ ] Assemble the `SolveProblemsPage`.
- [ ] **Phase 4: AI Tutor & Chat**
  - [ ] Build the `ChatPanel` component and integrate it.
  - [ ] Build the dedicated `TutorPage`.
- [ ] **Phase 5: Notes Hub & Persistence**
  - [ ] Build the `FolderSidebar` and `SavedItemCard` components.
  - [ ] Assemble the `NotesHubPage`.
- [ ] **Phase 6: Study Mode**
  - [ ] Build the `StudyModeGenerator` component and assemble the `StudyModePage`.
- [ ] **Phase 7: Finalization**
  - [ ] Populate static content pages.
  - [ ] Conduct final UI/UX polish and responsive testing.

---
End of Frontend Spec v4.
---