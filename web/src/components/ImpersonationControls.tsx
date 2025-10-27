import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdminUsers } from "@/api/admin";
import { useAuth } from "@/context/AuthContext.jsx";
import type { AdminUser } from "@/types/admin";
import { Loader2, UserCircle2 } from "lucide-react";

const formatRole = (role: string) =>
  role
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const sortByName = (a: AdminUser, b: AdminUser) => a.name.localeCompare(b.name);

const ImpersonationControls = () => {
  const {
    user,
    impersonator,
    isImpersonating,
    impersonate,
    stopImpersonation,
  } = useAuth();
  const adminContextRole = (impersonator?.role ?? user?.role ?? "").toLowerCase();
  const isAdminContext = adminContextRole === "admin";

  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data: users = [], isLoading, isFetching } = useAdminUsers({
    enabled: open && isAdminContext,
  });

  const actingAdminId = impersonator?.id ?? user?.id ?? null;

  const impersonatableUsers = useMemo(
    () =>
      users
        .filter((candidate) => candidate.id !== actingAdminId)
        .sort(sortByName),
    [users, actingAdminId],
  );

  const groupedUsers = useMemo(() => {
    const groups = new Map<string, AdminUser[]>();
    impersonatableUsers.forEach((candidate) => {
      const key = candidate.role || "other";
      const current = groups.get(key) ?? [];
      current.push(candidate);
      groups.set(key, current);
    });
    return Array.from(groups.entries())
      .map(([role, members]) => ({
        role,
        members: members.sort(sortByName),
      }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [impersonatableUsers]);

  const handleImpersonate = async (target: AdminUser) => {
    try {
      setPendingId(target.id);
      await impersonate(target.id);
      toast.success(`Now impersonating ${target.name}`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to impersonate that user");
    } finally {
      setPendingId(null);
    }
  };

  const handleStop = async () => {
    try {
      setPendingId(impersonator?.id ?? null);
      await stopImpersonation();
      toast.success("Returned to administrator session");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to stop impersonation");
    } finally {
      setPendingId(null);
    }
  };

  if (!isAdminContext && !isImpersonating) {
    return null;
  }

  const busy = isLoading || isFetching;

  return (
    <>
      {isImpersonating ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStop}
              disabled={pendingId !== null}
              className="gap-2"
            >
              {pendingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCircle2 className="h-4 w-4" />}
              Exit impersonation
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Acting as {user?.name}. Original session: {impersonator?.name ?? "administrator"}.
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <UserCircle2 className="h-4 w-4" />
          Impersonate user
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for a user…" />
        <CommandList>
          <CommandEmpty>
            {busy ? "Loading users…" : "No matching users"}
          </CommandEmpty>
          {groupedUsers.map(({ role, members }) => (
            <CommandGroup key={role} heading={formatRole(role)}>
              {members.map((candidate) => {
                const isCandidatePending = pendingId === candidate.id;
                return (
                  <CommandItem
                    key={candidate.id}
                    value={`${candidate.name} ${candidate.email}`}
                    onSelect={() => handleImpersonate(candidate)}
                    disabled={pendingId !== null}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{candidate.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {candidate.email}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {isCandidatePending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : null}
                        {candidate.roles.map((roleName) => (
                          <Badge key={roleName} variant="outline" className="capitalize">
                            {roleName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default ImpersonationControls;
