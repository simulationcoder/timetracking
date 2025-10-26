import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Activity, Project } from "@/types/timesheet";

export interface TimeEntryFormValues {
  project_id: number | "";
  activity_id: number | "";
  date: string;
  hours: string;
  notes: string;
  billable: boolean;
}

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekDays: Array<{ label: string; iso: string }>;
  projects: Project[];
  activities: Activity[];
  initialValues: TimeEntryFormValues;
  mode: "create" | "edit";
  onSubmit: (values: TimeEntryFormValues) => void;
  submitting?: boolean;
}

const defaultValues: TimeEntryFormValues = {
  project_id: "",
  activity_id: "",
  date: "",
  hours: "",
  notes: "",
  billable: true,
};

const TimeEntryDialog = ({
  open,
  onOpenChange,
  weekDays,
  projects,
  activities,
  initialValues,
  mode,
  onSubmit,
  submitting = false,
}: TimeEntryDialogProps) => {
  const [formValues, setFormValues] = useState<TimeEntryFormValues>(defaultValues);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setFormValues(initialValues);
      setTouched(false);
    }
  }, [open, initialValues]);

  const activityOptions = useMemo(() => {
    if (!formValues.project_id) return activities;
    return activities.filter((activity) => activity.project_id === formValues.project_id);
  }, [activities, formValues.project_id]);

  useEffect(() => {
    if (!open) return;
    if (formValues.activity_id === "") return;
    const match = activityOptions.some((activity) => activity.id === formValues.activity_id);
    if (!match) {
      setFormValues((prev) => ({ ...prev, activity_id: "" }));
    }
  }, [activityOptions, formValues.activity_id, open]);

  const handleChange = <K extends keyof TimeEntryFormValues>(key: K, value: TimeEntryFormValues[K]) => {
    setTouched(true);
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = Boolean(
    formValues.project_id &&
      formValues.activity_id &&
      formValues.date &&
      formValues.hours &&
      Number(formValues.hours) > 0,
  );

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit(formValues);
  };

  const title = mode === "create" ? "Add Time Entry" : "Edit Time Entry";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select a project, activity, and enter hours for the chosen day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="project">Project</Label>
            <Select
              value={formValues.project_id === "" ? "" : String(formValues.project_id)}
              onValueChange={(value) =>
                handleChange("project_id", value === "" ? "" : Number(value))
              }
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.client ? `${project.name} (${project.client})` : project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="activity">Activity</Label>
            <Select
              value={formValues.activity_id === "" ? "" : String(formValues.activity_id)}
              onValueChange={(value) =>
                handleChange("activity_id", value === "" ? "" : Number(value))
              }
            >
              <SelectTrigger id="activity">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((activity) => (
                  <SelectItem key={activity.id} value={String(activity.id)}>
                    {activity.code ? `${activity.code} — ` : ""}
                    {activity.description || `Activity ${activity.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Select
                value={formValues.date}
                onValueChange={(value) => handleChange("date", value)}
              >
                <SelectTrigger id="date">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={day.iso} value={day.iso}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.25"
                value={formValues.hours}
                onChange={(event) => handleChange("hours", event.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formValues.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Billable</p>
              <p className="text-xs text-muted-foreground">
                Toggle if these hours should be marked as billable.
              </p>
            </div>
            <Switch
              checked={formValues.billable}
              onCheckedChange={(checked) => handleChange("billable", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Add Entry" : "Save Changes"}
            </Button>
          </div>
          {touched && !canSubmit && (
            <p className="text-xs text-destructive">
              Project, activity, date, and a positive number of hours are required.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
