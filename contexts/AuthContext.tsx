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
  role: "SUPERADMIN" | "ADMIN" | "JURI" | "SISWA";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isJudge: boolean;
  isSiswa: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("giva_access_token");
      if (token) {
        try {
          const response = await authApi.me();
          setUser(response.data.data);
          localStorage.setItem("giva_user", JSON.stringify(response.data.data));
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
    localStorage.setItem("giva_access_token", accessToken);
    localStorage.setItem("giva_refresh_token", refreshToken);
    localStorage.setItem("giva_user", JSON.stringify(user));
    setUser(user);
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
  const isJudge = user?.role === "JURI";
  const isSiswa = user?.role === "SISWA";

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
        isSiswa,
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
