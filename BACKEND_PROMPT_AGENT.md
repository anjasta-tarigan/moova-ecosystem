You are an expert backend engineer. Build a complete production-ready 
REST API for GIVA — a Science & Innovation Ecosystem platform for 
Indonesian students.

=============================================================
TECH STACK
=============================================================
- Runtime     : Node.js (v20+)
- Framework   : Express.js
- Language    : TypeScript
- Database    : PostgreSQL
- ORM         : Prisma
- Auth        : JWT (access token 15m + refresh token 7d)
- File Upload : Multer + local storage (uploads/ folder)
- Validation  : Zod
- Password    : bcryptjs
- Env         : dotenv

Use pnpm as package manager (pnpm-lock.yaml exists).

=============================================================
Terminal Authority (system)
=============================================================
Postgresql Username: postgres
Postgresql Password: root



=============================================================
ROLE SYSTEM (4 ROLES ONLY)
=============================================================

enum UserRole {
  SUPERADMIN  // Full system control, created via seed only
  ADMIN       // Manage events, submissions, certificates
               // Created/managed by SUPERADMIN only
  JURI        // Score submissions assigned to them
               // Created/managed by SUPERADMIN only  
  SISWA       // Self-register, join events, submit work
}

ROLE HIERARCHY RULES:
- SUPERADMIN can: create/edit/delete ADMIN and JURI accounts,
  access all data, system configuration
- ADMIN can: create/edit events, manage submissions,
  issue certificates, view reports. CANNOT manage users.
- JURI can: view assigned submissions, submit scores.
  CANNOT see other judges' scores.
- SISWA can: self-register, browse events, register to events,
  create/join teams, submit work, view own certificates.
- SISWA cannot access /admin or /juri routes at all.

=============================================================
PROJECT STRUCTURE
=============================================================

backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── upload.middleware.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   ├── siswa/
│   │   │   ├── siswa.controller.ts
│   │   │   ├── siswa.service.ts
│   │   │   ├── siswa.routes.ts
│   │   │   └── siswa.schema.ts
│   │   ├── events/
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.routes.ts
│   │   │   └── events.schema.ts
│   │   ├── teams/
│   │   │   ├── teams.controller.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── teams.routes.ts
│   │   │   └── teams.schema.ts
│   │   ├── submissions/
│   │   │   ├── submissions.controller.ts
│   │   │   ├── submissions.service.ts
│   │   │   ├── submissions.routes.ts
│   │   │   └── submissions.schema.ts
│   │   ├── juri/
│   │   │   ├── juri.controller.ts
│   │   │   ├── juri.service.ts
│   │   │   ├── juri.routes.ts
│   │   │   └── juri.schema.ts
│   │   ├── certificates/
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   └── certificates.routes.ts
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.routes.ts
│   │   └── superadmin/
│   │       ├── superadmin.controller.ts
│   │       ├── superadmin.service.ts
│   │       └── superadmin.routes.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── response.ts
│   │   └── generateCode.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── uploads/
├── .env.example
├── package.json
└── tsconfig.json

=============================================================
PRISMA SCHEMA
=============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPERADMIN
  ADMIN
  JURI
  SISWA
}

enum EventStatus {
  DRAFT
  OPEN
  UPCOMING
  CLOSED
}

enum EventFormat {
  ONLINE
  IN_PERSON
  HYBRID
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  REVISION_REQUESTED
  SCORED
}

enum JudgingStage {
  ABSTRACT
  PAPER
  FINAL
}

enum ScoreStatus {
  DRAFT
  SUBMITTED
}

enum CertificateType {
  WINNER
  PARTICIPANT
  JURI
}

enum CertificateStatus {
  VALID
  REVOKED
}

enum TeamStatus {
  ACTIVE
  DISBANDED
}

enum TeamMemberRole {
  LEADER
  MEMBER
}

enum AssignmentStatus {
  ACTIVE
  COMPLETED
  PENDING
}

