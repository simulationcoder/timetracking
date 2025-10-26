import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek } from "date-fns";
import AppLayout from "@/components/AppLayout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  UserCircle,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  useApproverTimesheets,
  useMyTimesheets,
  useProjects,
  useTimesheetEntries,
  useTimesheetForWeek,
  useMyTeams,
} from "@/api/queries";
import { Badge } from "@/components/ui/badge";
import type { TimesheetStatus } from "@/types/timesheet";

const statusBadgeVariant = (status?: TimesheetStatus) => {
  if (status === "approved") return "success";
  if (status === "submitted") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const Index = () => {
  const navigate = useNavigate();
  const { user, hasPanel } = useAuth();
  const [weekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const userRole = (user?.role ?? "employee").toLowerCase();
  const canLogTime = user?.role !== "admin" && hasPanel("timesheets", { includeAdmin: false });
  const canApprove = hasPanel("submitted") || userRole === "manager" || userRole === "admin";
  const canManageTeam = hasPanel("permissions") || userRole === "admin";

  const { data: myTimesheets = [] } = useMyTimesheets();
  const { data: projects = [] } = useProjects();
  const { data: weekTimesheet } = useTimesheetForWeek(canLogTime ? weekStart : null);
  const { data: weekEntries = [] } = useTimesheetEntries(weekTimesheet?.id);
  const { data: approvalQueue = [] } = useApproverTimesheets(
    user?.id,
    canApprove && !!user,
  );
  const { data: myTeams = [], isLoading: loadingTeams } = useMyTeams();
  const primaryTeam = myTeams[0];

  const totalHoursThisWeek = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedCount = myTimesheets.filter((sheet) => sheet.status === "approved").length;
  const pendingMine = myTimesheets.filter((sheet) => sheet.status === "submitted").length;
  const pendingQueue = approvalQueue.filter((sheet) => sheet.status === "submitted").length;

  const recentEntries = useMemo(
    () =>
      [...weekEntries]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [weekEntries],
  );

  const weekLabel = format(weekStart, "'Week of' MMM d, yyyy");

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">Welcome back</p>
                <h2 className="text-2xl font-semibold">
                  {user?.name || "Timesheet teammate"}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">
                  You are signed in as {userRole}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canLogTime && (
                  <Button onClick={() => navigate("/timesheet")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Enter today&apos;s time
                  </Button>
                )}
                {canApprove && (
                  <Button variant="outline" onClick={() => navigate("/approvals")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Review approvals
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Hours This Week"
            value={totalHoursThisWeek.toFixed(1)}
            icon={Clock}
            subtitle={weekLabel}
          />
          <StatsCard
            title="Approved Timesheets"
            value={approvedCount.toString()}
            icon={CheckCircle}
            subtitle="All time"
          />
          <StatsCard
            title="Pending Approval"
            value={(canApprove ? pendingQueue : pendingMine).toString()}
            icon={AlertCircle}
            subtitle={canApprove ? "Queue assigned to you" : "Awaiting review"}
          />
          <StatsCard
            title="Active Projects"
            value={projects.length.toString()}
            icon={TrendingUp}
            subtitle="Available to log time"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canLogTime && (
                <>
                  <Button className="w-full justify-start" onClick={() => navigate("/timesheet")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Enter today&apos;s time
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/timesheet")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit weekly timesheet
                  </Button>
                </>
              )}
              {canApprove && (
                <>
                  <Button className="w-full justify-start" onClick={() => navigate("/approvals")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Review pending timesheets
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Users className="mr-2 h-4 w-4" />
                    View team reports
                  </Button>
                </>
              )}
              {canManageTeam && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/permissions")}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Manage permissions
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No time recorded for this week yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Project #{entry.project_id} • Activity #{entry.activity_id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{entry.hours}h</span>
                        {weekTimesheet?.status && (
                          <Badge
                            variant={statusBadgeVariant(weekTimesheet.status) as any}
                            className="text-xs"
                          >
                            {weekTimesheet.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Team Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeams ? (
              <p className="text-sm text-muted-foreground">Loading team details…</p>
            ) : primaryTeam ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 p-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCircle className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{primaryTeam.leader?.name ?? "No lead assigned"}</p>
                    <p className="text-xs text-muted-foreground">Team: {primaryTeam.name}</p>
                    {primaryTeam.leader?.email && (
                      <p className="text-xs text-muted-foreground">{primaryTeam.leader.email}</p>
                    )}
                  </div>
                </div>
                {primaryTeam.leader?.email ? (
                  <Button variant="outline" asChild className="md:self-start">
                    <a href={`mailto:${primaryTeam.leader.email}`} className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email team lead
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;re not currently assigned to a team. Reach out to your administrator if this seems incorrect.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Index;
