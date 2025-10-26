import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const LoadingScreen = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p className="text-sm">Loading your workspace…</p>
  </div>
);

type GuardProps = {
  children: ReactNode;
};

export const ProtectedRoute = ({ children }: GuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

type PanelGuardProps = GuardProps & {
  panel: string;
};

export const PanelRoute = ({ panel, children }: PanelGuardProps) => {
  const { user, loading, hasPanel } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPanel(panel)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: GuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

