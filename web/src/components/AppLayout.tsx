import { ReactNode, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Clock,
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPanel, logout } = useAuth();

  const userRole = (user?.role ?? "employee").toLowerCase();

  const navigation = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ["employee", "manager", "admin"],
      },
      {
        name: "Timesheet",
        href: "/timesheet",
        icon: Clock,
        roles: ["employee", "manager", "admin"],
        panel: "timesheets",
      },
      {
        name: "Approvals",
        href: "/approvals",
        icon: FileText,
        roles: ["manager", "admin"],
        panel: "submitted",
      },
      {
        name: "Permissions",
        href: "/permissions",
        icon: Users,
        roles: ["admin"],
        panel: "permissions",
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["employee", "manager", "admin"],
      },
    ],
    [],
  );

  const filteredNav = navigation.filter((item) => {
    const roleAllowed = !item.roles || item.roles.includes(userRole);
    const panelAllowed = !item.panel || hasPanel(item.panel);
    return roleAllowed && panelAllowed;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md"
                onClick={() => navigate("/")}
                title="Back to dashboard"
              >
                <Clock className="h-5 w-5 text-primary-foreground" />
              </button>
              <div className="text-left leading-tight">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-left"
                >
                  <h1 className="text-xl font-bold">TimeTrack Pro</h1>
                </button>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole} portal
                </p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden text-sm leading-tight md:flex md:flex-col md:items-end">
                <span className="font-medium">{user?.name}</span>
                <span className="capitalize text-muted-foreground">
                  {userRole}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default AppLayout;
