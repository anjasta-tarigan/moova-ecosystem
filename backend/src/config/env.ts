import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const candidateEnvPaths = [
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
];

const detectedEnvPath = candidateEnvPaths.find((envPath) =>
  fs.existsSync(envPath),
);

dotenv.config(detectedEnvPath ? { path: detectedEnvPath } : undefined);
