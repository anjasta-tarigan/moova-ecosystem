import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./modules/auth/auth.routes";
import siswaRoutes from "./modules/siswa/siswa.routes";
import eventsRoutes from "./modules/events/events.routes";
import teamsRoutes from "./modules/teams/teams.routes";
import submissionsRoutes from "./modules/submissions/submissions.routes";
import judgeRoutes from "./modules/judge/judge.routes";
import certificatesRoutes from "./modules/certificates/certificates.routes";
import adminRoutes from "./modules/admin/admin.routes";
import superadminRoutes from "./modules/superadmin/superadmin.routes";
import { authenticate } from "./middlewares/auth.middleware";
import { requireRole } from "./middlewares/role.middleware";
import { getStudentEventDetail } from "./modules/events/events.controller";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/siswa", siswaRoutes);
app.get(
  "/api/student/events/:slug",
  authenticate,
  requireRole("STUDENT"),
  getStudentEventDetail,
);
app.use("/api/events", eventsRoutes);
app.use("/api/teams", authenticate, requireRole("STUDENT"), teamsRoutes);
app.use(
  "/api/submissions",
  authenticate,
  requireRole("STUDENT"),
  submissionsRoutes,
);
app.use("/api/judge", authenticate, requireRole("JUDGE"), judgeRoutes);
app.use("/api", certificatesRoutes);
app.use(
  "/api/admin",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  adminRoutes,
);
app.use(
  "/api/superadmin",
  authenticate,
  requireRole("SUPERADMIN"),
  superadminRoutes,
);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
