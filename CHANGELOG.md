# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