model User {
  id            String    @id @default(cuid())
  fullName      String
  email         String    @unique
  password      String
  role          UserRole  @default(SISWA)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile             SiswaProfile?
  teamMemberships     TeamMember[]
  eventRegistrations  EventRegistration[]
  submissions         Submission[]
  certificates        Certificate[]
  juriAssignments     JuriAssignment[]
  scores              Score[]
  refreshTokens       RefreshToken[]
  qaQuestions         QaQuestion[]
  qaReplies           QaReply[]
  qaUpvotes           QaUpvote[]
  notifications       Notification[]

  @@map("users")
}

model RefreshToken {
  id         String   @id @default(cuid())
  token      String   @unique
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@map("refresh_tokens")
}

// Only for SISWA role
model SiswaProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Personal
  phone           String   @default("")
  birthDate       DateTime?
  gender          String   @default("")
  address         String   @default("")
  avatar          String   @default("")
  
  // Academic (REQUIRED for event registration)
  schoolName      String   @default("")
  schoolLevel     String   @default("")  
  // e.g. SMP, SMA, SMK, D3, S1, S2, S3
  major           String   @default("")
  studentId       String   @default("")
  grade           String   @default("")   
  // e.g. Kelas 10, Semester 3
  province        String   @default("")
  city            String   @default("")
  
  // Public Profile
  bio             String   @default("")
  skills          String[]
  linkedin        String   @default("")
  github          String   @default("")
  
  // System
  completeness    Int      @default(0)
  updatedAt       DateTime @updatedAt

  @@map("siswa_profiles")
}

model Event {
  id               String       @id @default(cuid())
  title            String
  slug             String       @unique
  shortDescription String
  fullDescription  String
  theme            String       @default("")
  date             String
  location         String
  format           EventFormat
  category         String
  image            String       @default("")
  status           EventStatus  @default(DRAFT)
  deadline         String
  fee              String       @default("Gratis")
  teamSizeMin      Int          @default(1)
  teamSizeMax      Int          @default(5)
  eligibility      String[]
  sdgs             Int[]
  prizePool        String       @default("")
  organizer        String       @default("MOOVA")
  
  createdById      String
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  timeline         EventTimeline[]
  faqs             EventFaq[]
  categories       EventCategory[]
  registrations    EventRegistration[]
  submissions      Submission[]
  juriAssignments  JuriAssignment[]
  qaQuestions      QaQuestion[]
  certificates     Certificate[]

  @@map("events")
}

model EventTimeline {
  id          String  @id @default(cuid())
  eventId     String
  event       Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  date        String
  title       String
  description String
  order       Int

  @@map("event_timelines")
}

model EventFaq {
  id       String @id @default(cuid())
  eventId  String
  event    Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  question String
  answer   String
  order    Int

  @@map("event_faqs")
}

model EventCategory {
  id          String  @id @default(cuid())
  eventId     String
  event       Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String
  description String  @default("")

  juriAssignments JuriAssignment[]
  submissions     Submission[]

  @@map("event_categories")
}

model EventRegistration {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  eventId        String
  event          Event    @relation(fields: [eventId], references: [id])
  teamId         String?
  team           Team?    @relation(fields: [teamId], references: [id])
  registeredAt   DateTime @default(now())

  @@unique([userId, eventId])
  @@map("event_registrations")
}

model Team {
  id          String      @id @default(cuid())
  name        String
  code        String      @unique
  status      TeamStatus  @default(ACTIVE)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  members       TeamMember[]
  registrations EventRegistration[]
  submissions   Submission[]

  @@map("teams")
}

model TeamMember {
  id       String         @id @default(cuid())
  teamId   String
  team     Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId   String
  user     User           @relation(fields: [userId], references: [id])
  role     TeamMemberRole @default(MEMBER)
  joinedAt DateTime       @default(now())

  @@unique([teamId, userId])
  @@map("team_members")
}

