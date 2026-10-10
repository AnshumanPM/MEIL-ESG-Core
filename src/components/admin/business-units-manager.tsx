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
import {
  createBusinessUnitAction,
  updateBusinessUnitAction,
} from "@/lib/actions/org";
import { Plus, Edit2, Loader2, FolderTree } from "lucide-react";

interface BusinessUnitItem {
  id: string;
  name: string;
  companyId: string | null;
  companyName?: string | null;
  groupName?: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

export function BusinessUnitsManager({
  businessUnits,
  companies,
}: {
  businessUnits: BusinessUnitItem[];
  companies: CompanyOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingBu, setEditingBu] = useState<BusinessUnitItem | null>(null);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");

  const [editName, setEditName] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await createBusinessUnitAction({ id, name, companyId });
        setSuccess(`Business Unit ${name} (${id}) registered.`);
        setOpenCreate(false);
        setId("");
        setName("");
      } catch (err: any) {
        setError(err.message || "Failed to create business unit");
      }
    });
  };

  const startEdit = (bu: BusinessUnitItem) => {
    setEditingBu(bu);
    setEditName(bu.name);
    setEditCompanyId(bu.companyId || companies[0]?.id || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBu) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateBusinessUnitAction(editingBu.id, {
          name: editName,
          companyId: editCompanyId,
        });
        setSuccess(`Business Unit ${editingBu.id} updated.`);
        setEditingBu(null);
      } catch (err: any) {
        setError(err.message || "Failed to update business unit");
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
          <FolderTree className="h-3.5 w-3.5" />
          <span>{businessUnits.length} business units</span>
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Business Unit
        </Button>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BU Code</TableHead>
              <TableHead>Business Unit Name</TableHead>
              <TableHead>Parent Company</TableHead>
              <TableHead>Enterprise Group</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businessUnits.map((bu) => (
              <TableRow key={bu.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  {bu.id}
                </TableCell>
                <TableCell className="text-xs font-medium">{bu.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[11px]">
                    {bu.companyName || bu.companyId || "Unassigned"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {bu.groupName || "MEIL Group"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(bu)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {businessUnits.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-6 text-center text-xs"
                >
                  No business units configured.
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
                Register Business Unit
              </DialogTitle>
              <DialogDescription className="text-xs">
                Link a business unit to its parent operating company.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="buId">Business Unit Code / ID</Label>
                <Input
                  id="buId"
                  placeholder="BU-SOLAR"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buName">Business Unit Name</Label>
                <Input
                  id="buName"
                  placeholder="Solar & Green Hydrogen"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companySelect">Parent Company</Label>
                <Select
                  value={companyId}
                  onValueChange={(val) => val && setCompanyId(val)}
                >
                  <SelectTrigger id="companySelect">
                    <SelectValue>
                      {companies.find((c) => c.id === companyId)?.name ||
                        companyId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} &bull; {c.name}
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
                  "Register Business Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingBu}
        onOpenChange={(open) => !open && setEditingBu(null)}
      >
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Business Unit: {editingBu?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update business unit details and parent company affiliation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="editBuName">Business Unit Name</Label>
                <Input
                  id="editBuName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editBuCompany">Parent Company</Label>
                <Select
                  value={editCompanyId}
                  onValueChange={(val) => val && setEditCompanyId(val)}
                >
                  <SelectTrigger id="editBuCompany">
                    <SelectValue>
                      {companies.find((c) => c.id === editCompanyId)?.name ||
                        editCompanyId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} &bull; {c.name}
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
                onClick={() => setEditingBu(null)}
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
