import "./config/env";
import app from "./app";
import prisma from "./config/database";

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect database", error);
    process.exit(1);
  }
};

void bootstrap();