model Submission {
  id             String           @id @default(cuid())
  teamId         String
  team           Team             @relation(fields: [teamId], references: [id])
  eventId        String
  event          Event            @relation(fields: [eventId], references: [id])
  categoryId     String?
  category       EventCategory?   @relation(fields: [categoryId], references: [id])
  submittedById  String
  submittedBy    User             @relation(fields: [submittedById], references: [id])
  
  status         SubmissionStatus @default(DRAFT)
  currentStage   JudgingStage     @default(ABSTRACT)
  
  projectTitle   String
  tagline        String           @default("")
  description    String
  techStack      String           @default("")
  githubLink     String           @default("")
  demoLink       String           @default("")
  consentGiven   Boolean          @default(false)
  submittedAt    DateTime?
  
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  files  SubmissionFile[]
  scores Score[]

  @@map("submissions")
}

model SubmissionFile {
  id           String   @id @default(cuid())
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  name         String
  size         String
  mimeType     String
  url          String
  uploadedAt   DateTime @default(now())

  @@map("submission_files")
}

model JuriAssignment {
  id          String           @id @default(cuid())
  juriId      String
  juri        User             @relation(fields: [juriId], references: [id])
  eventId     String
  event       Event            @relation(fields: [eventId], references: [id])
  categoryId  String
  category    EventCategory    @relation(fields: [categoryId], references: [id])
  currentStage JudgingStage    @default(ABSTRACT)
  status      AssignmentStatus @default(ACTIVE)
  createdAt   DateTime         @default(now())

  @@unique([juriId, categoryId])
  @@map("juri_assignments")
}

model Score {
  id             String       @id @default(cuid())
  juriId         String
  juri           User         @relation(fields: [juriId], references: [id])
  submissionId   String
  submission     Submission   @relation(fields: [submissionId], references: [id])
  stage          JudgingStage
  criteriaScores Json
  comment        String       @default("")
  totalScore     Float        @default(0)
  status         ScoreStatus  @default(DRAFT)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([juriId, submissionId, stage])
  @@map("scores")
}

model Certificate {
  id               String            @id @default(cuid())
  recipientId      String
  recipient        User              @relation(fields: [recipientId], references: [id])
  eventId          String
  event            Event             @relation(fields: [eventId], references: [id])
  type             CertificateType
  award            String
  issueDate        DateTime          @default(now())
  issuedBy         String
  status           CertificateStatus @default(VALID)
  revocationReason String?
  createdAt        DateTime          @default(now())

  @@map("certificates")
}

model QaQuestion {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  text      String
  createdAt DateTime @default(now())

  replies    QaReply[]
  upvotes    QaUpvote[]

  @@map("qa_questions")
}

model QaReply {
  id          String     @id @default(cuid())
  questionId  String
  question    QaQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  text        String
  isOrganizer Boolean    @default(false)
  createdAt   DateTime   @default(now())

  @@map("qa_replies")
}

model QaUpvote {
  id         String     @id @default(cuid())
  questionId String
  question   QaQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  userId     String
  user       User       @relation(fields: [userId], references: [id])

  @@unique([questionId, userId])
  @@map("qa_upvotes")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())

  @@map("notifications")
}

=============================================================
ALL API ENDPOINTS
=============================================================

--- AUTH ---
POST /api/auth/register
  Public — SISWA only self-register
  Body: { fullName, email, password, confirmPassword }
  Action: create User (role=SISWA) + empty SiswaProfile
  Returns: { user (no password), accessToken, refreshToken }

POST /api/auth/login
  Public
  Body: { email, password }
  Returns: { user, accessToken, refreshToken }

POST /api/auth/refresh
  Public
  Body: { refreshToken }
  Returns: { accessToken, refreshToken }

POST /api/auth/logout
  Auth: required
  Body: { refreshToken }
  Action: delete RefreshToken from DB

GET /api/auth/me
  Auth: required
  Returns: user + profile (if SISWA)

--- SISWA PROFILE ---
GET /api/siswa/profile
  Auth: SISWA only
  Returns: SiswaProfile with completeness

PUT /api/siswa/profile
  Auth: SISWA only
  Body: any SiswaProfile fields
  Action: update + recalculate completeness
  Completeness formula (must reach 80% to register events):
    Required fields = 80%:
      fullName, phone, birthDate, gender,
      schoolName, schoolLevel, grade,
      province, city (each = 80/9 ≈ ~8.9%)
    Bonus = 20%:
      avatar (+5), bio (+5),
      skills.length > 0 (+5), github || linkedin (+5)

