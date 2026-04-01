# Moova Ecosystem - Event Creation System (Superadmin Exclusive)

## 1. Objective

To restructure the Event Creation process by strictly limiting access to the `SUPERADMIN` role, ensuring centralized and authoritative control over ecosystem events. The objective is to provide a highly structured, comprehensive, and professional form for event creation leveraging existing UI themes. The form includes advanced capabilities such as automated slug generation, dynamic location fields based on event format (Online/Offline/Hybrid), complex scheduling, image upload, and explicit required/optional field indicators. This system seamlessly integrates with the larger ecosystem including Students (Registrations), Judges (Scoring), and Certificates.

## 2. User Stories

- **As a Superadmin**, I want exclusive access to the Event Creation form, so that I can maintain the quality, security, and integrity of the platform without unauthorized event creation from standard admins.
- **As a Superadmin**, I want the event form to auto-generate a slug based on the event title, so that URLs remain clean and SEO-friendly without manual intervention.
- **As a Superadmin**, I want clear visual indicators for optional fields, so that I can quickly parse and complete the mandatory requirements of the form.
- **As a Superadmin**, I want to upload high-quality event banners with an instant preview, so that the event is visually appealing to prospective students and participants.
- **As a Superadmin**, I want to define the event format (Online, In-Person, Hybrid) dynamically, so that location information rules adapt (e.g., providing a physical address vs. meeting link).
- **As a Superadmin**, I want to define start dates, deadlines, and pricing, so that the event timeline and economics are clear to users.
- **As a Superadmin**, I want to attach categories, FAQs, timelines, and prize pool details, so that judges and students have all necessary context.

## 3. Functional Requirements (Broken down by Layers)

### 3.1 Interface Layer (UI/UX)

- **Role Restriction:** The "Create Event" button and the Event Creation form (migrating `AdminEventForm.tsx` to the `SuperAdmin` namespace) must only be accessible to users with the `SUPERADMIN` role. Attempting to access the form as any other role must result in a redirect or a 403 Forbidden screen.
- **Form Layout (Structured/Wizard Approach):**
  - **Basic Info Section:** Title (Required), Slug (Auto-generated in real-time, Read-only/Editable), Short Description (Required, limit 250 chars), Full Description (Rich Text Editor, Required), Theme (Optional).
  - **Logistics & Details Section:**
    - Format Dropdown (Online, In-Person, Hybrid - Required).
    - Location Input: Label changes to "Meeting Link" if Online, "Physical Address" if In-Person. Becomes mandatory depending on the Format.
    - Date (Required), Deadline (Required).
  - **Media Section:** Image Upload Input (Dropzone with instant preview and file constraints).
  - **Rules & Economics Section:** Team Size Min/Max (Number inputs), Fee (Default: "Gratis" - Optional), SDGs (Multi-select from predefined goals - Optional), Prize Pool (Optional), Organizer (Optional, default: "GIVA").
- **UI Theme Continuity:** Must utilize existing components such as `AdminInput.tsx`, `AdminSelect.tsx`, and standard `Button.tsx` (found in `components/admin/`).
- **Field Labeling:** Append a subtle "(Opsional)" text to labels of non-mandatory fields to guide the user seamlessly.

### 3.2 Logic Layer (Business Rules)

- **Auto-Slug Generation:**
  - Logic: Automatically convert the `Title` input to lowercase, replace spaces with hyphens, and strip special characters (`slugify(title)`). Append a short randomized string if needed to ensure uniqueness upon DB persistence.
  - The slug should update in real-time as the title is typed, unless manually overwritten by the Superadmin.
- **Field Validations:**
  - `Title`: Minimum 5 characters.
  - `Team Size`: Minimum size must be less than or equal to Maximum size. Minimum 1.
  - `Date vs Deadline`: The `deadline` date must always chronologically precede or be equal to the `date` of the event.
- **Format State Handling:**
  - If `Format === 'ONLINE'`, `Location` validation checks for standard URL patterns (e.g., Zoom/Meet links) or is strictly labeled as virtual.
  - If `Format === 'IN_PERSON' || 'HYBRID'`, `Location` is required to be a physical text string.

### 3.3 Persistence Layer (Data Access & Schema)

- **Role Authorization Middleware:**
  - Backend Route handlers (e.g., `POST /api/events`) must implement a strict RBAC check enforcing `req.user.role === 'SUPERADMIN'`.
- **Database Schema Updates:**
  - The `Event` model in `prisma/schema.prisma` already perfectly accommodates this structure (`id`, `title`, `slug`, `format`, `status`, etc.).
  - Ensure the `createdById` automatically ties the newly created Event to the authenticated Superadmin's ID.
  - `image` field must store the resulting URL from the upload provider (e.g., local storage path or S3 URL).

## 4. Non-Functional Requirements

- **Security:** Strict input sanitization must be applied to the rich text Full Description to prevent Cross-Site Scripting (XSS). Route protection is paramount to prevent Privilege Escalation.
- **Usability:** The form must be fully responsive, dividing large sets of fields into logical sections or cards to prevent cognitive overload.
- **Performance:** Image uploads must be validated on the client side (size limit: max 2MB, formats: JPG, PNG, WEBP) to optimize server upload bandwidth.

## 5. Acceptance Criteria (DoD)

- [ ] A Superadmin successfully accesses the newly styled and structured Event Creation form.
- [ ] Any User, Student, Judge, or standard Admin receives a 403 Forbidden error when attempting to route to the form or make a POST request to create an event.
- [ ] Typing a Title automatically populates the Slug field with a URL-friendly format.
- [ ] The form displays "(Opsional)" next to all non-mandatory fields.
- [ ] The image upload component previews the banner before submission and securely uploads it upon saving.
- [ ] Selecting "Online" changes the expected Location field context natively.
- [ ] Team Size validations ensure Min is never greater than Max.
- [ ] A new event successfully saves to the database, capturing all fields correctly, and redirects the Superadmin to the Event overview page.

## 6. Technical Reference

- **Modified/New Files:**
  - `pages/admin/AdminEventForm.tsx` -> Move/Refactor to strictly check Superadmin context (or create `pages/superadmin/SuperAdminEventForm.tsx`).
  - `App.tsx` -> Re-route the event creation path exclusively under SuperAdmin protection.
- **Existing Components Used:**
  - `components/admin/AdminInput.tsx` (extend to allow "(Opsional)" prop or suffix).
  - `components/admin/AdminSelect.tsx`
  - `components/Button.tsx`
- **Database Architecture:**
  - `backend/prisma/schema.prisma`: Target `Event` model (Integrates seamlessly with `EventFormat` enum).
- **Backend API Routes (Assumed structure based on context):**
  - Event Controller (`POST /api/events`) to enforce Superadmin authorization middleware.
