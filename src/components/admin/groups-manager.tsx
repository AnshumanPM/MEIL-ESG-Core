"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createGroupAction, updateGroupAction } from "@/lib/actions/org";
import { Plus, Edit2, Loader2, Globe } from "lucide-react";

interface GroupItem {
  id: string;
  name: string;
  companyCount?: number;
}

export function GroupsManager({ groups }: { groups: GroupItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await createGroupAction({ id, name });
        setSuccess(`Group ${name} (${id}) registered.`);
        setOpenCreate(false);
        setId("");
        setName("");
      } catch (err: any) {
        setError(err.message || "Failed to create group");
      }
    });
  };

  const startEdit = (g: GroupItem) => {
    setEditingGroup(g);
    setEditName(g.name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateGroupAction(editingGroup.id, { name: editName });
        setSuccess(`Group ${editingGroup.id} updated.`);
        setEditingGroup(null);
      } catch (err: any) {
        setError(err.message || "Failed to update group");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Globe className="h-3.5 w-3.5" />
          <span>{groups.length} enterprise conglomerate groups</span>
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Group
        </Button>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Code</TableHead>
              <TableHead>Group Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  {g.id}
                </TableCell>
                <TableCell className="text-xs font-medium">{g.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  Enterprise Group
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(g)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-6 text-center text-xs"
                >
                  No groups configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Register Group
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add an enterprise apex group to the corporate hierarchy.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="groupId">Group Code / ID</Label>
                <Input
                  id="groupId"
                  placeholder="GRP-MEIL"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="MEIL Group"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
      >
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Group: {editingGroup?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update conglomerate group identification details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="editGroupName">Group Name</Label>
                <Input
                  id="editGroupName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingGroup(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
