# Moova Ecosystem - Student Dashboard Event Detail

## 1. Objective

To enhance the student user experience by keeping them within their authenticated dashboard ecosystem when exploring new events. This feature introduces a dedicated internal Event Detail page that mirrors the visual fidelity and structure of the public `pages/EventDetailPage.tsx`, but is wrapped within the `layouts/DashboardLayout.tsx`. This prevents disjointed context switching (getting kicked out to the public landing site) and allows for personalized Call-to-Action (CTA) buttons based on the student's current registration status.

## 2. User Stories

- **As a Student**, I want to click on an event from the "Discover Events" section in my dashboard and view its full details without leaving the dashboard, so that my navigation context and sidebar remain intact.
- **As a Student**, I want the detail page to look identical to the public event format, so that I can easily find information like timelines, FAQs, and rules without having to adjust to a new layout.
- **As a Student**, I want the page to immediately recognize if I am already registered for the event, so that the main action button correctly shows "Register Now", "Pending Team Invite", or "Go to Submission".

## 3. Functional Requirements (Broken down by Layers)

### 3.1 Interface Layer (UI/UX)

- **New Page Component (`pages/DashboardEventDetail.tsx`):**
  - Must be nested under the `layouts/DashboardLayout.tsx` (meaning it retains the dashboard sidebar and header, unlike the public site which uses the main `Navbar` and `Footer`).
  - Replicate the visual hierarchy of the public `pages/EventDetailPage.tsx`:
    - **Header/Hero Section:** Event Banner Image, Title, Organizer, Badge Status.
    - **Meta Grid:** Event Format (Online/Offline), Dates, Fee, Location.
    - **Content Tabs/Sections:** Full Description (Rich Text), Timeline (EventTimeline), Prize Pool, FAQs.
- **Contextual Action Area (CTA):**
  - Instead of a generic "Register" button that checks for login state, this page uses the existing authentication context.
  - State 1: `Not Registered` -> Button says "Register for Event" (Triggering the event registration flow/modal).
  - State 2: `Registered` -> Button is disabled or changes to "View Registration / Team" linking internal dashboard routes.

### 3.2 Logic Layer (Business Rules & State)

- **Routing Logic:**
  - Clicking an event card in `pages/DashboardEventHub.tsx` inside the "Discover Events" tab routes the user to `/dashboard/events/:slug` instead of `/events/:slug`.
- **Registration State Verification:**
  - Upon component mount, verify if `currentUser.id` exists in the `EventRegistration` table for the fetched `eventId`.
  - Disable or alter the CTA button dynamically to prevent duplicate registration attempts from the same student account.
- **Data Hydration:**
  - Since this page requires deep data (`fullDescription`, `timeline`, `faqs`), it triggers a detailed fetch unlike the simplified list fetch from the event hub.

### 3.3 Persistence Layer (Data Access & Schema)

- **API Integration:**
  - Leverage an authenticated specific endpoint for fetching event details: `GET /api/student/events/:slug`.
  - The endpoint logic should query the Prisma `Event` model including necessary relations (`timeline`, `faqs`).
  - **Crucial Addition for this Endpoint:** Ensure the query checks the current user's registration status and returns a boolean or registration object in the same payload, e.g., `{ ..., isRegistered: true, registrationId: "..." }`. This saves a secondary API call and prevents flash-of-unregistered-state on the UI.
- **Schema Impact:** No database schema changes are required. The existing relational mapping between `User`, `Event`, and `EventRegistration` fully supports this query.

## 4. Non-Functional Requirements

- **Consistency:** The UI components (typography, spacing, colors) must strictly reuse the existing design tokens and components to ensure zero visual discrepancy between public and private views.
- **Performance:** Ensure that the query pulling deep event data is optimized and indexed by `slug` in the database to guarantee load times under 1 second.
- **Security:** Ensure the route `/dashboard/events/:slug` is protected by the `AuthContext` and restricts access to users with the `STUDENT` role. Draft events must still return a 404/Not Found.

## 5. Acceptance Criteria (DoD)

- [ ] A new page `pages/DashboardEventDetail.tsx` exists and is routed via `/dashboard/events/:slug`.
- [ ] The page correctly displays inside the `layouts/DashboardLayout.tsx`, maintaining sidebar navigation.
- [ ] The content layout is a 1:1 match with the public `pages/EventDetailPage.tsx` (hero, details, timeline, FAQ).
- [ ] The student's registration status is automatically evaluated on load.
- [ ] If unregistered, clicking "Register" opens the appropriate student registration flow.
- [ ] If already registered, the button redirects to the student's submission/team management view for that event.
- [ ] Events with `DRAFT` status block access and display an error state.

## 6. Technical Reference

- **New Files to Create:**
  - `pages/DashboardEventDetail.tsx` (Student-specific event detail view)
- **Files to Modify:**
  - `App.tsx`: Register the new protected route `/dashboard/events/:slug` wrapped inside `layouts/DashboardLayout.tsx`.
  - `pages/DashboardEventHub.tsx`: Modify the link/click handler on event cards in the "Discover" tab to point to the new internal route instead of the public `/events/:slug`.
- **Backend Touchpoints:**
  - Extent or create an authenticated controller specifically for the student detail fetch: e.g., `EventController.getStudentEventDetail(req, res)` that includes the `isRegistered` parameter in the response payload using Prisma's `eventRegistrations: { where: { studentId: req.user.id } }`.
