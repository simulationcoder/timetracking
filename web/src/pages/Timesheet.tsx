import { useMemo, useState } from "react";
import { addWeeks, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import TimesheetListGrid from "@/components/TimesheetGrid";
import TimesheetGridInline from "@/components/TimesheetGridInline";
import TimeEntryDialog, { TimeEntryFormValues } from "@/components/TimeEntryDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  useActivities,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useProjects,
  useTimesheetEntries,
  useTimesheetForWeek,
  useSubmitTimesheet,
  useUpdateTimeEntry,
  useWeekDays,
} from "@/api/queries";
import type { TimeEntry } from "@/types/timesheet";

const Timesheet = () => {
  const { user, hasPanel } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const canTrackTime = user?.role !== "admin" && hasPanel("timesheets", { includeAdmin: false });

  const weekLabel = useMemo(
    () => format(currentWeek, "'Week of' MMM d, yyyy"),
    [currentWeek],
  );

  const weekDays = useWeekDays(currentWeek);

  const {
    data: timesheet,
    isLoading: loadingTimesheet,
    isError,
  } = useTimesheetForWeek(canTrackTime ? currentWeek : null);

  const timesheetId = timesheet?.id;

  const { data: entries = [], isLoading: loadingEntries } = useTimesheetEntries(timesheetId);
  const { data: projects = [] } = useProjects();
  const { data: activities = [] } = useActivities();

  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const defaultFormValues: TimeEntryFormValues = useMemo(
    () => ({
      project_id: "",
      activity_id: "",
      date: weekDays[0]?.iso ?? "",
      hours: "",
      notes: "",
      billable: true,
    }),
    [weekDays],
  );

  const projectMap = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          project.client ? `${project.name} (${project.client})` : project.name,
        ]),
      ),
    [projects],
  );

  const activityMap = useMemo(
    () =>
      new Map(
        activities.map((activity) => [
          activity.id,
          activity.description || activity.code || `Activity ${activity.id}`,
        ]),
      ),
    [activities],
  );

  const listRows = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({
          entry,
          projectLabel:
          projectMap.get(entry.project_id) ?? `Project ${entry.project_id ?? "-"}`,
          activityLabel:
            activityMap.get(entry.activity_id) ?? `Activity ${entry.activity_id ?? "-"}`,
        })),
    [entries, projectMap, activityMap],
  );

  const submitMutation = useSubmitTimesheet();

  const handleSubmit = () => {
    if (!timesheetId) return;
    submitMutation.mutate(timesheetId, {
      onSuccess: () => toast.success("Timesheet submitted for approval"),
      onError: (error: any) =>
        toast.error(error?.message ?? "Unable to submit timesheet right now"),
    });
  };

  const handleWeekChange = (direction: number) =>
    setCurrentWeek((prev) => addWeeks(prev, direction));

  const canEditTimesheet = canTrackTime && timesheet?.status === "draft";

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDeleteEntry = (entry: TimeEntry) => {
    if (!timesheetId) return;
    setDeletingId(entry.id);
    deleteEntry.mutate(
      { entryId: entry.id, timesheetId },
      {
        onSuccess: () => toast.success("Entry removed"),
        onError: (error: any) => toast.error(error?.message ?? "Unable to delete entry"),
        onSettled: () => setDeletingId(null),
      },
    );
  };

  const currentFormValues: TimeEntryFormValues = editingEntry
    ? {
        project_id: editingEntry.project_id,
        activity_id: editingEntry.activity_id,
        date: editingEntry.date,
        hours: editingEntry.hours.toString(),
        notes: editingEntry.notes ?? "",
        billable: editingEntry.billable,
      }
    : defaultFormValues;

  const handleDialogSubmit = (values: TimeEntryFormValues) => {
    if (!timesheetId) return;
    const payload = {
      project_id: Number(values.project_id),
      activity_id: Number(values.activity_id),
      date: values.date,
      hours: Number(values.hours),
      notes: values.notes.trim() ? values.notes : null,
      billable: values.billable,
    };

    if (editingEntry) {
      updateEntry.mutate(
        { entryId: editingEntry.id, timesheetId, data: payload },
        {
          onSuccess: () => {
            toast.success("Entry updated");
            setDialogOpen(false);
          },
          onError: (error: any) =>
            toast.error(error?.message ?? "Unable to update time entry"),
        },
      );
    } else {
      createEntry.mutate(
        { timesheet_id: timesheetId, ...payload },
        {
          onSuccess: () => {
            toast.success("Entry added");
            setDialogOpen(false);
          },
          onError: (error: any) =>
            toast.error(error?.message ?? "Unable to add time entry"),
        },
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Timesheet</h1>
            <p className="mt-1 text-muted-foreground">
              Track your time across projects and tasks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleWeekChange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="rounded-md border px-4 py-2 text-sm font-medium">
              {weekLabel}
            </span>
            <Button variant="outline" size="icon" onClick={() => handleWeekChange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!canTrackTime ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              You don&apos;t have access to timesheets. Contact an administrator if this is
              unexpected.
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="p-10 text-center text-destructive">
              We couldn&apos;t load your timesheet for this week.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <TimesheetListGrid
              weekLabel={weekLabel}
              status={timesheet?.status}
              rows={listRows}
              isLoading={loadingTimesheet || loadingEntries}
              onSubmit={timesheetId ? handleSubmit : undefined}
              submitting={submitMutation.isPending}
              canEdit={!!canEditTimesheet}
              onAdd={handleOpenCreate}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteEntry}
              deletingId={deletingId}
            />

            <TimesheetGridInline
              weekLabel={weekLabel}
              status={timesheet?.status}
              weekDays={weekDays}
              projects={projects}
              activities={activities}
              entries={entries}
              canEdit={!!canEditTimesheet}
              onCreate={async ({ project_id, activity_id, date, hours }) => {
                if (!timesheetId) return;
                try {
                  await createEntry.mutateAsync({
                    timesheet_id: timesheetId,
                    project_id,
                    activity_id,
                    date,
                    hours,
                  });
                } catch (error: any) {
                  toast.error(error?.message ?? "Unable to add time entry");
                  throw error;
                }
              }}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Week Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="min-h-[120px] w-full resize-none rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add any notes or comments about this week's time entries..."
            />
          </CardContent>
        </Card>
      </div>

      <TimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weekDays={weekDays}
        projects={projects}
        activities={activities}
        initialValues={currentFormValues}
        mode={editingEntry ? "edit" : "create"}
        onSubmit={handleDialogSubmit}
        submitting={createEntry.isPending || updateEntry.isPending}
      />
    </AppLayout>
  );
};

export default Timesheet;
