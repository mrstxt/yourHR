import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, CompanyAccount, UserRole } from "@/types/hr";
import { localDate } from "@/lib/datetime";

const COMPANIES_KEY = "yourhr_companies_clean_v1";
const USER_KEY = "yourhr_user_clean_v1";
const ADMIN_CREDENTIALS_KEY = "yourhr_admin_credentials_v1";

interface AdminCredentials {
  username: string;
  password: string;
}

interface LoginResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

interface CreateCompanyInput {
  name: string;
  contactName: string;
  contactInfo: string;
  username?: string;
  password?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  companies: CompanyAccount[];
  adminCredentials: AdminCredentials;
  login: (username: string, password: string, role: UserRole) => LoginResult;
  logout: () => void;
  createCompany: (input: CreateCompanyInput) => CompanyAccount;
  updateCompanyStatus: (id: string, status: CompanyAccount["status"]) => void;
  updateAdminCredentials: (credentials: AdminCredentials) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const seedCompanies: CompanyAccount[] = [];
const defaultAdminCredentials: AdminCredentials = {
  username: "admin",
  password: "admin123",
};

function readAdminCredentials() {
  const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
  if (!raw) return defaultAdminCredentials;

  try {
    const parsed = JSON.parse(raw) as Partial<AdminCredentials>;
    if (!parsed.username || !parsed.password) return defaultAdminCredentials;
    return {
      username: parsed.username,
      password: parsed.password,
    };
  } catch {
    return defaultAdminCredentials;
  }
}

function readCompanies() {
  const raw = localStorage.getItem(COMPANIES_KEY);
  if (!raw) return seedCompanies;

  try {
    const parsed = JSON.parse(raw) as CompanyAccount[];
    return Array.isArray(parsed) ? parsed : seedCompanies;
  } catch {
    return seedCompanies;
  }
}

function readUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "company";
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "HR";
}

function makePassword() {
  return `hr-${Math.random().toString(36).slice(2, 8)}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<CompanyAccount[]>(readCompanies);
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(readAdminCredentials);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    const localCompanies = readCompanies();
    const localAdminCredentials = readAdminCredentials();

    fetch("/api/auth-state")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const serverCompanies = Array.isArray(data.companies) ? data.companies : [];
        const nextCompanies = serverCompanies.length ? serverCompanies : localCompanies;
        const nextAdminCredentials = data.adminCredentials?.username && data.adminCredentials?.password
          ? data.adminCredentials
          : localAdminCredentials;

        setCompanies(nextCompanies);
        setAdminCredentials(nextAdminCredentials);
        setBackendReady(true);

        if (!serverCompanies.length && localCompanies.length) {
          fetch("/api/auth-state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companies: localCompanies, adminCredentials: nextAdminCredentials }),
          }).catch(() => undefined);
        }
      })
      .catch(() => setBackendReady(false))
      .finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(adminCredentials));
  }, [adminCredentials]);

  useEffect(() => {
    if (!authLoaded || !backendReady) return;
    fetch("/api/auth-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companies, adminCredentials }),
    }).catch(() => undefined);
  }, [adminCredentials, authLoaded, backendReady, companies]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    companies,
    adminCredentials,
    login: (username, password, role) => {
      const cleanUsername = username.trim();

      if (role === "Admin") {
        if (cleanUsername !== adminCredentials.username || password !== adminCredentials.password) {
          return { ok: false, message: "Admin login yoki parol noto'g'ri" };
        }

        const adminUser: AuthUser = {
          email: `${adminCredentials.username}@yourhr.local`,
          role: "Admin",
          name: "Super Admin",
          initials: "SA",
        };
        setUser(adminUser);
        return { ok: true, message: "Super admin panelga kirdingiz", user: adminUser };
      }

      const company = companies.find((item) => item.username === cleanUsername && item.password === password);
      if (!company) return { ok: false, message: "HR login yoki parol noto'g'ri" };
      if (company.status !== "active") return { ok: false, message: "Bu kompaniya vaqtincha bloklangan" };

      const hrUser: AuthUser = {
        email: `${company.username}@yourhr.local`,
        role: "HR Manager",
        name: company.contactName || `${company.name} HR`,
        initials: initials(company.contactName || company.name),
        companyId: company.id,
        companyName: company.name,
      };
      setUser(hrUser);
      return { ok: true, message: `${company.name} HR paneliga kirdingiz`, user: hrUser };
    },
    logout: () => setUser(null),
    createCompany: (input) => {
      const baseUsername = input.username?.trim() || slugify(input.name);
      let username = slugify(baseUsername);
      let index = 2;
      while (companies.some((company) => company.username === username)) {
        username = `${slugify(baseUsername)}-${index}`;
        index += 1;
      }

      const company: CompanyAccount = {
        id: `cmp_${Date.now()}`,
        name: input.name.trim(),
        username,
        password: input.password?.trim() || makePassword(),
        contactName: input.contactName.trim(),
        contactInfo: input.contactInfo.trim(),
        status: "active",
        createdAt: localDate(),
      };

      setCompanies((prev) => [company, ...prev]);
      return company;
    },
    updateCompanyStatus: (id, status) => {
      setCompanies((prev) => prev.map((company) => company.id === id ? { ...company, status } : company));
    },
    updateAdminCredentials: (credentials) => {
      const nextCredentials = {
        username: credentials.username.trim(),
        password: credentials.password,
      };

      setAdminCredentials(nextCredentials);
      setUser((prev) => {
        if (!prev || prev.role !== "Admin") return prev;
        return {
          ...prev,
          email: `${nextCredentials.username}@yourhr.local`,
        };
      });
    },
    resetDemoData: () => {
      setCompanies(seedCompanies);
    },
  }), [adminCredentials, companies, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
