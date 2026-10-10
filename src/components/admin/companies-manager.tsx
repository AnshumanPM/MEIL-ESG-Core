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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCompanyAction, updateCompanyAction } from "@/lib/actions/org";
import { Plus, Edit2, Loader2, Building } from "lucide-react";

interface CompanyItem {
  id: string;
  name: string;
  groupId: string;
  groupName?: string;
}

interface GroupItem {
  id: string;
  name: string;
}

export function CompaniesManager({
  companies,
  groups,
}: {
  companies: CompanyItem[];
  groups: GroupItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(
    null,
  );

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id || "");

  const [editName, setEditName] = useState("");
  const [editGroupId, setEditGroupId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await createCompanyAction({ id, name, groupId });
        setSuccess(`Company ${name} (${id}) registered.`);
        setOpenCreate(false);
        setId("");
        setName("");
      } catch (err: any) {
        setError(err.message || "Failed to create company");
      }
    });
  };

  const startEdit = (c: CompanyItem) => {
    setEditingCompany(c);
    setEditName(c.name);
    setEditGroupId(c.groupId);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateCompanyAction(editingCompany.id, {
          name: editName,
          groupId: editGroupId,
        });
        setSuccess(`Company ${editingCompany.id} updated.`);
        setEditingCompany(null);
      } catch (err: any) {
        setError(err.message || "Failed to update company");
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
          <Building className="h-3.5 w-3.5" />
          <span>{companies.length} corporate legal entities</span>
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Company
        </Button>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Code</TableHead>
              <TableHead>Legal Entity Name</TableHead>
              <TableHead>Parent Group</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  {c.id}
                </TableCell>
                <TableCell className="text-xs font-medium">{c.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[11px]">
                    {c.groupName || c.groupId}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(c)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-6 text-center text-xs"
                >
                  No companies configured.
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
                Register Company
              </DialogTitle>
              <DialogDescription className="text-xs">
                Link a company to its enterprise apex group.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="companyId">Company Code / ID</Label>
                <Input
                  id="companyId"
                  placeholder="CO-INFRA"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Legal Name</Label>
                <Input
                  id="companyName"
                  placeholder="Megha Engineering & Infrastructures Ltd"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="groupSelect">Parent Enterprise Group</Label>
                <Select
                  value={groupId}
                  onValueChange={(val) => val && setGroupId(val)}
                >
                  <SelectTrigger id="groupSelect">
                    <SelectValue>
                      {groups.find((g) => g.id === groupId)?.name || groupId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.id} &bull; {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  "Register Company"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
      >
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Company: {editingCompany?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update company name and parent group assignment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="editCompanyName">Company Legal Name</Label>
                <Input
                  id="editCompanyName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCompanyGroup">
                  Parent Enterprise Group
                </Label>
                <Select
                  value={editGroupId}
                  onValueChange={(val) => val && setEditGroupId(val)}
                >
                  <SelectTrigger id="editCompanyGroup">
                    <SelectValue>
                      {groups.find((g) => g.id === editGroupId)?.name ||
                        editGroupId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.id} &bull; {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCompany(null)}
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
