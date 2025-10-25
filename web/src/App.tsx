import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "@/pages/Index";
import TimesheetPage from "@/pages/Timesheet";
import SettingsPage from "@/pages/Settings";
import ApprovalsPage from "@/pages/Approvals";
import PermissionsPage from "@/pages/admin/Permissions";
import LegacyApp, { ProtectedRoute, PanelRoute } from "./legacy/LegacyApp.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/timesheet"
          element={(
            <PanelRoute panel="timesheets">
              <TimesheetPage />
            </PanelRoute>
          )}
        />
        <Route
          path="/approvals"
          element={(
            <PanelRoute panel="submitted">
              <ApprovalsPage />
            </PanelRoute>
          )}
        />
        <Route
          path="/permissions"
          element={(
            <PanelRoute panel="permissions">
              <PermissionsPage />
            </PanelRoute>
          )}
        />
        <Route
          path="/settings"
          element={(
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/*" element={<LegacyApp />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
