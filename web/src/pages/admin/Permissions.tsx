import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminApprovers,
  useAdminRoles,
  useAdminTeams,
  useAdminUsers,
  useCreateApprover,
  useRemoveApprover,
  useUpdateTeam,
  useUpdateUserPanels,
  useUpdateUserRoles,
} from "@/api/admin";
import { useActivities, useProjects } from "@/api/queries";
import UserRolesPanel from "@/components/admin/UserRolesPanel";
import TeamManager from "@/components/admin/TeamManager";
import CatalogManager from "@/components/admin/CatalogManager";
import ApproverManager from "@/components/admin/ApproverManager";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

const PermissionsPage = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [removingApproverId, setRemovingApproverId] = useState<number | null>(null);

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: roles = [] } = useAdminRoles();
  const { data: teams = [] } = useAdminTeams();
  const { data: projects = [] } = useProjects();
  const { data: activities = [] } = useActivities();
  const { data: approvers = [] } = useAdminApprovers(true);

  const updateRoles = useUpdateUserRoles();
  const updatePanels = useUpdateUserPanels();
  const createApprover = useCreateApprover();
  const removeApprover = useRemoveApprover();
  const updateTeam = useUpdateTeam();
  const queryClient = useQueryClient();

  const createTeamMutation = useMutation({
    mutationFn: async ({ name, leader_id }: { name: string; leader_id: number }) =>
      apiFetch("/management/teams", { method: "POST", body: { name, leader_id, member_ids: [] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Team created");
    },
    onError: (error: any) => toast.error(error?.message ?? "Unable to create team"),
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ team_id, user_id }: { team_id: number; user_id: number }) =>
      apiFetch(`/management/teams/${team_id}/members`, { method: "POST", body: { user_id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Member added to team");
    },
    onError: (error: any) => toast.error(error?.message ?? "Unable to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) =>
      apiFetch(`/management/teams/${teamId}/members/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Member removed from team");
    },
    onError: (error: any) => toast.error(error?.message ?? "Unable to remove member"),
  });

  const handleSaveUserAccess = async (userId: number, roleNames: string[], panelNames: string[]) => {
    try {
      await updateRoles.mutateAsync({ userId, roleNames });
      await updatePanels.mutateAsync({ userId, panels: panelNames });
      toast.success("Access updated");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update user access");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permissions & Teams</h1>
          <p className="mt-1 text-muted-foreground">
            Manage user roles, panels, teams, and approvers.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Access</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="catalog">Project Catalog</TabsTrigger>
            <TabsTrigger value="approvers">Approvers</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserRolesPanel
              users={users}
              roles={roles}
              panels={["timesheets", "manage-data", "submitted", "permissions"]}
              onSave={handleSaveUserAccess}
              savingUserId={
                updateRoles.isPending ? (updateRoles.variables as any)?.userId ?? null :
                updatePanels.isPending ? (updatePanels.variables as any)?.userId ?? null :
                null
              }
            />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <TeamManager
              teams={teams}
              users={users}
              onCreateTeam={async (payload) => createTeamMutation.mutateAsync(payload)}
              onAddMember={async (payload) => addMemberMutation.mutateAsync(payload)}
              onRemoveMember={async (teamId, userId) => removeMemberMutation.mutateAsync({ teamId, userId })}
              onUpdateTeam={async ({ teamId, leader_id }) => {
                try {
                  await updateTeam.mutateAsync({ teamId, leader_id });
                  toast.success("Team updated");
                } catch (error: any) {
                  toast.error(error?.message ?? "Unable to update team");
                }
              }}
            />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <CatalogManager projects={projects} activities={activities} teams={teams} />
          </TabsContent>

          <TabsContent value="approvers" className="space-y-6">
            <ApproverManager
              approvers={approvers}
              creating={createApprover.isPending}
              removingId={removingApproverId}
              onCreate={async (payload) => {
                try {
                  await createApprover.mutateAsync(payload);
                  toast.success("Approver added");
                } catch (error: any) {
                  toast.error(error?.message ?? "Unable to add approver");
                }
              }}
              onRemove={async (userId) => {
                setRemovingApproverId(userId);
                try {
                  await removeApprover.mutateAsync(userId);
                  toast.success("Approver removed");
                } catch (error: any) {
                  toast.error(error?.message ?? "Unable to remove approver");
                } finally {
                  setRemovingApproverId(null);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PermissionsPage;
