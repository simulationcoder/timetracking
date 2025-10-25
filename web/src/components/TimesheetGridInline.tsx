import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Activity, Project, TimeEntry, TimesheetStatus } from "@/types/timesheet";
import { Loader2, Save } from "lucide-react";

interface InlineGridProps {
  weekLabel: string;
  status?: TimesheetStatus;
  weekDays: Array<{ iso: string; label: string }>;
  projects: Project[];
  activities: Activity[];
  entries: TimeEntry[];
  canEdit: boolean;
  onCreate: (payload: {
    project_id: number;
    activity_id: number;
    date: string;
    hours: number;
  }) => Promise<void>;
}

interface DraftRow {
  project_id: number | "";
  activity_id: number | "";
  hoursByDay: Record<string, string>;
}

const emptyDraftRow = (weekDays: Array<{ iso: string }>): DraftRow => ({
  project_id: "",
  activity_id: "",
  hoursByDay: Object.fromEntries(weekDays.map((day) => [day.iso, ""])) as Record<string, string>,
});

const TimesheetGridInline = ({
  weekLabel,
  status,
  weekDays,
  projects,
  activities,
  entries,
  canEdit,
  onCreate,
}: InlineGridProps) => {
  const [draft, setDraft] = useState(() => emptyDraftRow(weekDays));
  const [saving, setSaving] = useState(false);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, { entry: TimeEntry; date: string }[]>();
    entries.forEach((entry) => {
      const key = `${entry.project_id}-${entry.activity_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ entry, date: entry.date });
    });
    return groups;
  }, [entries]);

  const activityOptions = useMemo(() => {
    if (!draft.project_id) return activities;
    return activities.filter((activity) => activity.project_id === draft.project_id);
  }, [activities, draft.project_id]);

  const handleDraftChange = (key: keyof DraftRow, value: DraftRow[typeof key]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleHoursChange = (iso: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      hoursByDay: { ...prev.hoursByDay, [iso]: value },
    }));
  };

  const canSave = useMemo(() => {
    if (!draft.project_id || !draft.activity_id) return false;
    return weekDays.some((day) => {
      const val = Number(draft.hoursByDay[day.iso]);
      return !Number.isNaN(val) && val > 0;
    });
  }, [draft, weekDays]);

  const handleAddEntries = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      for (const day of weekDays) {
        const raw = draft.hoursByDay[day.iso];
        const hours = Number(raw);
        if (Number.isNaN(hours) || hours <= 0) continue;
        await onCreate({
          project_id: Number(draft.project_id),
          activity_id: Number(draft.activity_id),
          date: day.iso,
          hours,
        });
      }
      setDraft(emptyDraftRow(weekDays));
    } finally {
      setSaving(false);
    }
  };

  const locked = !canEdit || (status && status !== "draft");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{weekLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-left">Activity</th>
                {weekDays.map((day) => (
                  <th key={day.iso} className="px-3 py-2 text-center">
                    {day.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groupedEntries.entries()).map(([key, items]) => {
                const [projectId, activityId] = key.split("-").map(Number);
                const project = projects.find((p) => p.id === projectId);
                const activity = activities.find((a) => a.id === activityId);
                const totals: Record<string, number> = {};
                let rowTotal = 0;
                weekDays.forEach((day) => {
                  const entry = items.find((item) => item.date === day.iso);
                  const value = entry ? entry.entry.hours : 0;
                  totals[day.iso] = value;
                  rowTotal += value;
                });

                return (
                  <tr key={key} className="border-b">
                    <td className="px-3 py-3 font-medium">
                      {project ? project.name : `Project ${projectId}`}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {activity?.description || activity?.code || `Activity ${activityId}`}
                    </td>
                    {weekDays.map((day) => (
                      <td key={day.iso} className="px-3 py-3 text-center">
                        {totals[day.iso] ? `${totals[day.iso].toFixed(1)}h` : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-semibold">{rowTotal.toFixed(1)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Quick entry</h3>
            <Button size="sm" onClick={handleAddEntries} disabled={!canSave || saving || locked}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="grid-project">
                Project
              </label>
              <Select
                value={draft.project_id === "" ? "" : String(draft.project_id)}
                onValueChange={(value) => handleDraftChange("project_id", value ? Number(value) : "")}
                disabled={locked}
              >
                <SelectTrigger id="grid-project">
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
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="grid-activity">
                Activity
              </label>
              <Select
                value={draft.activity_id === "" ? "" : String(draft.activity_id)}
                onValueChange={(value) =>
                  handleDraftChange("activity_id", value ? Number(value) : "")
                }
                disabled={!draft.project_id || locked}
              >
                <SelectTrigger id="grid-activity">
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
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {weekDays.map((day) => (
              <div key={day.iso} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`hours-${day.iso}`}>
                  {day.label}
                </label>
                <Input
                  id={`hours-${day.iso}`}
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="0.0"
                  value={draft.hoursByDay[day.iso]}
                  onChange={(event) => handleHoursChange(day.iso, event.target.value)}
                  disabled={locked}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetGridInline;
