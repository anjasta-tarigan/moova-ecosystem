# PRD: Comprehensive Event Lifecycle & Multi-Role Management

## 1. Objective

To deliver a robust, fully synchronized, end-to-end event management system. This feature overhauls the creation flow for Superadmins (via modular configuration cards with progress tracking), adapts the Admin role to a Mentor persona, fully integrates the Judge evaluation UI, and strictly enforces progressive competition stages for Students. All interactions and data updates must be synchronized in real-time across all user roles, maintaining strict architectural separation and security.

## 2. User Stories

### Superadmin

- **As a Superadmin**, I want to create an event simply by entering its name (with auto-generated slug and default `draft` status), so that initial creation is frictionless.
- **As a Superadmin**, I want to manage an event through modular configuration cards (Configuration, FAQs, Criteria, Timeline, Rules, Resources, Event Community, Participants, Judges, Stages, Awards) with completion progress bars, so I can accurately track setup completeness.
- **As a Superadmin**, I want event statuses (`upcoming`, `open`, `closed`) to update automatically based on registration dates and remaining capacity.
- **As a Superadmin**, I want to add new Event Types or Eligibility categories inline without leaving the configuration page.

### Admin (Mentor)

- **As an Admin**, I want my event dashboard adapted to function as a University Mentor, allowing me to oversee and guide specific student teams assigned to my institution without having global Superadmin privileges.

### Judge

- **As a Judge**, I want to use the dedicated evaluation UI seamlessly, ensuring all assigned criteria and grading functions reflect the exact configuration set by the Superadmin.

### Student

- **As a Student**, I want to "pre-register" for `upcoming` events, which will automatically convert to "registered" once the event is `open`.
- **As a Student**, I want to "Assign Team" in the workspace (using an existing team or creating a new one) to collaborate on the event.
- **As a Student**, I must follow strict competition stages (Abstract -> Full Paper -> Final). If a stage deadline passes, I want to access it in a read-only state (no uploads).

### Public Users

- **As a Public Visitor**, I want to be prompted to create an account or log in if I attempt to register, save an event, or participate in the Event Community forum.

## 3. Functional Requirements

### 3.1 Interface Layer (Frontend)

- **Superadmin Dashboard:**
  - `Create New Event` button triggers a dedicated modal. Every input inside the modal must have a clear, descriptive label (e.g., `<label>Event Name</label>`) and real-time validation (instant error feedback). The initial creation form remains minimalistic.
  - Data Table actions restricted to `Manage` (Icon) and `Change Status` (Icon).
  - **Manage Event View (11 Configuration Cards):** Crucially, each card functions as its own independent domain with a focused form and localized save/submit action. **Every input field across all 11 cards must have a visible label and enforce real-time client-side validation (e.g., instant error/success feedback as the user types or selects).** Each card features an automated UI completion progress bar (e.g., `[██████░░░] 75%`).
    1. **Event Configuration:** Form for core details. Slug is auto-generated based on name. Event Type dropdown (`Online`, `Hybrid` with inline `+ Add New`). Dates: Event time, Reg Open, Reg Close. Status auto-calculates (Upcoming, Open, Closed). Replaces Banner URL with a media upload component. Fee input sets `- / free` if zero. SDGs field removed. Eligibility uses checkboxes (`University Student`, `Researcher` with an inline `+ Add Category` input for optimal rapid entry).
    2. **FAQs:** Form to add and manage general Frequently Asked Questions.
    3. **Judging & Grading Criteria:** Optimal form to define evaluation metrics and their respective percentage weights.
    4. **Timeline:** Form to build the event schedule (must reflect updates via real-time sync).
    5. **Rules & Eligibility:** Editor for event regulations and optional rulebook definition.
    6. **Resources & Downloads:** File management for participant assets (e.g., Guidebook, Submission Template, Judging Rubric).
    7. **Event Community (Q&A):** Isolated forum view for the event. If empty, displays an illustrated icon with "Forum Empty". Supports likes, replies, and "Top-View" highlighting.
    8. **Participant & Team:** Data table to monitor registrations, showing if a participant is `Individual` or displaying their `[Team Name]`.
    9. **Judge Assignment:** Interface to select and assign judges to the event.
    10. **Competition Stages:** Form to strictly set start times and deadlines for Stage 1 (Abstract Review), Stage 2 (Full Paper & Poster), and Stage 3 (Final Presentation).
    11. **Awards & Recognition:** A toggle switch to activate awards. If ON, displays a `Manage Awards` button opening a form for Main Winners (Ranks 1-3) and Honorable Mentions (Ranks 4-6).
