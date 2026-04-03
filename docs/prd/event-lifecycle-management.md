# PRD: Event Lifecycle Management (Save, Track, Auto-Close)

## 1. Objective

To implement and synchronize essential event lifecycle functionalities: allowing users to bookmark events ("save for later"), displaying real-time total participant counts, and automatically closing registrations once the deadline is reached. The system must ensure data consistency, security, and high performance across all layers.

## 2. User Stories

- **As a Student/Participant**, I want to save an event for later, so that I can easily find and register for it when I am ready.
- **As a Student/Participant**, I want to see the total number of registered participants in real-time, so that I can gauge the event's popularity or remaining capacity.
- **As an Event Organizer / System**, I want registrations to automatically close after the specified deadline, so that no late entries are accepted without manual intervention.

## 3. Functional Requirements

### 3.1 Interface Layer (Frontend)

- **Bookmark UI:** Implement a toggleable "Save for Later" icon/button on event cards and detail pages. Update state optimistically (with rollback on failure) to ensure snappy UX.
- **Participant Counter:** Display a dynamic counter showing current registrations. Update this component in real-time (via WebSockets/SSE or smart polling).
- **Registration State:** Automatically reflect the "Closed" state on the registration button if the current system time exceeds the event's `registrationEndDate`.

### 3.2 Logic Layer (Backend Services)

- **Bookmark Logic:** Dedicated endpoints to toggle bookmarks (e.g., `POST /api/events/{id}/bookmark`, `DELETE /api/events/{id}/bookmark`). Must validate user authentication.
- **Participant Tracking Service:** Aggregation logic to count active registrations. Emit events/WebSockets to push updates to subscribed clients when a new registration successfully inserts.
- **Registration Lifecycle Logic:**
  - **Time-based validation:** Strictly reject any registration requests if `currentTime > event.registrationEndDate`.
  - **Computed Status:** Return a dynamic `isRegistrationOpen` boolean in the event payload based on the server's clock, overriding any stale frontend state.

### 3.3 Persistence Layer (Database)

- **Bookmarks / SavedEvents:** Create a join table/relation between `User` and `Event` to store bookmarks securely.
- **Event Schema updates:** Ensure `registrationEndDate` is clearly defined and indexed.
- **Caching:** Maintain a transaction-safe counter or use a caching layer (e.g., Redis) for `totalParticipants` to prevent expensive `COUNT()` queries on high-traffic event data grids.

## 4. Non-Functional Requirements

- **Security:**
  - Strict AuthN/AuthZ for bookmarking and registration endpoints.
  - Server-side validation for all deadlines—never trust the client-side clock.
- **Performance:** Participant counts must be highly optimized; avoid locking rows unnecessarily during high concurrency registration spikes.
- **Real-time Sync:** Participant count updates should propagate to connected clients within a few seconds without overloading the database.

## 5. Acceptance Criteria (DoD)

- [ ] Users can successfully toggle the "Save for Later" button, and saved events persist in their profile.
- [ ] Total participant count accurately reflects the database and updates in real-time when new users register.
- [ ] Registration attempts via API directly made after the deadline are securely rejected with a 403/400 error.
- [ ] The frontend dynamically displays the event registration as "Closed" and disables the action button once the deadline passes.
- [ ] All API endpoints enforce strict Data Access vs Logic layer boundaries.

## 6. Technical Reference

- **Prisma Schema:** `backend/prisma/schema.prisma` (Impacted models: `Event`, `User`, `SavedEvent`, `Registration`)
- **Backend Module:** `backend/src/modules/events/events.service.ts`, `backend/src/modules/events/events.controller.ts`
- **Frontend Components:** `pages/EventDetailPage.tsx`, `pages/DashboardEventDetail.tsx`, `services/api/eventsApi.ts`
