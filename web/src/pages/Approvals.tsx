import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import ApprovalCard from "@/components/ApprovalCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  useApproverTimesheets,
  useApprovers,
  useApprovalDecision,
} from "@/api/queries";

type FilterValue = "all" | "submitted" | "approved" | "rejected";

const ApprovalsPage = () => {
  const { user, hasPanel } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("submitted");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.role === "admin";
  const canReview = isAdmin || hasPanel("submitted");

  const { data: approvers = [] } = useApprovers(isAdmin);
  const [selectedApprover, setSelectedApprover] = useState<number | null>(
    isAdmin ? null : user?.id ?? null,
  );

  useEffect(() => {
    if (!isAdmin) {
      setSelectedApprover(user?.id ?? null);
      return;
    }
    if (selectedApprover == null && approvers.length > 0) {
      setSelectedApprover(approvers[0].id);
    }
  }, [isAdmin, approvers, selectedApprover, user?.id]);

  const {
    data: timesheets = [],
    isLoading,
    isError,
  } = useApproverTimesheets(selectedApprover, canReview && Boolean(selectedApprover));
  const approvalMutation = useApprovalDecision();

  const filteredTimesheets = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    return timesheets.filter((sheet) => {
      const matchesFilter = filter === "all" || sheet.status === filter;
      const matchesSearch =
        lowered.length === 0 || sheet.employee.name.toLowerCase().includes(lowered);
      return matchesFilter && matchesSearch;
    });
  }, [timesheets, filter, searchTerm]);

  const handleDecision = (timesheetId: number, decision: "approve" | "reject") => {
    approvalMutation.mutate(
      { timesheetId, decision },
      {
        onSuccess: () => {
          toast.success(
            decision === "approve" ? "Timesheet approved" : "Timesheet rejected",
          );
        },
        onError: (error: any) => {
          toast.error(error?.message ?? "Unable to update approval");
        },
      },
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve timesheets submitted by your team.
          </p>
        </div>

        {isAdmin && approvers.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Viewing queue for</p>
                <Select
                  value={selectedApprover ? String(selectedApprover) : ""}
                  onValueChange={(value) => setSelectedApprover(Number(value))}
                >
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvers.map((approver) => (
                      <SelectItem key={approver.id} value={String(approver.id)}>
                        {approver.name} ({approver.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && approvers.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No approvers are configured yet. Assign the approver role to a user to review submissions.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as FilterValue)}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="submitted">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {!canReview && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              You do not have permission to review timesheets.
            </CardContent>
          </Card>
        )}

        {canReview && (
          <>
            {isLoading && (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  Loading approvals…
                </CardContent>
              </Card>
            )}

            {isError && (
              <Card>
                <CardContent className="p-10 text-center text-destructive">
                  Unable to load approval queue right now.
                </CardContent>
              </Card>
            )}

            {selectedApprover == null && !isLoading && !isError && (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  Select an approver to view their submitted timesheets.
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && selectedApprover != null && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTimesheets.map((timesheet) => (
                    <ApprovalCard
                      key={timesheet.id}
                      timesheet={timesheet}
                      onApprove={(id) => handleDecision(id, "approve")}
                      onReject={(id) => handleDecision(id, "reject")}
                    />
                  ))}
                </div>

                {filteredTimesheets.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      No timesheets found for the selected filters.
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ApprovalsPage;
