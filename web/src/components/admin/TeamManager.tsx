import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import type { AdminTeam, AdminUser } from "@/types/admin";

type CreateTeamPayload = {
  name: string;
  leader_id: number;
};

type AddMemberPayload = {
  team_id: number;
  user_id: number;
};

type UpdateTeamPayload = {
  teamId: number;
  leader_id?: number;
};

interface TeamManagerProps {
  teams: AdminTeam[];
  users: AdminUser[];
  onCreateTeam: (payload: CreateTeamPayload) => Promise<void>;
  onAddMember: (payload: AddMemberPayload) => Promise<void>;
  onRemoveMember: (teamId: number, userId: number) => Promise<void>;
  onUpdateTeam: (payload: UpdateTeamPayload) => Promise<void>;
}

const TeamManager = ({ teams, users, onCreateTeam, onAddMember, onRemoveMember, onUpdateTeam }: TeamManagerProps) => {
  const [teamName, setTeamName] = useState("");
  const [leaderId, setLeaderId] = useState<number | "">("");
  const [addMemberConfig, setAddMemberConfig] = useState<{ team_id: number | ""; user_id: number | "" }>({ team_id: "", user_id: "" });
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [updatingTeamId, setUpdatingTeamId] = useState<number | null>(null);

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !leaderId) return;
    setSavingTeam(true);
    try {
      await onCreateTeam({ name: teamName.trim(), leader_id: Number(leaderId) });
      setTeamName("");
      setLeaderId("");
    } finally {
      setSavingTeam(false);
    }
  };

  const handleAddMember = async () => {
    if (!addMemberConfig.team_id || !addMemberConfig.user_id) return;
    setSavingMember(true);
    try {
      await onAddMember({ team_id: Number(addMemberConfig.team_id), user_id: Number(addMemberConfig.user_id) });
      setAddMemberConfig({ team_id: "", user_id: "" });
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-sm font-semibold">Create a team</h3>
            <Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name" />
            <Select value={leaderId === "" ? "" : String(leaderId)} onValueChange={(value) => setLeaderId(value ? Number(value) : "") }>
              <SelectTrigger>
                <SelectValue placeholder="Select leader" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateTeam} disabled={savingTeam}>
              {savingTeam ? "Saving…" : "Create team"}
            </Button>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-sm font-semibold">Add to team</h3>
            <Select
              value={addMemberConfig.team_id === "" ? "" : String(addMemberConfig.team_id)}
              onValueChange={(value) => setAddMemberConfig((prev) => ({ ...prev, team_id: value ? Number(value) : "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={addMemberConfig.user_id === "" ? "" : String(addMemberConfig.user_id)}
              onValueChange={(value) => setAddMemberConfig((prev) => ({ ...prev, user_id: value ? Number(value) : "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember} disabled={savingMember}>
              {savingMember ? "Saving…" : "Add member"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id} className="border">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle>{team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Created {new Date(team.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Leader</span>
                    <Select
                      value={team.leader?.id ? String(team.leader.id) : ""}
                      onValueChange={async (value) => {
                        const leader_id = value ? Number(value) : undefined;
                        if (!leader_id || leader_id === team.leader?.id) return;
                        setUpdatingTeamId(team.id);
                        try {
                          await onUpdateTeam({ teamId: team.id, leader_id });
                        } finally {
                          setUpdatingTeamId(null);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-48">
                        <SelectValue placeholder="Select leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updatingTeamId === team.id && <span className="text-xs text-muted-foreground">Saving…</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <ul className="grid gap-2 md:grid-cols-2">
                    {team.members.map((member) => (
                      <li key={member.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {member.id === team.leader?.id ? (
                          <Badge variant="outline">Leader</Badge>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the user from the team. You can re-add them at any time.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemoveMember(team.id, member.id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManager;
