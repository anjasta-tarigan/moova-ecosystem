declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "SUPERADMIN" | "ADMIN" | "JUDGE" | "STUDENT";
      };
      file?: any;
      files?: any;
    }
  }
}

export {};
