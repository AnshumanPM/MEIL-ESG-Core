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
import { createSiteAction, updateSiteAction } from "@/lib/actions/emissions";
import { Plus, Edit2, Loader2 } from "lucide-react";

interface SiteItem {
  id: string;
  clerkOrgId: string;
  name: string;
  buId: string;
  buName: string;
  stateCode: string;
  active: boolean;
}

interface BuItem {
  id: string;
  name: string;
}

export function SitesManager({
  sites,
  businessUnits,
}: {
  sites: SiteItem[];
  businessUnits: BuItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);

  const [id, setId] = useState("");
  const [clerkOrgId, setClerkOrgId] = useState("");
  const [name, setName] = useState("");
  const [buId, setBuId] = useState(businessUnits[0]?.id || "");
  const [stateCode, setStateCode] = useState("AP");

  const [editName, setEditName] = useState("");
  const [editBuId, setEditBuId] = useState("");
  const [editStateCode, setEditStateCode] = useState("");
  const [editActive, setEditActive] = useState("true");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await createSiteAction({
          id,
          clerkOrgId,
          name,
          buId,
          stateCode,
        });

        setSuccess(`Site ${name} (${id}) registered.`);
        setOpenCreate(false);
        setId("");
        setClerkOrgId("");
        setName("");
      } catch (err: any) {
        setError(err.message || "Failed to create site");
      }
    });
  };

  const startEdit = (s: SiteItem) => {
    setEditingSite(s);
    setEditName(s.name);
    setEditBuId(s.buId);
    setEditStateCode(s.stateCode);
    setEditActive(s.active ? "true" : "false");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateSiteAction(editingSite.id, {
          name: editName,
          buId: editBuId,
          stateCode: editStateCode,
          active: editActive === "true",
        });

        setSuccess(`Site ${editingSite.id} updated.`);
        setEditingSite(null);
      } catch (err: any) {
        setError(err.message || "Failed to update site");
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
        <div className="text-muted-foreground text-xs">
          {sites.length} project sites
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Project Site
        </Button>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site ID</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Business Unit</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Clerk Org ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  {s.id}
                </TableCell>
                <TableCell className="text-xs font-medium">{s.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {s.buId}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {s.stateCode}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-[11px]">
                  {s.clerkOrgId}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={s.active ? "secondary" : "outline"}
                    className="text-[10px]"
                  >
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(s)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Register Project Site
              </DialogTitle>
              <DialogDescription className="text-xs">
                Link site code to a Clerk Organization ID.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="siteCode">Site Code</Label>
                  <Input
                    id="siteCode"
                    placeholder="PRJ-308"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state">State Code</Label>
                  <Input
                    id="state"
                    placeholder="AP, TS, MH"
                    required
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projName">Project Name</Label>
                <Input
                  id="projName"
                  placeholder="Project Site Description"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgIdInput">Clerk Organization ID</Label>
                <Input
                  id="orgIdInput"
                  placeholder="org_..."
                  required
                  value={clerkOrgId}
                  onChange={(e) => setClerkOrgId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buSelect">Business Unit</Label>
                <Select
                  value={buId}
                  onValueChange={(val) => val && setBuId(val)}
                >
                  <SelectTrigger id="buSelect">
                    <SelectValue>
                      {businessUnits.find((b) => b.id === buId)?.name || buId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.id} &bull; {b.name}
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
                  "Register Site"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingSite}
        onOpenChange={(open) => !open && setEditingSite(null)}
      >
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Site: {editingSite?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update project name, business unit, and operational status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="editSiteName">Project Name</Label>
                <Input
                  id="editSiteName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editSiteBu">Business Unit</Label>
                  <Select
                    value={editBuId}
                    onValueChange={(val) => val && setEditBuId(val)}
                  >
                    <SelectTrigger id="editSiteBu">
                      <SelectValue>
                        {businessUnits.find((b) => b.id === editBuId)?.name ||
                          editBuId}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.id} &bull; {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editSiteState">State Code</Label>
                  <Input
                    id="editSiteState"
                    required
                    value={editStateCode}
                    onChange={(e) => setEditStateCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editSiteActive">Operational Status</Label>
                <Select
                  value={editActive}
                  onValueChange={(val) => val && setEditActive(val)}
                >
                  <SelectTrigger id="editSiteActive">
                    <SelectValue>
                      {editActive === "true" ? "Active" : "Inactive"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingSite(null)}
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
