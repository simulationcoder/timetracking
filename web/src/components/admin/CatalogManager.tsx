import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Activity, Project } from "@/types/timesheet";
import type { AdminTeam } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";
import {
  useDeleteActivity,
  useDeleteProject,
  useUpdateActivity,
  useUpdateProject,
} from "@/api/admin";

interface CatalogManagerProps {
  projects: Project[];
  activities: Activity[];
  teams: AdminTeam[];
}

type ProjectFormState = {
  name: string;
  client: string;
  is_billable: boolean;
  team_id: string;
};

type ActivityFormState = {
  code: string;
  description: string;
  project_id: string;
};

const emptyProject = (): ProjectFormState => ({ name: "", client: "", is_billable: true, team_id: "" });
const emptyActivity = (): ActivityFormState => ({ code: "", description: "", project_id: "" });

const CatalogManager = ({ projects, activities, teams }: CatalogManagerProps) => {
  const queryClient = useQueryClient();
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProject());
  const [activityForm, setActivityForm] = useState<ActivityFormState>(emptyActivity());
  const [projectFilter, setProjectFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [editProjectForm, setEditProjectForm] = useState<ProjectFormState>(emptyProject());
  const [editActivityId, setEditActivityId] = useState<number | null>(null);
  const [editActivityForm, setEditActivityForm] = useState<ActivityFormState>(emptyActivity());

  const createProject = useMutation({
    mutationFn: async () =>
      apiFetch("/projects", {
        method: "POST",
        body: {
          name: projectForm.name,
          client: projectForm.client || null,
          is_billable: projectForm.is_billable,
          team_id: projectForm.team_id ? Number(projectForm.team_id) : null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project added");
      setProjectForm(emptyProject());
    },
    onError: (error: any) => toast.error(error?.message ?? "Unable to add project"),
  });

  const createActivity = useMutation({
    mutationFn: async () =>
      apiFetch("/activities", {
        method: "POST",
        body: {
          code: activityForm.code,
          description: activityForm.description || null,
          project_id: Number(activityForm.project_id),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity added");
      setActivityForm(emptyActivity());
    },
    onError: (error: any) => toast.error(error?.message ?? "Unable to add activity"),
  });

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: String(team.id), label: team.name })),
    [teams],
  );

  const filteredProjects = useMemo(() => {
    const query = projectFilter.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query) || (project.client ?? "").toLowerCase().includes(query),
    );
  }, [projects, projectFilter]);

  const filteredActivities = useMemo(() => {
    const query = activityFilter.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter((activity) =>
      activity.code.toLowerCase().includes(query) || (activity.description ?? "").toLowerCase().includes(query),
    );
  }, [activities, activityFilter]);

  const projectDialogOpen = editProjectId !== null;
  const activityDialogOpen = editActivityId !== null;

  const handleProjectUpdate = async () => {
    if (editProjectId === null) return;
    try {
      await updateProject.mutateAsync({
        projectId: editProjectId,
        name: editProjectForm.name,
        client: editProjectForm.client.trim() ? editProjectForm.client : null,
        is_billable: editProjectForm.is_billable,
        team_id: editProjectForm.team_id ? Number(editProjectForm.team_id) : null,
      });
      toast.success("Project updated");
      setEditProjectId(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update project");
    }
  };

  const handleActivityUpdate = async () => {
    if (editActivityId === null) return;
    try {
      await updateActivityMutation.mutateAsync({
        activityId: editActivityId,
        code: editActivityForm.code,
        description: editActivityForm.description.trim() ? editActivityForm.description : null,
        project_id: editActivityForm.project_id ? Number(editActivityForm.project_id) : null,
      });
      toast.success("Activity updated");
      setEditActivityId(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update activity");
    }
  };

  const confirmDeleteProject = async (projectId: number) => {
    try {
      await deleteProject.mutateAsync(projectId);
      toast.success("Project removed");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to remove project");
    }
  };

  const confirmDeleteActivity = async (activityId: number) => {
    try {
      await deleteActivityMutation.mutateAsync(activityId);
      toast.success("Activity removed");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to remove activity");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-client">Client</Label>
              <Input
                id="project-client"
                value={projectForm.client}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, client: event.target.value }))}
                placeholder="Optional client name"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="project-billable"
                checked={projectForm.is_billable}
                onCheckedChange={(value) => setProjectForm((prev) => ({ ...prev, is_billable: value }))}
              />
              <Label htmlFor="project-billable">Billable</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-team">Team</Label>
              <Select
                value={projectForm.team_id}
                onValueChange={(value) => setProjectForm((prev) => ({ ...prev, team_id: value }))}
              >
                <SelectTrigger id="project-team">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamOptions.map((team) => (
                    <SelectItem key={team.value} value={team.value}>
                      {team.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => createProject.mutate()} disabled={!projectForm.name.trim() || createProject.isPending}>
            {createProject.isPending ? "Saving…" : "Add project"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity-code">Code</Label>
              <Input
                id="activity-code"
                value={activityForm.code}
                onChange={(event) => setActivityForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="e.g. DEV"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-project">Project</Label>
              <Select
                value={activityForm.project_id}
                onValueChange={(value) => setActivityForm((prev) => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger id="activity-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-description">Description</Label>
            <Textarea
              id="activity-description"
              rows={3}
              value={activityForm.description}
              onChange={(event) => setActivityForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <Button
            onClick={() => createActivity.mutate()}
            disabled={!activityForm.code.trim() || !activityForm.project_id || createActivity.isPending}
          >
            {createActivity.isPending ? "Saving…" : "Add activity"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search projects…"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.client ?? "—"}</TableCell>
                    <TableCell>{project.is_billable ? "Yes" : "No"}</TableCell>
                    <TableCell>{project.team?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditProjectId(project.id);
                          setEditProjectForm({
                            name: project.name,
                            client: project.client ?? "",
                            is_billable: project.is_billable,
                            team_id: project.team?.id ? String(project.team.id) : "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Hours already logged to this project will remain but the project will be removed from selection lists.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => confirmDeleteProject(project.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search activities…"
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value)}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.code}</TableCell>
                    <TableCell>{activity.description ?? "—"}</TableCell>
                    <TableCell>
                      {projects.find((project) => project.id === activity.project_id)?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditActivityId(activity.id);
                          setEditActivityForm({
                            code: activity.code,
                            description: activity.description ?? "",
                            project_id: activity.project_id ? String(activity.project_id) : "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {activity.code}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Hours already logged will remain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => confirmDeleteActivity(activity.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {projectDialogOpen && (
        <Dialog
          open={projectDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditProjectId(null);
              setEditProjectForm(emptyProject());
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details and team assignment.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Name</Label>
                <Input
                  id="edit-project-name"
                  value={editProjectForm.name}
                  onChange={(event) => setEditProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-client">Client</Label>
                <Input
                  id="edit-project-client"
                  value={editProjectForm.client}
                  onChange={(event) => setEditProjectForm((prev) => ({ ...prev, client: event.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-project-billable"
                  checked={editProjectForm.is_billable}
                  onCheckedChange={(value) => setEditProjectForm((prev) => ({ ...prev, is_billable: value }))}
                />
                <Label htmlFor="edit-project-billable">Billable</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-team">Team</Label>
                <Select
                  value={editProjectForm.team_id}
                  onValueChange={(value) => setEditProjectForm((prev) => ({ ...prev, team_id: value }))}
                >
                  <SelectTrigger id="edit-project-team">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamOptions.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditProjectId(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleProjectUpdate}
                disabled={updateProject.isPending || !editProjectForm.name.trim()}
              >
                {updateProject.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activityDialogOpen && (
        <Dialog
          open={activityDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditActivityId(null);
              setEditActivityForm(emptyActivity());
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
              <DialogDescription>Update activity code, description, and project.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-activity-code">Code</Label>
                <Input
                  id="edit-activity-code"
                  value={editActivityForm.code}
                  onChange={(event) => setEditActivityForm((prev) => ({ ...prev, code: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-activity-project">Project</Label>
                <Select
                  value={editActivityForm.project_id}
                  onValueChange={(value) => setEditActivityForm((prev) => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger id="edit-activity-project">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-activity-description">Description</Label>
                <Textarea
                  id="edit-activity-description"
                  rows={3}
                  value={editActivityForm.description}
                  onChange={(event) => setEditActivityForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditActivityId(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleActivityUpdate}
                disabled={updateActivityMutation.isPending || !editActivityForm.code.trim()}
              >
                {updateActivityMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CatalogManager;
