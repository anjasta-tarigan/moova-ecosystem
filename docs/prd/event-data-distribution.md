# Moova Ecosystem - Event Data Distribution & Display

## 1. Objective

To structure the retrieval and presentation of Event data across the Moova Ecosystem. Since event creation is exclusively handled by Superadmins, this PRD outlines how the resulting Event data is filtered, optimized, and displayed to 4 distinct audiences: Public (Guests), Students (Participants), Judges, and Admins. The goal is to enforce strict data visibility rules, optimize network payloads, and maintain role-specific user experiences without leaking sensitive internal states.

## 2. User Stories

- **As a Public Visitor**, I want to browse an attractive catalog of published events on the landing page and events page, so I can discover and register for competitions.
- **As a Student**, I want to see my currently registered events and explore new open events in my dashboard, so I can track my active participation and find new opportunities.
- **As a Judge**, I want to see only the events I am assigned to evaluate, so I can focus purely on my scoring duties without clutter.
- **As an Admin/Superadmin**, I want a comprehensive tabular view of all events (including Drafts), so I can monitor operational metrics, registrants, and event progress.

## 3. Functional Requirements (Broken down by Layers)

### 3.1 Interface Layer (UI/UX)

- **Public Interface (`EventsPage.tsx`, `EventDetailPage.tsx`, `LandingPage.tsx`):**
  - Display events using a card layout featuring the uploaded banner image, Title, Date, Format (Online/Offline), and Fee.
  - Show explicit status tags ("Open Registration", "Upcoming", "Closed").
  - Implement Search and Filter by Category/Format.
- **Student Dashboard (`DashboardEventHub.tsx`):**
  - Toggle between "My Registered Events" and "Discover Events".
  - Show progress bars or concise status text based on their `Submission` status within an event.
- **Judge Dashboard (`JudgeEventView.tsx`, `JudgeHome.tsx`):**
  - Display a clean list/grid of events tied directly to their `JudgeAssignment`.
  - Provide a quick-access button leading to the `JudgeScoringView.tsx` for that event.
- **Admin System (`AdminEvents.tsx`, `AdminEventsColumns.tsx`):**
  - Use `DataTable.tsx` to list all events.
  - Columns: Event Title, Organizer, Status, Format, Registrant Count (aggregated), and Actions (View/Manage).
  - Use `StatusBadge.tsx` to color-code Event States (Draft: Gray, Open: Green, Upcoming: Blue, Closed: Red).

### 3.2 Logic Layer (Business Rules & State)

- **Visibility & State Filtering:**
  - **Public/Student Logic:** Any API call fetching the event catalog must append a hard filter: `status IN ['OPEN', 'UPCOMING', 'CLOSED']`. `DRAFT` events strictly return 404 or are omitted from lists.
  - **Judge Logic:** The query must JOIN/Include `judgeAssignments` where `userId === currentUser.id`. Judges should only see events that are strictly active for judging (post-submission or matching timeline).
  - **Admin Logic:** No status filter. Admins see everything, but actions like "Edit/Delete" remain disabled or hidden (enforcing Superadmin-only mutation rules). Admins can only view and manage internal operations related to the event (e.g., verifying teams).
- **Data Truncation Rule:**
  - Catalog list endpoints must strip out `fullDescription`, `faqs`, and relational deep-dives to minimize payload size. Only standard metadata should be returned.

### 3.3 Persistence Layer (Data Access & Schema)

- **API Endpoint Structuring:**
  - `GET /api/events/public` -> Unauthenticated. Returns cached list of active events.
  - `GET /api/events/student` -> Authenticated (Student). Returns registered events via `EventRegistration` aggregation.
  - `GET /api/events/judge` -> Authenticated (Judge). Fetches via `JudgeAssignment` relation.
  - `GET /api/events/admin` -> Authenticated (Admin/Superadmin). Returns all rows with count relations (`_count: { registrations: true, submissions: true }`).
- **Data Integrity / Querying:**
  - Use Prisma's `select` projection to strictly limit fetched fields per role role. Do not execute `select *`.

## 4. Non-Functional Requirements

- **Performance:** Public catalog endpoint (`/api/events/public`) must be heavily cached (e.g., Redis or CDN cache) as it is read-heavy and updates infrequently. Add pagination (Limit/Offset or Cursor) for Admin tables.
- **Security:** Ensure direct requests to `/api/events/:id` validate user context. If a user queries a `DRAFT` event by guessing the slug, the system must throw a 403 or 404 unless the token contains Admin/Superadmin claims.
- **Scalability:** The architecture must cleanly separate API scopes to prevent heavy administrative aggregation queries from affecting public catalog speed.

## 5. Acceptance Criteria (DoD)

- [ ] Public Event page displays only non-draft events and loads within 1.5 seconds.
- [ ] Students can view two distinct states: Events they are registered for vs. general open catalog.
- [ ] Judges log in and instantly see a filtered dashboard containing only their assigned events.
- [ ] Admins can access `AdminEvents.tsx` table, seeing all statuses, including Drafts, with accurate registrant counts.
- [ ] Attempting to hit the public API for a Draft event ID/slug returns a 404 error.
- [ ] All network payloads verify that `fullDescription` is excluded on list views to save bandwidth.

## 6. Technical Reference

- **Modified UI/Frontend Files:**
  - `pages/EventsPage.tsx` & `pages/EventDetailPage.tsx`
  - `pages/DashboardEventHub.tsx`
  - `pages/JudgeEventView.tsx` & `pages/JudgeHome.tsx`
  - `pages/admin/AdminEvents.tsx` & `pages/admin/AdminEventsColumns.tsx`
- **Existing Components:**
  - `components/admin/DataTable.tsx`
  - `components/admin/StatusBadge.tsx`
- **Required Backend/API Extensions:**
  - `backend/src/modules/events/event.controller.ts` (Implement specific role-based retrieval methods: `getPublicEvents`, `getStudentEvents`, `getJudgeEvents`, `getAdminEvents`).
  - Prisma queries must utilize `_count` for Admins and `include:{ EventRegistration: true }` for Students.
