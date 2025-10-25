import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApproverTimesheet } from "@/types/timesheet";
import { Check, X } from "lucide-react";

interface ApprovalCardProps {
  timesheet: ApproverTimesheet;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const ApprovalCard = ({ timesheet, onApprove, onReject }: ApprovalCardProps) => {
  const getStatusColor = (status: string) => {
    if (status === "approved") return "success";
    if (status === "rejected") return "destructive";
    if (status === "submitted") return "warning";
    return "secondary";
  };

  const weekStart = new Date(timesheet.week_start);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const disabled = timesheet.status !== "submitted";
  const decision = timesheet.approval.decision;
  const decidedAt = timesheet.approval.decided_at
    ? new Date(timesheet.approval.decided_at)
    : null;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{timesheet.employee.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Week: {weekStart.toLocaleDateString()} – {weekEnd.toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusColor(timesheet.status) as any}>
            {timesheet.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Hours</span>
            <span className="text-2xl font-bold text-primary">
              {timesheet.total_hours.toFixed(1)}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Latest decision</p>
            <p className="text-sm text-muted-foreground">
              {decision
                ? `${decision.toUpperCase()}${
                    decidedAt ? ` on ${decidedAt.toLocaleString()}` : ""
                  }`
                : "Pending review"}
            </p>
            {timesheet.approval.comment && (
              <p className="rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">
                “{timesheet.approval.comment}”
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={disabled}
              onClick={() => onApprove?.(timesheet.id)}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={() => onReject?.(timesheet.id)}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalCard;
