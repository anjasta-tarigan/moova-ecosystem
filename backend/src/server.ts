import "./config/env";
import app from "./app";
import prisma from "./config/database";

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    // Hanya connect database jika bukan di Vercel
    // Di Vercel, koneksi database handled per-request
    if (process.env.VERCEL !== "1") {
      await prisma.$connect();
      console.log("Database connected");
    }

    // Hanya jalankan listen jika bukan di Vercel
    if (process.env.VERCEL !== "1") {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to connect database", error);
    process.exit(1);
  }
};

// Export default app untuk Vercel serverless
export default app;

// Jalankan bootstrap untuk development/standalone server
void bootstrap();
