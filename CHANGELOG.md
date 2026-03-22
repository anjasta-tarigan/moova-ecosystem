# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.0] – 2026-03-22 12:00:57 (UTC+8)
- Fixed QR code blank in PDF downloads: set `allowTaint: true` in html2canvas + direct QR overlay on jsPDF for guaranteed rendering.
- Redesigned 3 built-in certificate templates with modern premium aesthetics (geometric corner accents, gradient bars, watermarks, dot grid patterns).
- Added JUDGE account support in certificate creation: tabbed recipient selector (Students | Judges) with auto award-type assignment.
- Fixed superadmin navigation paths in all admin certificate pages.

## [0.1.0] – 2026-03-22 11:48:50 (UTC+8)
- Fixed QR code/barcode not appearing in PDF certificate downloads on admin pages (`EventCertificateView.tsx`, `CertificateCreator.tsx`) by adopting imperative `createRoot` + `qrDataUrl` injection pattern.
- Fixed hardcoded `/admin/certificates` navigation paths in `AdminCertificates.tsx`, `CertificateCreator.tsx`, and `EventCertificateView.tsx` — now dynamically detects `/admin` vs `/superadmin` base path via `useLocation()`.
- Verified SHA-256 hash chain cryptographic validation system in `certificates.service.ts` and `CertificateVerificationPage.tsx` — working correctly.
