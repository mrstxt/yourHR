import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { HRProvider } from "@/context/HRContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import Support from "./pages/Support";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const Protected = ({ children, role }: { children: React.ReactNode; role?: "Admin" | "HR Manager" }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === "HR Manager" ? "/hr/login" : "/login"} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "Admin" ? "/admin" : "/"} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user?.role === "Admin" ? <Navigate to="/admin" replace /> : <Login mode="admin" />} />
      <Route path="/hr/login" element={user?.role === "HR Manager" ? <Navigate to="/" replace /> : <Login mode="hr" />} />
      <Route path="/hr/:companySlug/login" element={user?.role === "HR Manager" ? <Navigate to="/" replace /> : <Login mode="hr" />} />
      <Route path="/admin" element={<Protected role="Admin"><Admin /></Protected>} />
      <Route element={<Protected role="HR Manager"><AppLayout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/support" element={<Support />} />
        <Route path="/rules" element={<Rules />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <HRProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </HRProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