- **Student Workspace:**
  - Remove the current "Start Submission" primary button and replace with an "Event Community" button that navigates to a dedicated, cleanly designed Event Community page.
  - **Event Community UI:** Threads must clearly display the author's full name, profile picture, and timestamp. The layout must be highly organized, visually distinguishing the original post from nested replies, with prominent 'Like' and 'Reply' buttons.
  - Stage navigation UI with strict phase progression. Each competition phase (Abstract, Full Paper, Final) has a defined start time and deadline.
  - Phases are locked (read-only/disabled) if `current_time < phase_start_time`.
  - Phases automatically lock/close for submissions if `current_time > phase_deadline`.
  - The next phase automatically unlocks precisely when its start time arrives.
  - Resource tab shows file download list or an empty state icon.
  - Button context: `Pre-register` -> `Registered`.
- **Public Gateway:** Intercept clicks on Restricted Actions (Register, Save, Event Community) and trigger the Auth/Login Modal.

### 3.2 Logic Layer (Business Rules & State)

- **Permanent ID, Auto-Slug & Realtime Status:**
  - Permanent Event ID generates automatically upon creation following a strict, immutable string format: `GIVA-[unique_id]-[year]` (e.g., `GIVA-a1b2c3-2026`).
  - Slug recalculates automatically upon Event Name changes.
  - Cron-job or dynamic getter computes Status: `Draft` (manual) -> `Upcoming` (now < regOpen) -> `Open` (regOpen <= now <= regClose & capacity > 0) -> `Closed` (now > regClose OR capacity == 0).
- **Inline Taxonomy Creation:** Endpoints to dynamically insert new Categories/Types and immediately return the updated list to the frontend avoiding page reloads.
- **Stage State Machine:** Validate student submissions on route entry and POST requests. Reject with 403 if the stage's temporal deadline has lapsed.
- **Realtime Sync:** Establish WebSockets (Socket.io) or SSE channels for Event Community, Timeline updates, and Participant count/status to broadcast changes instantly to connected clients.

### 3.3 Persistence Layer (Database Data Models)

- **Event Model Updates:** Add an immutable, unique identifier field automatically (e.g., `customId` or simply mapped as a custom primary key format string) for `GIVA-[unique_id]-[year]`. Remove `bannerUrl` (use a `Media` relation), remove `sdgs`.
- **New Entities/Relations:**
  - `EventStage`: Links Event -> Stage Type (Abstract, Paper, Final) -> Start Dates & Deadlines.
  - `EventAward`: Ranks 1-3 (Main), 4-6 (Honorable).
  - `EventCommunityThread`: Linked to `eventId` & `authorId` (User relation for name and profile picture). Properties: `id`, `title`, `content`, `likeCount`, `replyCount`, `createdAt`.
  - `EventCommunityMessage` (Replies): Linked to `threadId` & `authorId`. Properties: `id`, `content`, `likeCount`, `createdAt`.
  - `EventCommunityLike`: Join table (`userId`, `threadId`, `messageId`) to ensure users can only like a thread or reply once.
  - `EventResource`: File mappings for guidebooks/rubrics.
  - `EventCriteria`: Bound to event for judge evaluation weights.

## 4. Non-Functional Requirements

- **Security (RBAC):** Strict middleware enforcement. Mentors (Admins) cannot edit Event configurations. Public users cannot mutate Event Community threads. Judges can only POST grades for assigned submissions.
- **Data Integrity:** File uploads must be securely processed (e.g., signed S3 URLs) and not stored as raw binaries in the DB.
- **Performance:** Realtime DB listeners or Redis Pub/Sub must be optimized to prevent memory leaks on high-traffic Event Community forums.

## 5. Acceptance Criteria (DoD)

