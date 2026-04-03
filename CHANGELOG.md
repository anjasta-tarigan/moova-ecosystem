# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.3.12] – 2026-04-03 21:54:44 (UTC+08:00)

- Refactored Superadmin event finalization flow so the `Manage Event` page now renders card-only navigation and each of the 11 domains opens in a dedicated form route (`/events/:id/edit/:cardKey`) with localized save actions.
- Reworked card form UX away from pipe-delimited manual text input into structured inputs (rows, selects, date pickers, toggles), including checkbox-based eligibility for Event Configuration and Rules.
- Added event resource upload pipeline for Superadmin (`POST /api/admin/events/resources/upload`) with backend file handling and frontend file-metadata editor before save.
- Enabled Admin role to open event detail in readonly mode (view cards/forms without write permission), while preserving Superadmin-only mutation rights in backend routes.
- Hardened event status mutation authorization to Superadmin-only and broadcasted status changes through realtime event updates.
- Replaced direct login redirects on public restricted actions with a minimal responsive auth modal (login/create account CTA) in Event Detail.
- Improved Student Event Community presentation with author avatar rendering, clearer thread vs reply visual structure, and stronger Like/Reply action affordances.

## [0.3.11] – 2026-04-03 20:15:10 (UTC+08:00)

- Implemented foundational PRD rollout for event finalization: expanded Prisma event domain with immutable `customId` (`GIVA-*-year`), event stages, awards, criteria, resources, event community models, and taxonomy tables; removed Event SDGs persistence.
- Added modular superadmin APIs and save flows for 11-card event management (`/api/admin/events/:id/manage`, plus card-specific PATCH endpoints for config/faq/criteria/timeline/rules/resources/judges/stages/awards and taxonomy creation endpoints).
- Enforced stage-window submission rules (403 before stage start or after deadline), enabled pre-registration for upcoming events, added event-detail-by-slug endpoint, introduced event community thread/reply/like APIs, and added SSE stream endpoint for real-time update channels.
- Refactored frontend event admin workflow with quick-create modal (labeled + real-time validation), superadmin-only manage actions, new dedicated superadmin `ManageEvent` page with 11 modular cards and progress bars, plus student dashboard Event Community page and workspace CTA update from `Start Submission` to `Event Community`.

## [0.3.10] – 2026-04-03 15:43:47 (UTC+08:00)

- Changed My Registered Events cards to navigate directly to workspace route (`/dashboard/workspace/:slug`) instead of event detail.
- Rebuilt student workspace page by adapting the legacy backup layout structure (header, tabs, stage workflow cards, and resources section) while replacing mock data with live API data.
- Kept workspace security checks in place: unauthorized direct access still redirects users gracefully back to event detail with a permission message.

## [0.3.9] – 2026-04-03 16:12:00 (UTC+08:00)

- Implemented Enrolled Event navigation flow by adding secure workspace-entry gate route `/dashboard/workspace/:slug` and redirecting enrolled users through event detail before workspace access.
- Added backend authorization endpoint `GET /api/student/events/:slug/workspace-access` with server-side checks for student registration and event timeline status before granting workspace navigation.
- Enriched student event detail payload with contextual workspace metadata (`canEnterWorkspace`, `workspacePath`, `workspaceAccessMessage`, `registrationStatus`, `eventTimelineStatus`) and updated dashboard detail CTA to render `Enter Workspace` only when access is approved.

## [0.3.8] – 2026-04-03 14:04:19 (UTC+08:00)

- Implemented Event Lifecycle management with persistent bookmarks via new `SavedEvent` relation and student bookmark endpoints (`POST/DELETE /api/events/:id/bookmark`) plus profile access endpoint (`GET /api/siswa/my-saved-events`).
- Added server-computed lifecycle fields on event payloads (`totalParticipants`, `totalSaves`, `isSaved`, `registrationEndDate`, `isRegistrationOpen`) and enforced deadline-based registration rejection with 403 when registration time has passed.
- Updated public and dashboard event UIs (cards + detail pages) with optimistic save/unsave interactions, rollback on failure, periodic smart polling for participant/saved counters, and registration buttons that auto-switch to closed state based on server lifecycle status.

