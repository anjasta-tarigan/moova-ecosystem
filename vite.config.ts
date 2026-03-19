import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-charts": ["recharts"],
            "vendor-table": ["@tanstack/react-table"],
            "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-utils": ["axios", "date-fns", "lucide-react"],
            "pages-admin": [
              "./pages/admin/AdminDashboard",
              "./pages/admin/AdminEvents",
              "./pages/admin/AdminEventForm",
              "./pages/admin/AdminSubmissions",
              "./pages/admin/AdminSiswa",
              "./pages/admin/AdminCertificates",
              "./pages/admin/AdminReports",
            ],
            "pages-superadmin": [
              "./pages/superadmin/SuperAdminDashboard",
              "./pages/superadmin/SuperAdminUsers",
              "./pages/superadmin/SuperAdminJudgeAssignments",
            ],
            "pages-judge": [
              "./pages/JudgeHome",
              "./pages/JudgeDashboard",
              "./pages/JudgeEventView",
              "./pages/JudgeScoringView",
              "./pages/JudgeCertificates",
            ],
            "pages-dashboard": [
              "./pages/DashboardPage",
              "./pages/DashboardEventHub",
              "./pages/DashboardTeam",
              "./pages/DashboardSubmission",
              "./pages/DashboardCertificates",
              "./pages/DashboardProfile",
            ],
          },
        },
      },
    },
  };
});