- [ ] Superadmin can create an event via the quick modal; permanent unique ID generates automatically as `GIVA-[unique_id]-[year]` and slug generates securely without collisions.
- [ ] The "Manage" page displays 11 cards, each accurately tracking its configuration percentage.
- [ ] Every input field in the Superadmin Event forms has a clear label and functions with real-time client-side validation.
- [ ] Event status dynamically auto-updates between Upcoming, Open, and Closed without manual DB intervention.
- [ ] Inline additions for Event Types and Eligibility update the form options immediately.
- [ ] Admins log in and see a Mentor-tailored dashboard scoped to their institution/teams.
- [ ] Event Community threads and replies consistently display the author's full name, profile picture, and timestamp in a cleanly organized layout.
- [ ] Students can "Pre-Register" for upcoming events.
- [ ] The "Start Submission" workspace button is replaced by an "Event Community" button routing to the event's dedicated forum.
- [ ] Student workspace strictly enforces phase progression: phases remain locked before their start time and immediately lock submissions when their deadline expires.
- [ ] Unauthenticated users are strictly blocked from interacting with the Event Community, Saving, or Registering events, gracefully redirecting to login.
- [ ] Event Community supports Likes and Replies, correctly isolates logic from global communities, and dynamically surfaces "Top-View" threads.
- [ ] All Role UIs (Admin, Judge, Student, Superadmin) synchronize crucial data (e.g., timeline changes, participant joins, new community threads) seamlessly via WebSockets.

## 6. Technical Reference

- **Prisma Targets:** `Event`, `EventStage` (New), `EventAward` (New), `EventCommunityThread` (New), `EventCommunityMessage` (New), `Team`, `Submission`.
- **Controllers/Services:** `events.service.ts` (Status logic), `stages.controller.ts` (Deadline enforcement).
- **Frontend UI:** `pages/superadmin/ManageEvent.tsx`, `components/admin/EventConfigCard.tsx`, `pages/DashboardWorkspace.tsx`.

## 7. Agent Implementation Workflow (Execution Plan)

To ensure precise, stable, and incremental delivery of this comprehensive PRD, the AI coding agent must execute tasks in the following strict order, validating at each step before proceeding to the next phase:

### Phase 1: Persistence & Foundation (Database & API Shell)

1. **Update Prisma Schema:** Add the new permanent ID format `GIVA-[unique_id]-[year]` logic, update `Event` model (remove `sdgs`, `bannerUrl`), and create new models (`EventStage`, `EventAward`, `EventCommunityThread`, `EventCommunityMessage`).
2. **Prisma Generate & Seed:** Run `prisma generate` and apply migrations to ensure database stability.
3. **Core API Routes (Events):** Build or refactor backend endpoints (`POST /events`, `GET /events/:slug`) to handle the new minimal `Create Event` flow (only Name required, auto-generate slug and permanent ID).

### Phase 2: Superadmin Backend Logic (The 11 Modules)

1. **Event State Machine:** Implement cron jobs or dynamic getter logic in `events.service.ts` to compute statuses (`upcoming`, `open`, `closed`).
2. **Modular Configurations API:** Construct strict endpoints for each of the 11 cards (e.g., `PATCH /events/:id/config`, `PATCH /events/:id/stages`, `PATCH /events/:id/awards`) ensuring localized saving and validation logic.
3. **Inline Taxonomies:** Build endpoints to support the "Add New" feature for Event Types and Eligibility.

### Phase 3: Superadmin UI Construction (Modular Components)

1. **Dashboard Table & Modal:** Build the minimalistic "Create Event" modal with real-time validation and the "Manage/Status" data table actions.
2. **Develop the 11 Independent Cards:** Create distinct React components under `components/admin/` for each specific card configuration, strictly mapping them to their designated API endpoint and incorporating real-time validation feedback.
3. **Completion Progress Engine:** Build a frontend utility to calculate and display the percentage `[██████░░░]` progress bar atop each card based on the API responses.

### Phase 4: Multi-Role Integration & Realtime Sync

1. **WebSockets Integration:** Set up Socket.io/SSE channels on the backend for handling Real-time Event Community updates and Timeline alterations, followed by listening hooks on the React frontend.
2. **Student Workspace & Enforcement:** Overhaul the student UI—replace "Start Submission" with the "Event Community" route. Implement the Stage State logic (read-only locking/unlocking phases based on configured deadlines).
3. **Judge & Admin Personas:** Refine Judge UI to pull criteria correctly from the Superadmin's configuration. Adapt Admin restrictions to strictly view their assigned mentor/institution scopes.

_Note for Agent: Do not combine Phases. Ensure the codebase successfully compiles and lints passing all Phase-specific criteria before initializing the subsequent Phase._
