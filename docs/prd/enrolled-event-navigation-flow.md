# PRD: Enrolled Event Navigation Redesign

## 1. Objective
To redesign the navigation flow for users interacting with events they have already registered for. Previously, clicking on an enrolled event directed the user straight into the active workspace. The new flow requires the user to land on the designated Event Detail page first. This acts as a centralized information hub, providing crucial context (schedules, announcements, status) before the user purposefully navigates into the workspace.

## 2. User Stories
* **As a Participant**, I want to click on an event I have joined and be taken to its detail page first, so that I can review recent announcements, my team status, and the event schedule.
* **As a Participant**, I want a clear, context-aware "Enter Workspace" call-to-action on the event detail page, so that I can transition to my tasks when I am ready.
* **As a System Administrator**, I want to ensure that access to the workspace is gated through the event detail interface to standardize the user lifecycle and ensure they see important updates.

## 3. Functional Requirements

### 3.1 Interface Layer (Frontend)
* **Registered Events List:** Update the navigation links on the cards/list items for enrolled events on the dashboard. Change the router link target from the workspace route to the event detail route (e.g., `/dashboard/events/:slug`).
* **Event Detail View:** 
    * Present a contextualized view for enrolled users.
    * Render an "Enter Workspace" (or similar) primary action button exclusively for users whose registration status is verified as active/approved.
* **Workspace Navigation:** The "Enter Workspace" button must securely redirect the user to the dedicated workspace environment for that specific event.

### 3.2 Logic Layer (Backend Services)
* **Contextual Data Delivery:** The event detail endpoint (`GET /api/student/events/:slug`) must return the user's specific registration metadata alongside the event details, so the front-end can conditionally render the workspace entry button.
* **Authorization Gateway:** The backend must independently verify the user's registration status and event timeline before granting access to Workspace-specific API resources. 

### 3.3 Persistence Layer (Database)
* **No Structural Changes Required:** This feature relies on the existing `Event`, `User`, and `Registration` data models. 
* **Query Optimization:** Ensure the query fetching the event includes the user's `Registration` relation efficiently to avoid N+1 query problems when rendering the dashboard list and detail pages.

## 4. Non-Functional Requirements
* **Performance:** The transition from the dashboard to the Event Detail page must be near-instantaneous (under 300ms), potentially utilizing cached data from the dashboard to optimistically render the initial layout.
* **Security:** Preventing direct URL manipulation. If a user tries to access `/workspace/:eventId` without an active registration, they must be intercepted and redirected to the Event Detail page with a permission error.

## 5. Acceptance Criteria (DoD)
- [ ] Clicking on an enrolled event card from the Dashboard now correctly navigates to the Event Detail page (`/dashboard/events/:slug`) instead of the workspace.
- [ ] The Event Detail page successfully detects the user's "Registered" status and displays the "Enter Workspace" button.
- [ ] Clicking the "Enter Workspace" button navigates the user successfully to the workspace application/view.
- [ ] Existing direct-links to the workspace reject unauthorized or un-enrolled users and redirect them gracefully.

## 6. Technical Reference
* **Frontend Routing:** `App.tsx` (Ensure `/dashboard/events/:slug` handles the primary entry).
* **Frontend Pages:** `pages/DashboardPage.tsx` (Update link targets), `pages/DashboardEventDetail.tsx` (Add workspace CTA button).
* **Backend Controllers:** `backend/src/modules/events/events.controller.ts` (Ensure registration payload is attached).