## [0.3.7] – 2026-04-03 13:27:09 (UTC+8)

- Expanded student dashboard event detail page to match the legacy public detail completeness (quick info counters, core theme/tracks, judging criteria, requirements, rules tabs, resources, public Q&A, sticky sidebar, and mobile action bar).
- Preserved dashboard-specific registration CTA behavior (`Register`, `Pending Team Invite`, `Go to Submission`, `View Registration / Team`) while keeping navigation inside the student dashboard.

## [0.3.6] – 2026-04-03 13:18:45 (UTC+8)

- Implemented student dashboard event detail flow with new protected route `/dashboard/events/:slug` and a dedicated `DashboardEventDetail` page that keeps users inside dashboard layout.
- Added authenticated event detail endpoint `GET /api/student/events/:slug` (plus `/api/events/student/:slug`) returning event details together with registration state, registration metadata, and submission linkage in one payload.
- Updated student navigation and links (`DashboardLayout`, `DashboardPage`, `DashboardEventHub`, `DashboardSubmission`) from legacy `/dashboard/event/*` paths to the new `/dashboard/events/*` structure.

## [0.3.5] – 2026-04-02 00:00:00 (UTC+8)

- Updated modal overlay to use a translucent blurred backdrop for status change popups, replacing the opaque dark background.

## [0.3.4] – 2026-04-02 00:00:00 (UTC+8)

- Added superadmin-only status change flow on the event list with modal selector and API call to update event status inline.
- Surfaced status update success/error feedback and refreshed list after changes.

## [0.3.3] – 2026-04-02 00:00:00 (UTC+8)

- Locked event creation behind SUPERADMIN with stricter backend validation for slugs, deadlines, and format-aware locations.
- Added 2MB-checked banner upload pipeline (WebP optimization) plus client helper for the event form.
- Refreshed superadmin event form UI with optional labels, SDG multi-select, dynamic location handling, banner preview upload, and routing that removes admin access to create.

## [0.3.2] – 2026-04-01 00:00:00 (UTC+8)

- Updated README to reflect pnpm monorepo workflow, Prisma v7/PostgreSQL `giva_db` setup, and consolidated dev/build commands.
- Documented current changelog entry.

## [0.3.1] – 2026-03-22 13:03:56 (UTC+8)

- Fixed certificate title overlapping decorative line: increased font to 36px with 20px margin around lines.
- Vertically centered main certificate content block on the page.

## [0.3.0] – 2026-03-22 12:52:21 (UTC+8)

- Fixed recipient name showing "Recipient" instead of actual name on student dashboard (`Cert` interface used `name` but API returns `fullName`).
- Redesigned certificate body text per international standards: role-specific headings (Certificate of Achievement/Participation/Appreciation) and body descriptions.
- Event name now automatically included and prominently displayed in certificate body text.
- Removed CUSTOM from bulk award type dropdown.

## [0.2.0] – 2026-03-22 12:00:57 (UTC+8)

- Fixed QR code blank in PDF downloads: set `allowTaint: true` in html2canvas + direct QR overlay on jsPDF for guaranteed rendering.
- Redesigned 3 built-in certificate templates with modern premium aesthetics (geometric corner accents, gradient bars, watermarks, dot grid patterns).
- Added JUDGE account support in certificate creation: tabbed recipient selector (Students | Judges) with auto award-type assignment.
- Fixed superadmin navigation paths in all admin certificate pages.

## [0.1.0] – 2026-03-22 11:48:50 (UTC+8)

- Fixed QR code/barcode not appearing in PDF certificate downloads on admin pages (`EventCertificateView.tsx`, `CertificateCreator.tsx`) by adopting imperative `createRoot` + `qrDataUrl` injection pattern.
- Fixed hardcoded `/admin/certificates` navigation paths in `AdminCertificates.tsx`, `CertificateCreator.tsx`, and `EventCertificateView.tsx` — now dynamically detects `/admin` vs `/superadmin` base path via `useLocation()`.
- Verified SHA-256 hash chain cryptographic validation system in `certificates.service.ts` and `CertificateVerificationPage.tsx` — working correctly.
