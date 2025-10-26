import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApproverSummary } from "@/types/timesheet";

interface ApproverManagerProps {
  approvers: ApproverSummary[];
  onCreate: (payload: { name: string; email: string }) => Promise<void>;
  onRemove: (userId: number) => Promise<void>;
  creating?: boolean;
  removingId?: number | null;
}

const ApproverManager = ({ approvers, onCreate, onRemove, creating = false, removingId = null }: ApproverManagerProps) => {
  const [form, setForm] = useState({ name: "", email: "" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    await onCreate({ name: form.name.trim(), email: form.email.trim() });
    setForm({ name: "", email: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Approver</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="approver-name">Name</Label>
              <Input
                id="approver-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Maya Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approver-email">Email</Label>
              <Input
                id="approver-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="maya.manager@example.com"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={creating || !form.name.trim() || !form.email.trim()}>
                {creating ? "Saving…" : "Add approver"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Approvers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approvers yet.</p>
          ) : (
            <ul className="divide-y">
              {approvers.map((approver) => (
                <li key={approver.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{approver.name}</p>
                    <p className="text-xs text-muted-foreground">{approver.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{approver.roles.join(", ")}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(approver.id)}
                      disabled={removingId === approver.id}
                    >
                      {removingId === approver.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApproverManager;
