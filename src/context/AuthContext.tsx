import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, CompanyAccount, UserRole } from "@/types/hr";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const COMPANIES_KEY = "yourhr_companies_clean_v1";
const USER_KEY = "yourhr_user_clean_v1";

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
  login: (username: string, password: string, role: UserRole) => LoginResult;
  logout: () => void;
  createCompany: (input: CreateCompanyInput) => CompanyAccount;
  updateCompanyStatus: (id: string, status: CompanyAccount["status"]) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const seedCompanies: CompanyAccount[] = [];

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

  useEffect(() => {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    companies,
    login: (username, password, role) => {
      const cleanUsername = username.trim();

      if (role === "Admin") {
        if (cleanUsername !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
          return { ok: false, message: "Admin login yoki parol noto'g'ri" };
        }

        const adminUser: AuthUser = {
          email: "admin@yourhr.uz",
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
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setCompanies((prev) => [company, ...prev]);
      return company;
    },
    updateCompanyStatus: (id, status) => {
      setCompanies((prev) => prev.map((company) => company.id === id ? { ...company, status } : company));
    },
    resetDemoData: () => {
      setCompanies(seedCompanies);
    },
  }), [companies, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
