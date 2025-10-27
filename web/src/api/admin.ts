import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { AdminRole, AdminTeam, AdminUser } from "@/types/admin";
import type { ApproverSummary } from "@/types/timesheet";

type AdminUsersOptions = {
  enabled?: boolean;
};

export const useAdminUsers = ({ enabled = true }: AdminUsersOptions = {}) =>
  useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    enabled,
    queryFn: async () => (await apiFetch("/management/users")) as AdminUser[],
  });

export const useAdminRoles = () =>
  useQuery<AdminRole[]>({
    queryKey: ["admin-roles"],
    queryFn: async () => (await apiFetch("/management/roles")) as AdminRole[],
  });

export const useAdminTeams = () =>
  useQuery<AdminTeam[]>({
    queryKey: ["admin-teams"],
    queryFn: async () => (await apiFetch("/management/teams")) as AdminTeam[],
  });

type UpdateTeamPayload = {
  teamId: number;
  name?: string;
  leader_id?: number;
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, ...body }: UpdateTeamPayload) =>
      apiFetch(`/management/teams/${teamId}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
    },
  });
};

export const useAdminApprovers = (enabled = true) =>
  useQuery<ApproverSummary[]>({
    queryKey: ["admin-approvers"],
    enabled,
    queryFn: async () => (await apiFetch("/approvers")) as ApproverSummary[],
  });

type UpdateUserRoles = {
  userId: number;
  roleNames: string[];
};

export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleNames }: UpdateUserRoles) =>
      apiFetch(`/management/users/${userId}/roles`, {
        method: "PUT",
        body: { role_names: roleNames },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["approvers"] });
    },
  });
};

type UpdateUserPanels = {
  userId: number;
  panels: string[];
};

export const useUpdateUserPanels = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, panels }: UpdateUserPanels) =>
      apiFetch(`/management/users/${userId}/panels`, {
        method: "PUT",
        body: { panels },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

type CreateApproverPayload = {
  name: string;
  email: string;
};

export const useCreateApprover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateApproverPayload) =>
      apiFetch("/approvers", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["approvers"] });
    },
  });
};

export const useRemoveApprover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) =>
      apiFetch(`/approvers/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["approvers"] });
    },
  });
};

type UpdateProjectPayload = {
  projectId: number;
  name?: string;
  client?: string | null;
  is_billable?: boolean;
  team_id?: number | null;
};

type UpdateActivityPayload = {
  activityId: number;
  code?: string;
  description?: string | null;
  project_id?: number | null;
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }: UpdateProjectPayload) =>
      apiFetch(`/projects/${projectId}`, { method: "PUT", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: number) => apiFetch(`/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, ...body }: UpdateActivityPayload) =>
      apiFetch(`/activities/${activityId}`, { method: "PUT", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: number) => apiFetch(`/activities/${activityId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