POST /api/siswa/profile/avatar
  Auth: SISWA only
  Body: multipart/form-data { avatar: file (jpg/png max 2MB) }
  Returns: { avatarUrl }

GET /api/siswa/my-events
  Auth: SISWA only
  Returns: events where user has EventRegistration

GET /api/siswa/my-submissions
  Auth: SISWA only
  Returns: all submissions by user's teams

GET /api/siswa/my-certificates
  Auth: SISWA only
  Returns: certificates for this user

--- EVENTS (PUBLIC + AUTH) ---
GET /api/events
  Public
  Query: ?search=&category=&status=&format=
         &startDate=&endDate=&page=1&limit=10
  Returns: paginated { data, total, page, totalPages }

GET /api/events/:id
  Public
  Returns: event + timeline + faqs + categories
           + registrationCount

POST /api/events/:id/register
  Auth: SISWA only
  Validation: 
    - profile completeness >= 80%
    - event status must be OPEN
    - not already registered
  Body: { teamId? }
  Returns: created EventRegistration

GET /api/events/:id/qa
  Public
  Query: ?page=1&limit=20
  Returns: questions with replies + upvoteCount

POST /api/events/:id/qa
  Auth: SISWA or ADMIN
  Body: { text }

POST /api/events/:id/qa/:questionId/replies
  Auth: required
  Body: { text }
  Action: isOrganizer = true if role is ADMIN or SUPERADMIN

POST /api/events/:id/qa/:questionId/upvote
  Auth: SISWA only
  Action: toggle (create if not exists, delete if exists)
  Returns: { upvoteCount, isUpvoted }

--- TEAMS ---
GET /api/teams
  Auth: SISWA only
  Returns: teams where current user is member

GET /api/teams/:id
  Auth: must be team member
  Returns: team + members with user info

POST /api/teams
  Auth: SISWA only
  Body: { name }
  Action: generate unique 6-char code,
          add creator as LEADER

POST /api/teams/join
  Auth: SISWA only
  Body: { code }
  Validation: team must be ACTIVE, user not already member
  Returns: updated team

PUT /api/teams/:id
  Auth: team LEADER only
  Body: { name }

DELETE /api/teams/:id
  Auth: team LEADER only
  Action: set status DISBANDED

DELETE /api/teams/:id/leave
  Auth: team member
  Action: 
    if LEADER and others exist → promote next member
    if LEADER and alone → set status DISBANDED
    if MEMBER → just remove

DELETE /api/teams/:id/members/:userId
  Auth: team LEADER only (cannot remove self)

PATCH /api/teams/:id/members/:userId/role
  Auth: team LEADER only
  Body: { role: "LEADER" | "MEMBER" }
  Action: if promoting to LEADER, current LEADER → MEMBER

--- SUBMISSIONS ---
GET /api/submissions
  Auth: SISWA only
  Returns: submissions by user's teams with files + scores

GET /api/submissions/:id
  Auth: team member OR juri assigned OR admin
  Returns: full submission detail

POST /api/submissions
  Auth: SISWA only
  Body: { teamId, eventId, categoryId?, 
          projectTitle, tagline, description,
          techStack, githubLink, demoLink }
  Validation: user must be team LEADER,
              team must be registered for event

PUT /api/submissions/:id
  Auth: team LEADER only, status must be DRAFT
  Body: partial submission fields

POST /api/submissions/:id/files
  Auth: team member, status must be DRAFT or SUBMITTED
  Body: multipart/form-data { file }
  Accept: pdf, docx, pptx, jpg, png, mp4

DELETE /api/submissions/:id/files/:fileId
  Auth: team LEADER only

POST /api/submissions/:id/submit
  Auth: team LEADER only
  Body: { consentGiven: true }
  Validation: consentGiven must be true,
              at least 1 file must be uploaded
  Action: status → SUBMITTED, submittedAt = now()

