import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/api/authApi";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "JUDGE" | "STUDENT";
  avatar?: string;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isJudge: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (payload: any): User => ({
  id: payload?.id,
  fullName: payload?.fullName || "User",
  email: payload?.email || "",
  role: payload?.role,
  avatar: payload?.avatar,
  organization: payload?.organization,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("giva_access_token");
      if (token) {
        try {
          const response = await authApi.me();
          const mappedUser = mapUser(response.data.data);
          setUser(mappedUser);
          localStorage.setItem("giva_user", JSON.stringify(mappedUser));
        } catch (error) {
          console.error("Token validation failed", error);
          localStorage.removeItem("giva_access_token");
          localStorage.removeItem("giva_refresh_token");
          localStorage.removeItem("giva_user");
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { accessToken, refreshToken, user } = response.data.data;
    const mappedUser = mapUser(user);
    localStorage.setItem("giva_access_token", accessToken);
    localStorage.setItem("giva_refresh_token", refreshToken);
    localStorage.setItem("giva_user", JSON.stringify(mappedUser));
    setUser(mappedUser);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("giva_refresh_token");
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
    localStorage.removeItem("giva_access_token");
    localStorage.removeItem("giva_refresh_token");
    localStorage.removeItem("giva_user");
    setUser(null);
  };

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isAdmin = user?.role === "ADMIN" || isSuperAdmin;
  const isJudge = user?.role === "JUDGE";
  const isStudent = user?.role === "STUDENT";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isSuperAdmin,
        isAdmin,
        isJudge,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
