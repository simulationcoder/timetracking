import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { AdminRole, AdminUser } from "@/types/admin";

interface UserRolesPanelProps {
  users: AdminUser[];
  roles: AdminRole[];
  panels: string[];
  onSave: (userId: number, roleNames: string[], panelNames: string[]) => Promise<void>;
  savingUserId?: number | null;
}

const AVAILABLE_PANELS = ["timesheets", "manage-data", "submitted", "permissions"];

const UserRolesPanel = ({ users, roles, panels, onSave, savingUserId = null }: UserRolesPanelProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUserId(user.id);
    setSelectedRoles(user.roles);
    setSelectedPanels(user.panels);
  };

  const toggleRole = (roleName: string, checked: boolean) => {
    setSelectedRoles((prev) => (checked ? [...prev, roleName] : prev.filter((role) => role !== roleName)));
  };

  const togglePanel = (panelName: string, checked: boolean) => {
    setSelectedPanels((prev) => (checked ? [...prev, panelName] : prev.filter((panel) => panel !== panelName)));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    await onSave(selectedUserId, selectedRoles, selectedPanels);
  };

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>User Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
          <div className="rounded-md border">
            <div className="border-b p-3 text-sm font-semibold">Users</div>
            <ul className="max-h-64 divide-y overflow-y-auto text-sm">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`cursor-pointer px-4 py-3 transition hover:bg-muted/50 ${user.id === selectedUserId ? "bg-muted" : ""}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={user.role === "admin" ? "destructive" : "outline"}>{user.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold">Roles</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedRoles.includes(role.name)}
                      onCheckedChange={(checked) => toggleRole(role.name, Boolean(checked))}
                    />
                    <span className="capitalize">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Panels</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {AVAILABLE_PANELS.map((panel) => (
                  <label key={panel} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedPanels.includes(panel)}
                      onCheckedChange={(checked) => togglePanel(panel, Boolean(checked))}
                      disabled={selectedUser?.role === "admin" && panel === "permissions"}
                    />
                    <span className="capitalize">{panel.replace("-", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!selectedUserId || savingUserId === selectedUserId}>
                {savingUserId === selectedUserId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRolesPanel;