POST /api/submissions/:id/withdraw
  Auth: team LEADER only
  Validation: status must be SUBMITTED (not SCORED)
  Action: status → DRAFT, submittedAt = null

--- JURI ---
GET /api/juri/assignments
  Auth: JURI only
  Returns: assignments with progress per category
  Progress = count of SUBMITTED scores / total submissions
             in that category for currentStage

GET /api/juri/assignments/:categoryId/submissions
  Auth: JURI only (must be assigned to categoryId)
  Query: ?stage=ABSTRACT|PAPER|FINAL
         &status=all|pending|submitted
  Returns: submissions + this juri's score status per submission

GET /api/juri/submissions/:submissionId
  Auth: JURI only (must be assigned to submission's category)
  Query: ?stage=ABSTRACT|PAPER|FINAL
  Returns: submission detail + existing score + rubric definition

POST /api/juri/scores
  Auth: JURI only
  Body: {
    submissionId: string,
    stage: "ABSTRACT" | "PAPER" | "FINAL",
    criteriaScores: {
      // ABSTRACT stage:
      "novelty": 0-10,
      "clarity": 0-10,
      "relevance": 0-10
      // PAPER stage:
      "methodology": 0-20,
      "results": 0-20,
      "poster": 0-10,
      "impact": 0-20,
      "writing": 0-10
      // FINAL stage:
      "presentation": 0-30,
      "qa": 0-30,
      "feasibility": 0-20,
      "overall": 0-20
    },
    comment: string,
    status: "draft" | "submitted"
  }
  Action: upsert score, auto-calculate totalScore
  Validation: if status=submitted, cannot update again
  
RUBRIC CONSTANTS (hardcode in service):
  ABSTRACT max total = 30
  PAPER max total = 80
  FINAL max total = 100

--- CERTIFICATES (PUBLIC VERIFY) ---
GET /api/certificates/verify/:id
  Public
  Returns: certificate detail or 404

GET /api/certificates
  Auth: SISWA only (own certificates)
  Returns: certificates with event info

--- ADMIN ---
All routes: Auth required, role must be ADMIN or SUPERADMIN

GET /api/admin/dashboard
  Returns: {
    totalSiswa, totalEvents, totalSubmissions,
    totalTeams, totalCertificates,
    eventsByStatus: { OPEN, UPCOMING, CLOSED, DRAFT },
    submissionsByStatus: { DRAFT, SUBMITTED, SCORED },
    recentRegistrations: last 10 with user+event info,
    topEvents: events sorted by registrationCount desc
  }

GET /api/admin/events
  Query: ?search=&status=&page=1&limit=10
  Returns: paginated events with registrationCount

POST /api/admin/events
  Body: {
    title, shortDescription, fullDescription,
    theme, date, location, format,
    category, image, status, deadline,
    fee, teamSizeMin, teamSizeMax,
    eligibility[], sdgs[], prizePool, organizer,
    timeline: [{ date, title, description, order }],
    faqs: [{ question, answer, order }],
    categories: [{ name, description }]
  }
  Action: create event with nested timeline/faqs/categories

PUT /api/admin/events/:id
  Body: same as POST (partial update)
  Action: update event + replace timeline/faqs/categories

PATCH /api/admin/events/:id/status
  Body: { status: EventStatus }

DELETE /api/admin/events/:id
  Validation: cannot delete if has registrations

GET /api/admin/submissions
  Query: ?eventId=&status=&stage=&page=1&limit=10
  Returns: paginated submissions with team+event+score info

PATCH /api/admin/submissions/:id/stage
  Body: { stage: JudgingStage }
  Action: advance submission to next stage

POST /api/admin/certificates
  Body: { recipientId, eventId, type, award, issuedBy }
  Returns: created certificate

GET /api/admin/certificates
  Query: ?eventId=&type=&page=1&limit=10
  Returns: paginated certificates

PATCH /api/admin/certificates/:id/revoke
  Body: { reason }

GET /api/admin/siswa
  Query: ?search=&province=&schoolLevel=&page=1&limit=10
  Returns: paginated siswa with profile info

GET /api/admin/siswa/:id
  Returns: full siswa detail with profile, teams, submissions

GET /api/admin/reports/event/:eventId
  Returns: {
    registrationCount,
    submissionCount,
    scoredCount,
    averageScore,
    scoresByCategory: [{ categoryName, avgScore, count }],
    topSubmissions: top 10 by totalScore
  }

--- SUPERADMIN ---
All routes: Auth required, role must be SUPERADMIN only

GET /api/superadmin/users
  Query: ?search=&role=ADMIN|JURI&page=1&limit=10
  Returns: paginated ADMIN and JURI users only

POST /api/superadmin/users
  Body: { fullName, email, password, role: "ADMIN"|"JURI" }
  Action: create ADMIN or JURI account
  Returns: created user (no password)

PUT /api/superadmin/users/:id
  Body: { fullName, email, password? }
  Validation: can only edit ADMIN or JURI (not SUPERADMIN)

PATCH /api/superadmin/users/:id/toggle-active
  Action: toggle isActive true/false
  Effect: inactive user cannot login

DELETE /api/superadmin/users/:id
  Validation: cannot delete SUPERADMIN,
              cannot delete self

POST /api/superadmin/juri-assignments
  Body: { juriId, eventId, categoryId, currentStage }
  Validation: juriId must have role JURI,
              category must belong to event
  Returns: created JuriAssignment

DELETE /api/superadmin/juri-assignments/:id
  Action: remove assignment

GET /api/superadmin/system-stats
  Returns: {
    totalUsers: { ADMIN, JURI, SISWA },
    totalEvents, totalSubmissions, totalScores,
    totalCertificates,
    storageUsed: size of uploads/ folder in MB
  }

=============================================================
MIDDLEWARE DETAILS
=============================================================

auth.middleware.ts:
  export const authenticate = (req, res, next) => {
    // Extract "Bearer <token>" from Authorization header
    // Verify with ACCESS_TOKEN_SECRET
    // Attach { id, email, role } to req.user
    // 401 if missing or invalid
    // 401 with message "Token expired" if expired
  }

role.middleware.ts:
  export const requireRole = (...roles: UserRole[]) => 
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json(...)
      }
      next()
    }

