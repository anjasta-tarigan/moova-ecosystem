# Product Requirements Document (PRD): Supabase Storage Migration

## 1. Objective

To migrate all file upload, storage, and deletion operations in the backend from the local file system (`fs`) to Supabase Storage. This will improve scalability, simplify deployments (reducing the need for local persistent volumes), optimize image delivery, and provide a more robust cloud-native architecture.

## 2. User Stories

- **As a System Administrator**, I want all file uploads (like event banners and resources) to be stored in Supabase Storage instead of local disks, so that our application scales horizontally without file synchronization issues.
- **As any System User (Admin, Superadmin, Student, Judge, etc.)**, I want my uploaded images to be optimized automatically before saving, so that the application loads faster and consumes less bandwidth.
- **As a Backend Developer**, I want the system to clean up (delete) files from Supabase Storage when the corresponding database records are deleted, so that we do not accumulate orphaned files and incur unnecessary storage costs.

## 3. Functional Requirements

### Interface Layer (API / Routing)

- Update all upload endpoints across all roles (e.g., Admin, Superadmin, Student, Judge) to accept multipart form-data as memory buffers rather than saving directly to disk.

### Logic Layer (Business Rules & Processing)

- **Middleware Update (Upload logic):**
  - Switch the `multer` configuration in `upload.middleware.ts` from `diskStorage` to `memoryStorage`.
  - Remove all local directory creation logic (e.g., `fs.mkdirSync`, `fs.writeFileSync`).
- **Image Optimization:**
  - Utilize `sharp` to process image buffers (`req.file.buffer`) before uploading to Supabase (e.g., resizing, formatting, or compressing).
- **Service adjustments:**
  - All Controllers/Services handling uploads across all roles (including `uploadEventBanner` and `uploadEventResources` in `admin.controller.ts`, as well as avatar or submission uploads in student/judge/superadmin controllers) must act as orchestrators: receiving the memory buffer from the middleware, passing it to `sharp` for optimization, and then invoking the Persistence Layer to upload the file.
  - Return the Supabase public URL in the API response instead of a local file path.

### Persistence Layer (Data Access & External Storage)

- **Supabase Client Setup:**
  - Create a dedicated Supabase client configuration in a unified file (`backend/src/config/supabase.ts`).
  - Rely on environment variables: `SUPABASE_URL` and `SUPABASE_KEY`.
- **Upload Operations:**
  - Implement functions to upload buffers to the `giva-events` Supabase Storage bucket.
  - Retrieve and return the public URL from Supabase upon successful upload.
- **Delete Operations:**
  - Inject logic into file deletion/record removal flows using `supabase.storage.from('giva-events').remove([path])` to ensure files are purged when no longer needed.

## 4. Non-Functional Requirements

- **Security:** Ensure Supabase client initialization uses secure server-side keys (never exposed to the client in the backend configuration). Validate file types and sizes before passing buffers to `sharp` to prevent memory exhaustion (DoS).
- **Performance:** Streamline the buffer processing in memory to minimize latency. `sharp` processing should execute asynchronously without blocking the Node.js event pool.
- **Reliability:** Implement retry mechanisms or proper error handling/logging for failed Supabase API calls.

## 5. Acceptance Criteria (DoD)

- [ ] A Supabase client is properly instantiated in `backend/src/config/supabase.ts` using `process.env.SUPABASE_URL` and `process.env.SUPABASE_KEY`.
- [ ] All instances of `multer.diskStorage` in `upload.middleware.ts` are replaced with `multer.memoryStorage()`.
- [ ] Uses of `fs.mkdirSync` and `fs.writeFileSync` for file uploads across all modules/controllers (Admin, Superadmin, Student, Judge) have been completely removed.
- [ ] All upload controllers across all roles optimize image uploads using `sharp(req.file.buffer).toBuffer()` before sending to Supabase.
- [ ] Files are successfully uploaded to the `giva-events` bucket in Supabase, and a valid Public URL is returned and saved in the database.
- [ ] When a record possessing an associated file is deleted via the API, the corresponding file is successfully removed from the Supabase `giva-events` bucket.
- [ ] Code passes TypeScript compilation and lint checks without warnings related to `fs` or `diskStorage`.

---

## Technical Reference

Target files for this feature implementation:

- **Configuration:** `backend/src/config/supabase.ts` (Requires Creation)
- **Middleware:** `backend/src/middlewares/upload.middleware.ts` (Update)
- **Controllers:** All controllers handling file uploads including, but not limited to, `backend/src/modules/admin/admin.controller.ts`, and corresponding student, judge, and superadmin controllers.
- **Environment config:** Requires adding `SUPABASE_URL` and `SUPABASE_KEY` to the `/backend/.env` file structure.
