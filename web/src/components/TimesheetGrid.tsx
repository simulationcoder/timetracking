import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Plus, Send, Trash } from "lucide-react";
import type { TimesheetStatus, TimeEntry } from "@/types/timesheet";

export interface TimesheetRow {
  entry: TimeEntry;
  projectLabel: string;
  activityLabel: string;
}

interface TimesheetGridProps {
  weekLabel: string;
  status?: TimesheetStatus;
  rows: TimesheetRow[];
  isLoading?: boolean;
  onSubmit?: () => void;
  submitting?: boolean;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
  deletingId?: number | null;
}

const statusBadgeVariant = (status?: TimesheetStatus) => {
  if (status === "approved") return "success";
  if (status === "submitted") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const TimesheetGrid = ({
  weekLabel,
  status,
  rows,
  isLoading = false,
  onSubmit,
  submitting = false,
  canEdit,
  onAdd,
  onEdit,
  onDelete,
  deletingId = null,
}: TimesheetGridProps) => (
  <Card>
    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle>{weekLabel}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your time entries for the selected week.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {status && (
          <Badge variant={statusBadgeVariant(status)} className="uppercase tracking-wide">
            {status}
          </Badge>
        )}
        {canEdit && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add entry
          </Button>
        )}
        {onSubmit && (
          <Button size="sm" onClick={onSubmit} disabled={submitting || status === "submitted"}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">Loading timesheet…</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          No entries recorded for this week yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-left">Activity</th>
                <th className="px-3 py-2 text-center">Hours</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2 text-center">Billable</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, projectLabel, activityLabel }) => (
                <tr key={entry.id} className="border-b">
                  <td className="px-3 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-3 py-3 font-medium">{projectLabel}</td>
                  <td className="px-3 py-3 text-muted-foreground">{activityLabel}</td>
                  <td className="px-3 py-3 text-center font-semibold">{entry.hours.toFixed(1)}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {entry.notes ? entry.notes : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {entry.billable ? (
                      <Badge variant="outline" className="text-xs text-success">
                        Billable
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Non-billable
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={!canEdit || deletingId === entry.id}
                        onClick={() => onDelete(entry)}
                      >
                        {deletingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!canEdit && status && status !== "draft" && (
        <p className="mt-4 text-sm text-muted-foreground">
          This timesheet is locked because it has been {status}. You can still view entries but
          new edits are disabled.
        </p>
      )}
    </CardContent>
  </Card>
);

export type { TimesheetRow };
export default TimesheetGrid;
