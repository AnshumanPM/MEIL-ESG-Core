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
  createEmissionFactorAction,
  updateEmissionFactorAction,
} from "@/lib/actions/emissions";
import { Plus, Edit2, Loader2 } from "lucide-react";

interface FactorItem {
  id: string;
  scope: "SCOPE_1" | "SCOPE_2" | "SCOPE_3";
  category: string;
  unit: string;
  kgCo2ePerUnit: string;
  authority: string;
  version: string;
  validFrom: string;
  validTo?: string | null;
}

export function FactorsManager({ factors }: { factors: FactorItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingFactor, setEditingFactor] = useState<FactorItem | null>(null);

  const [scope, setScope] = useState<"SCOPE_1" | "SCOPE_2" | "SCOPE_3">("SCOPE_1");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [kgCo2ePerUnit, setKgCo2ePerUnit] = useState("");
  const [authority, setAuthority] = useState("");
  const [version, setVersion] = useState("2026-v1");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validTo, setValidTo] = useState("");

  const [editUnit, setEditUnit] = useState("");
  const [editFactorVal, setEditFactorVal] = useState("");
  const [editAuthority, setEditAuthority] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editValidFrom, setEditValidFrom] = useState("");
  const [editValidTo, setEditValidTo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await createEmissionFactorAction({
          scope,
          category: category.toUpperCase().replace(/\s+/g, "_"),
          unit: unit.toUpperCase(),
          kgCo2ePerUnit,
          authority,
          version,
          validFrom,
          validTo: validTo || null,
        });

        setSuccess(`Factor ${category} created.`);
        setOpenCreate(false);
        setCategory("");
        setUnit("");
        setKgCo2ePerUnit("");
        setAuthority("");
      } catch (err: any) {
        setError(err.message || "Failed to create factor");
      }
    });
  };

  const startEdit = (f: FactorItem) => {
    setEditingFactor(f);
    setEditUnit(f.unit);
    setEditFactorVal(f.kgCo2ePerUnit);
    setEditAuthority(f.authority);
    setEditVersion(f.version);
    setEditValidFrom(f.validFrom);
    setEditValidTo(f.validTo || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFactor) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateEmissionFactorAction(editingFactor.id, {
          unit: editUnit.toUpperCase(),
          kgCo2ePerUnit: editFactorVal,
          authority: editAuthority,
          version: editVersion,
          validFrom: editValidFrom,
          validTo: editValidTo || null,
        });

        setSuccess(`Factor ${editingFactor.category} updated.`);
        setEditingFactor(null);
      } catch (err: any) {
        setError(err.message || "Failed to update factor");
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

      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {factors.length} registered emission factors
        </div>
        <Button
          size="sm"
          onClick={() => setOpenCreate(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Factor Version
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>kg CO₂e / Unit</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid To</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factors.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {f.scope.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-xs">
                  {f.category}
                </TableCell>
                <TableCell className="font-mono text-xs">{f.unit}</TableCell>
                <TableCell className="font-mono font-semibold text-xs">
                  {f.kgCo2ePerUnit}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{f.authority}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {f.version}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{f.validFrom}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {f.validTo || "Active"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(f)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
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
                Add Emission Factor
              </DialogTitle>
              <DialogDescription className="text-xs">
                Publish a statutory emission factor version.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="scopeSelect">Scope</Label>
                  <Select
                    value={scope}
                    onValueChange={(val: any) => val && setScope(val)}
                  >
                    <SelectTrigger id="scopeSelect">
                      <SelectValue>
                        {scope === "SCOPE_1" ? "Scope 1 (Direct)" : scope === "SCOPE_2" ? "Scope 2 (Electricity)" : "Scope 3 (Value Chain)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCOPE_1">Scope 1 (Direct)</SelectItem>
                      <SelectItem value="SCOPE_2">Scope 2 (Electricity)</SelectItem>
                      <SelectItem value="SCOPE_3">Scope 3 (Value Chain)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="catName">Category</Label>
                  <Input
                    id="catName"
                    placeholder="e.g. BIODIESEL"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="unitName">Unit</Label>
                  <Input
                    id="unitName"
                    placeholder="LITRE, KWH, TONNE"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factorVal">kg CO₂e per Unit</Label>
                  <Input
                    id="factorVal"
                    type="number"
                    step="0.000001"
                    placeholder="2.450000"
                    required
                    value={kgCo2ePerUnit}
                    onChange={(e) => setKgCo2ePerUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="authName">Authority / Benchmark</Label>
                <Input
                  id="authName"
                  placeholder="CEA CO2 Baseline / MoEFCC"
                  required
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="verName">Version</Label>
                  <Input
                    id="verName"
                    placeholder="2026-v1"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vFrom">Valid From</Label>
                  <Input
                    id="vFrom"
                    type="date"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
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
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Factor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFactor} onOpenChange={(open) => !open && setEditingFactor(null)}>
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Factor: {editingFactor?.category}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update emission factor values and validity window.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editUnit">Unit</Label>
                  <Input
                    id="editUnit"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editVal">kg CO₂e per Unit</Label>
                  <Input
                    id="editVal"
                    type="number"
                    step="0.000001"
                    required
                    value={editFactorVal}
                    onChange={(e) => setEditFactorVal(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editAuth">Authority</Label>
                <Input
                  id="editAuth"
                  required
                  value={editAuthority}
                  onChange={(e) => setEditAuthority(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editVer">Version</Label>
                  <Input
                    id="editVer"
                    required
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editFrom">Valid From</Label>
                  <Input
                    id="editFrom"
                    type="date"
                    required
                    value={editValidFrom}
                    onChange={(e) => setEditValidFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editTo">Valid To</Label>
                  <Input
                    id="editTo"
                    type="date"
                    value={editValidTo}
                    onChange={(e) => setEditValidTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingFactor(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
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
