
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authService, LoginResponse } from "@/services/auth.service";
import { userService, ParentProfile } from "@/services/user.service";
import type { Child } from "@/types/platform";

// Map backend roles to frontend roles
const ROLE_MAP: Record<string, User["role"]> = {
  SUPER_ADMIN: "admin",
  ADMIN: "admin",
  TUTOR: "tutor",
  PARENT: "parent",
  CONSULTANT: "consultant",
};

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "student" | "parent" | "tutor" | "consultant" | "admin";
  avatar?: string;
  timezone: string; // IANA timezone (e.g. "Asia/Dubai")
  // Parent-specific
  children?: Child[];
  creditBalance?: number;
  // Tutor-specific (future)
  tutorProfile?: unknown;
  // Student-specific
  parentId?: string;
  grade?: string;
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<string>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Convert backend login response to frontend User shape
function mapLoginToUser(loginData: LoginResponse): User {
  const role = ROLE_MAP[loginData.user.role] || "student";
  const fullName = [loginData.user.firstName, loginData.user.lastName].filter(Boolean).join(" ") || loginData.user.email.split("@")[0];

  return {
    id: loginData.user.id,
    fullName,
    email: loginData.user.email,
    role,
    timezone: loginData.user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginData.user.email}`,
  };
}

// Compute age from date of birth
function computeAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Convert backend children to frontend Child shape
function mapBackendChildren(children: ParentProfile["children"]): Child[] {
  return children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    age: computeAge(c.dateOfBirth),
    grade: c.grade?.name || "",
    enrolledSubjects: (c.subjects || []).map((s) => s.name),
    learningPreferences: [],
  }));
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount via refresh token (HttpOnly cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await authService.refresh();
        if (result) {
          const mappedUser = mapLoginToUser(result);
          if (mappedUser.role === "parent") {
            try {
              const profile = await userService.getParentProfile();
              mappedUser.fullName = `${profile.firstName} ${profile.lastName}`;
              mappedUser.phone = profile.phone || undefined;
              mappedUser.children = mapBackendChildren(profile.children || []);
              mappedUser.creditBalance = profile.walletBalance;
            } catch {
              // Profile fetch failed — still allow login
            }
          }
          setUser(mappedUser);
        }
      } catch {
        // No valid refresh token — user stays logged out
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Listen for token expiry events from the API interceptor
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
    };
    window.addEventListener("auth:expired", handleExpiry);
    return () => window.removeEventListener("auth:expired", handleExpiry);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      const mappedUser = mapLoginToUser(result);

      // If parent, fetch full profile with children
      if (mappedUser.role === "parent") {
        try {
          const profile = await userService.getParentProfile();
          mappedUser.fullName = `${profile.firstName} ${profile.lastName}`;
          mappedUser.phone = profile.phone || undefined;
          mappedUser.children = mapBackendChildren(profile.children || []);
          mappedUser.creditBalance = profile.walletBalance;
        } catch {
          // Profile fetch failed — user can still proceed
        }
      }

      setUser(mappedUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup returns a message (e.g., "check your email to verify")
  // NOTE: Do NOT toggle isLoading here — it causes RedirectIfAuthenticated
  // to unmount the SignUp page mid-request, losing local component state.
  const signup = async (firstName: string, lastName: string, email: string, password: string): Promise<string> => {
    const result = await authService.signup(email, password, firstName, lastName);
    return result.message;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.forgotPassword(email);
  };

  // Re-fetch parent profile (call after adding/editing children)
  const refreshProfile = useCallback(async () => {
    if (!user || user.role !== "parent") return;
    try {
      const profile = await userService.getParentProfile();
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fullName: `${profile.firstName} ${profile.lastName}`,
          phone: profile.phone || undefined,
          children: mapBackendChildren(profile.children || []),
          creditBalance: profile.walletBalance,
        };
      });
    } catch {
      // Silent fail
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
