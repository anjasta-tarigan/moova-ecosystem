# PRD: Comprehensive Event Lifecycle & Multi-Role Management

## 1. Objective
To deliver a robust, fully synchronized, end-to-end event management system. This feature overhauls the creation flow for Superadmins (via modular configuration cards with progress tracking), adapts the Admin role to a Mentor persona, fully integrates the Judge evaluation UI, and strictly enforces progressive competition stages for Students. All interactions and data updates must be synchronized in real-time across all user roles, maintaining strict architectural separation and security.

## 2. User Stories

### Superadmin
* **As a Superadmin**, I want to create an event simply by entering its name (with auto-generated slug and default `draft` status), so that initial creation is frictionless.
* **As a Superadmin**, I want to manage an event through modular configuration cards (Configuration, FAQs, Criteria, Timeline, Rules, Resources, Event Community, Participants, Judges, Stages, Awards) with completion progress bars, so I can accurately track setup completeness.
* **As a Superadmin**, I want event statuses (`upcoming`, `open`, `closed`) to update automatically based on registration dates and remaining capacity.
* **As a Superadmin**, I want to add new Event Types or Eligibility categories inline without leaving the configuration page.

### Admin (Mentor)
* **As an Admin**, I want my event dashboard adapted to function as a University Mentor, allowing me to oversee and guide specific student teams assigned to my institution without having global Superadmin privileges.

### Judge
* **As a Judge**, I want to use the dedicated evaluation UI seamlessly, ensuring all assigned criteria and grading functions reflect the exact configuration set by the Superadmin.

### Student
* **As a Student**, I want to "pre-register" for `upcoming` events, which will automatically convert to "registered" once the event is `open`.
* **As a Student**, I want to "Assign Team" in the workspace (using an existing team or creating a new one) to collaborate on the event.
* **As a Student**, I must follow strict competition stages (Abstract -> Full Paper -> Final). If a stage deadline passes, I want to access it in a read-only state (no uploads).

### Public Users
* **As a Public Visitor**, I want to be prompted to create an account or log in if I attempt to register, save an event, or participate in the Event Community forum.

## 3. Functional Requirements

### 3.1 Interface Layer (Frontend)
*   **Superadmin Dashboard:**
    *   `Create New Event` button triggers a single-input modal (Event Name).
    *   Data Table actions restricted to `Manage` (Icon) and `Change Status` (Icon).
    *   **Manage Event View:** 11 distinct Card components, each featuring a UI completion progress bar (e.g., `[██████░░░] 75%`).
        *   *Config Card:* Dropdowns for Type (`Online`, `Hybrid` with `+ Add New` inline UI), Dates, Fee logic (`- / free` if 0), Eligibility checkboxes (`University Student`, `Researcher` with `+ Add New` inline). Media upload component replaces the old Banner URL text field.
        *   *Event Community Card:* Isolated forum view specific to this event (separated from global community). Includes 'Like' and 'Reply' buttons on threads. Threads with high engagement (likes + replies) are highlighted as 'Top-View'. Empty state shows an illustrated icon with "Forum Empty. Start a discussion!" text.
        *   *Participants Card:* Table showing User Name and Team Status (e.g., `Individual` or `[Team Name]`).
        *   *Stages Card:* Define start dates and deadlines for Phase 1 (Abstract), Phase 2 (Paper/Poster), Phase 3 (Final) to enable automatic stage progression.
        *   *Awards Card:* Toggle switch. When active, reveals the "Manage Awards" form for ranks 1-6.
*   **Student Workspace:**
    *   Replace the current "Start Submission" primary button with an "Event Community" button that navigates to a dedicated, cleanly designed Event Community page.
    *   **Event Community UI:** Threads must clearly display the author's full name, profile picture, and timestamp. The layout must be highly organized, visually distinguishing the original post from nested replies, with prominent 'Like' and 'Reply' buttons.
    *   Stage navigation UI with strict phase progression. Each competition phase (Abstract, Full Paper, Final) has a defined start time and deadline.
    *   Phases are locked (read-only/disabled) if `current_time < phase_start_time`.
    *   Phases automatically lock/close for submissions if `current_time > phase_deadline`.
    *   The next phase automatically unlocks precisely when its start time arrives.
    *   Resource tab shows file download list or an empty state icon.
    *   Button context: `Pre-register` -> `Registered`.
*   **Public Gateway:** Intercept clicks on Restricted Actions (Register, Save, Event Community) and trigger the Auth/Login Modal.

### 3.2 Logic Layer (Business Rules & State)
*   **Auto-Slug & Realtime Status:** 
    *   Slug recalculates automatically upon Event Name changes.
    *   Cron-job or dynamic getter computes Status: `Draft` (manual) -> `Upcoming` (now < regOpen) -> `Open` (regOpen <= now <= regClose & capacity > 0) -> `Closed` (now > regClose OR capacity == 0).
*   **Inline Taxonomy Creation:** Endpoints to dynamically insert new Categories/Types and immediately return the updated list to the frontend avoiding page reloads.
*   **Stage State Machine:** Validate student submissions on route entry and POST requests. Reject with 403 if the stage's temporal deadline has lapsed.
*   **Realtime Sync:** Establish WebSockets (Socket.io) or SSE channels for Event Community, Timeline updates, and Participant count/status to broadcast changes instantly to connected clients.

### 3.3 Persistence Layer (Database Data Models)
*   **Event Model Updates:** Remove `bannerUrl` (use a `Media` relation), remove `sdgs`.
*   **New Entities/Relations:**
    *   `EventStage`: Links Event -> Stage Type (Abstract, Paper, Final) -> Start Dates & Deadlines.
    *   `EventAward`: Ranks 1-3 (Main), 4-6 (Honorable).
    *   `EventCommunityThread`: Linked to `eventId` & `authorId` (User relation for name and profile picture). Properties: `id`, `title`, `content`, `likeCount`, `replyCount`, `createdAt`.
    *   `EventCommunityMessage` (Replies): Linked to `threadId` & `authorId`. Properties: `id`, `content`, `likeCount`, `createdAt`.
    *   `EventCommunityLike`: Join table (`userId`, `threadId`, `messageId`) to ensure users can only like a thread or reply once.
    *   `EventResource`: File mappings for guidebooks/rubrics.
    *   `EventCriteria`: Bound to event for judge evaluation weights.

## 4. Non-Functional Requirements
*   **Security (RBAC):** Strict middleware enforcement. Mentors (Admins) cannot edit Event configurations. Public users cannot mutate Event Community threads. Judges can only POST grades for assigned submissions.
*   **Data Integrity:** File uploads must be securely processed (e.g., signed S3 URLs) and not stored as raw binaries in the DB.
*   **Performance:** Realtime DB listeners or Redis Pub/Sub must be optimized to prevent memory leaks on high-traffic Event Community forums.

## 5. Acceptance Criteria (DoD)
- [ ] Superadmin can create an event via the quick modal; slug generates securely without collisions.
- [ ] The "Manage" page displays 11 cards, each accurately tracking its configuration percentage.
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
*   **Prisma Targets:** `Event`, `EventStage` (New), `EventAward` (New), `EventCommunityThread` (New), `EventCommunityMessage` (New), `Team`, `Submission`.
*   **Controllers/Services:** `events.service.ts` (Status logic), `stages.controller.ts` (Deadline enforcement).
*   **Frontend UI:** `pages/superadmin/ManageEvent.tsx`, `components/admin/EventConfigCard.tsx`, `pages/DashboardWorkspace.tsx`.