validate.middleware.ts:
  export const validate = (schema: ZodSchema) =>
    (req, res, next) => {
      const result = schema.safeParse(req.body)
      if (!result.success) {
        return res.status(422).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors
        })
      }
      req.body = result.data
      next()
    }

upload.middleware.ts:
  Configure multer:
  - storage: diskStorage
  - destination: ./uploads/${userId}/${Date.now()}/
  - filename: keep original with timestamp prefix
  - limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  - fileFilter: allow only:
    pdf, docx, pptx, jpg, jpeg, png, mp4
  
  Export:
  - uploadSingle = multer.single('file')
  - uploadAvatar = multer with 2MB limit, jpg/png only

=============================================================
UTILS
=============================================================

jwt.ts:
  generateAccessToken(payload: {id, email, role}): string
    → sign with ACCESS_TOKEN_SECRET, expiresIn: '15m'
  
  generateRefreshToken(payload: {id}): string  
    → sign with REFRESH_TOKEN_SECRET, expiresIn: '7d'
  
  verifyAccessToken(token): {id, email, role} | null
  verifyRefreshToken(token): {id} | null

response.ts:
  success(res, data, message = "Success", code = 200)
    → res.status(code).json({ success: true, message, data })
  
  error(res, message, code = 400, errors = null)
    → res.status(code).json({ success: false, message, errors })
  
  paginated(res, data, total, page, limit)
    → res.status(200).json({
        success: true,
        data,
        pagination: { total, page, limit,
                      totalPages: Math.ceil(total/limit) }
      })

generateCode.ts:
  async generateTeamCode(prisma): Promise<string>
    → loop: generate random 6-char uppercase alphanumeric
    → check DB: if exists, regenerate
    → return unique code

=============================================================
EXPRESS.D.TS
=============================================================

