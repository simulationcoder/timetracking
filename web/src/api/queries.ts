import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  Activity,
  ApproverSummary,
  ApproverTimesheet,
  Project,
  TimeEntry,
  TimesheetSummary,
} from "@/types/timesheet";
import type { TeamSummary } from "@/types/team";

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => (await apiFetch("/projects")) as Project[],
  });

export const useActivities = () =>
  useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: async () => (await apiFetch("/activities")) as Activity[],
  });

export const useTimesheetForWeek = (weekStart: Date | null) =>
  useQuery<TimesheetSummary | null>({
    queryKey: ["timesheet", weekStart ? toISODate(weekStart) : null],
    enabled: Boolean(weekStart),
    queryFn: async () => {
      if (!weekStart) return null;
      return (await apiFetch("/timesheets", {
        method: "POST",
        body: { week_start: toISODate(weekStart) },
      })) as TimesheetSummary;
    },
  });

export const useTimesheetEntries = (timesheetId?: number | null) =>
  useQuery<TimeEntry[]>({
    queryKey: ["time-entries", timesheetId],
    enabled: Boolean(timesheetId),
    queryFn: async () =>
      (await apiFetch(`/time-entries?tid=${timesheetId}`)) as TimeEntry[],
  });

export const useMyTimesheets = () =>
  useQuery<TimesheetSummary[]>({
    queryKey: ["timesheets"],
    queryFn: async () => (await apiFetch("/timesheets")) as TimesheetSummary[],
  });

export const useApproverTimesheets = (approverId?: number | null, enabled = true) =>
  useQuery<ApproverTimesheet[]>({
    queryKey: ["approver-timesheets", approverId],
    enabled: Boolean(approverId) && enabled,
    queryFn: async () =>
      (await apiFetch(`/approvers/${approverId}/timesheets`)) as ApproverTimesheet[],
  });

export const useApprovers = (enabled = true) =>
  useQuery<ApproverSummary[]>({
    queryKey: ["approvers"],
    enabled,
    queryFn: async () => (await apiFetch("/approvers")) as ApproverSummary[],
  });

export const useMyTeams = () =>
  useQuery<TeamSummary[]>({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const response = (await apiFetch("/me/team")) as { teams?: TeamSummary[] };
      return response?.teams ?? [];
    },
  });

type CreateTimeEntryPayload = {
  timesheet_id: number;
  project_id: number;
  activity_id: number;
  date: string;
  hours: number;
  notes?: string | null;
  billable?: boolean;
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTimeEntryPayload) =>
      apiFetch("/time-entries", {
        method: "POST",
        body: { ...payload, billable: payload.billable ?? true },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", variables.timesheet_id] });
      queryClient.invalidateQueries({ queryKey: ["approver-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet"], exact: false });
    },
  });
};

export const useSubmitTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (timesheetId: number) =>
      apiFetch(`/timesheets/${timesheetId}/submit`, { method: "POST" }),
    onSuccess: (_data, timesheetId) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", timesheetId] });
      queryClient.invalidateQueries({ queryKey: ["timesheet"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["approver-timesheets"] });
    },
  });
};

export const useWeekDays = (weekStart: Date | null) =>
  useMemo(() => {
    if (!weekStart) return [];
    const base = new Date(weekStart);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        iso: toISODate(date),
      };
    });
  }, [weekStart]);

type ApprovalDecisionPayload = {
  timesheetId: number;
  decision: "approve" | "reject";
  comment?: string | null;
};

export const useApprovalDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ timesheetId, decision, comment }: ApprovalDecisionPayload) =>
      apiFetch(`/approvals/${timesheetId}`, {
        method: "POST",
        body: { decision, comment: comment ?? null },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approver-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"], exact: false });
    },
  });
};

type UpdateTimeEntryPayload = {
  entryId: number;
  timesheetId: number;
  data: {
    project_id: number;
    activity_id: number;
    date: string;
    hours: number;
    notes?: string | null;
    billable?: boolean;
  };
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: UpdateTimeEntryPayload) =>
      apiFetch(`/time-entries/${entryId}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", variables.timesheetId] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["timesheet"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["approver-timesheets"] });
    },
  });
};

type DeleteTimeEntryPayload = { entryId: number; timesheetId: number };

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId }: DeleteTimeEntryPayload) =>
      apiFetch(`/time-entries/${entryId}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", variables.timesheetId] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["timesheet"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["approver-timesheets"] });
    },
  });
};
