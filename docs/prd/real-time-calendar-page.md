# Product Requirements Document: Real-Time Dynamic Calendar Page

## 1. Objective

The existing Calendar Page (`CalendarPage.tsx`) currently fetches a static list of events via a basic `getEvents` call with a limit, which does not contextually match the viewed month/range. The objective is to upgrade this page to be fully dynamic and real-time. It must fetch calendar data accurately based on the viewed date range and receive real-time updates (via SSE) without altering the existing UI layout or user experience.

## 2. User Stories

- **As a visitor**, I want to view accurate event schedules dynamically loaded based on the current month or agenda view, so that I don't see irrelevant past or future events.
- **As a visitor**, I want to see real-time updates to events (e.g., changes in time, location, or status) reflected immediately on the calendar without refreshing the page.
- **As a visitor**, I want to filter events by type (Workshop, Deadline, Milestone, Live Event) and see the results instantly updated.

## 3. Functional Requirements

### Interface Layer

_(Required: Must maintain existing UI layout and design constraints in `CalendarPage.tsx`)_

- **Navigation Components:** The Month/Agenda toggles, Current Month display, and Previous/Next buttons must remain as they are.
- **Calendar Views:** Both the grid (Month) and list (Agenda) views must accurately reflect the dynamically fetched data.
- **Side Panel Overlay:** The event detail panel must continue functioning using the dynamically injected real-time data structure (`selectedEvent`).
- **Loading State:** The existing `<LoadingSpinner />` must be displayed while new date ranges are being fetched.

### Logic Layer

- **Date Range Calculation:** When the user changes the month (Preview/Next navigation), the logic must compute the `startDate` and `endDate` boundaries of the current view to request only necessary data.
- **Real-Time Subscription:** A new hook or logic extension (e.g., `useGlobalEventStream`) must be created to connect to the SSE endpoint (`GET /api/events/stream`) using the `PUBLIC` audience channel.
- **State Management:** When a real-time event update is received (e.g., event rescheduled, newly added, or cancelled), the local `events` state must be immutably updated to reflect changes instantly on the UI.
- **Filtering Logic:** The filter control should accurately filter the state based on the fetched global data using the existing types (`deadline`, `event`, `workshop`, `milestone`).

### Persistence Layer

- **Data Access API:** The client must replace the static `eventsApi.getEvents({ limit: 50 })` with the role-scoped endpoint: `GET /api/events/calendar/range?start=[date]&end=[date]&role=PUBLIC`.
- **Stream Connection:** Establish Server-Sent Events (SSE) connection to `GET /api/events/stream` for live synchronization.

## 4. Non-Functional Requirements

- **Performance:** Stream payloads must only trigger partial re-renders rather than completely refreshing the entire event list. Fetching should only occur when navigating to a previously un-fetched month range.
- **Resilience:** The SSE stream must gracefully attempt to reconnect if the connection drops. Malformed SSE messages should be ignored without breaking the application logic.
- **Security:** The endpoints used must correctly enforce public-scoped access. No sensitive admin/judge data should leak into this public calendar connection.

## 5. Acceptance Criteria

- [ ] Navigating between months fires a request to `GET /api/events/calendar/range` for the targeted boundaries.
- [ ] Events listed on both Month and Agenda views correctly reflect the fetched range.
- [ ] Real-time updates dispatched from the server instantly reflect on the calendar view without a manual page refresh.
- [ ] The existing UI design, styling (Tailwind classes), and animations (Framer Motion / custom transitions) remain 100% unaltered.
- [ ] Invalid SSE shapes or dropped network connections do not crash the client application.

## 6. Technical Reference

**Files to Modify/Create:**

- `pages/CalendarPage.tsx`: Replace data-fetching logic with standard range checks and attach stream listener.
- `services/api/eventsApi.ts`: Add new method `getCalendarRange(start: string, end: string)`.
- `hooks/useCalendarStream.ts`: Create a new hook (or modify `useEventRealtime.ts`) to accept a global/agenda SSE connection instead of single event ID connection.