import { UserRole } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
      }
    }
  }
}

export {}

=============================================================
APP.TS
=============================================================

import express from 'express'
import cors from 'cors'
import path from 'path'

// Import all route files

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/siswa', authenticate, siswaRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/teams', authenticate, teamsRoutes)
app.use('/api/submissions', authenticate, submissionsRoutes)
app.use('/api/juri', authenticate, requireRole('JURI'), juriRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/admin', authenticate, requireRole('ADMIN','SUPERADMIN'), adminRoutes)
app.use('/api/superadmin', authenticate, requireRole('SUPERADMIN'), superadminRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

export default app

=============================================================
SEED FILE (prisma/seed.ts)
=============================================================

Create seed with these accounts (hash all passwords with bcryptjs):

1. SUPERADMIN
   fullName: "Super Admin"
   email: "superadmin@moova.test"
   password: "superadmin123"

2. ADMIN
   fullName: "Admin MOOVA"
   email: "admin@moova.test"
   password: "admin123"

3. JURI x2
   email: "juri1@moova.test" / password: "juri123"
   email: "juri2@moova.test" / password: "juri123"

4. SISWA x2
   email: "siswa@moova.test" / password: "siswa123"
   fullName: "Budi Santoso"
   → also create SiswaProfile with:
     phone, schoolName: "SMAN 1 Jakarta",
     schoolLevel: "SMA", grade: "Kelas 11",
     province: "DKI Jakarta", city: "Jakarta Selatan"
     skills: ["Python", "Machine Learning"]
     completeness: calculate and store

5. Sample Event:
   title: "Olimpiade Sains dan Teknologi Nasional 2025"
   status: OPEN
   format: HYBRID
   location: "Jakarta & Online"
   deadline: "2025-06-30"
   → with 3 timeline entries
   → with 2 FAQ entries
   → with 3 categories:
     "Matematika", "Fisika", "Informatika"

6. Sample Team:
   name: "Tim Alpha"
   → siswa as LEADER

7. Assign juri1 to event category "Informatika"
   stage: PAPER

8. Sample Certificate for siswa:
   type: PARTICIPANT
   award: "Peserta Olimpiade 2024"

=============================================================
ERROR HANDLING
=============================================================

In every controller, wrap logic in try/catch.
Map Prisma errors:
  P2002 (unique) → 409 "Data already exists"
  P2025 (not found) → 404 "Data not found"
  P2003 (FK violation) → 400 "Invalid reference"

Map JWT errors:
  TokenExpiredError → 401 "Token expired, please login again"
  JsonWebTokenError → 401 "Invalid token"

=============================================================
.ENV.EXAMPLE
=============================================================

DATABASE_URL="postgresql://postgres:password@localhost:5432/moova_db"
ACCESS_TOKEN_SECRET="moova_access_secret_change_this_in_production"
REFRESH_TOKEN_SECRET="moova_refresh_secret_change_this_in_production"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"

=============================================================
GENERATE ALL FILES IN ORDER
=============================================================

Generate every file completely with full implementation.
No placeholder comments. Every function must work.
Order:
1. package.json
2. tsconfig.json
3. .env.example
4. prisma/schema.prisma
5. prisma/seed.ts
6. src/utils/response.ts
7. src/utils/jwt.ts
8. src/utils/generateCode.ts
9. src/types/express.d.ts
10. src/config/database.ts
11. src/middlewares/auth.middleware.ts
12. src/middlewares/role.middleware.ts
13. src/middlewares/validate.middleware.ts
14. src/middlewares/upload.middleware.ts
15. src/modules/auth/ (all 4 files)
16. src/modules/siswa/ (all 4 files)
17. src/modules/events/ (all 4 files)
18. src/modules/teams/ (all 4 files)
19. src/modules/submissions/ (all 4 files)
20. src/modules/juri/ (all 4 files)
21. src/modules/certificates/ (controller+service+routes)
22. src/modules/admin/ (controller+service+routes)
23. src/modules/superadmin/ (controller+service+routes)
24. src/app.ts
25. src/server.ts