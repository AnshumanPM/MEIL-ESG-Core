"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  updateDraftEntry,
  submitSingleEntryAction,
} from "@/lib/actions/emissions";
import {
  FileText,
  ExternalLink,
  Edit2,
  Search,
  Loader2,
  Send,
  Upload,
} from "lucide-react";

interface EntryItem {
  id: string;
  siteId?: string;
  financialYear: string;
  entryDate: string;
  scope: "SCOPE_1" | "SCOPE_2" | "SCOPE_3";
  category: string;
  sourceName: string;
  quantity: string;
  unit: string;
  factorId: string;
  factorValue: string;
  tco2e: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";
  rejectReason?: string | null;
  auditStatus: "NONE" | "VERIFIED" | "FLAGGED";
  auditComment?: string | null;
  createdBy: string;
  document?: {
    id: string;
    originalName: string;
    mimeType: string;
    sha256: string;
    docType: string;
    invoiceNumber?: string | null;
  } | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  FUEL_INVOICE: "Fuel Invoice",
  EB_BILL: "Electricity Bill",
  WEIGHBRIDGE_SLIP: "Weighbridge Slip",
  GAS_INVOICE: "Gas Cylinder Slip",
  PURCHASE_INVOICE: "Material Invoice",
  TRAVEL_TICKET: "Travel Ticket",
  LOGISTICS_RECEIPT: "Freight Slip",
  OTHER_PROOF: "Other Proof",
};

export function EntriesTable({
  entries,
  currentUserId,
  siteId,
  isManager,
}: {
  entries: EntryItem[];
  currentUserId: string;
  siteId?: string;
  isManager: boolean;
}) {
  const router = useRouter();
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docName, setDocName] = useState("");

  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null);
  const [editSourceName, setEditSourceName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDocType, setEditDocType] = useState("FUEL_INVOICE");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, startUpdateTransition] = useTransition();

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  const filtered = localEntries.filter((item) => {
    const matchesSearch =
      item.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.document?.invoiceNumber &&
        item.document.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesScope =
      scopeFilter === "ALL" || item.scope === scopeFilter;

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesScope && matchesStatus;
  });

  const handleOpenDoc = async (docId: string, name: string) => {
    setViewingDocId(docId);
    setDocName(name);
    setDocLoading(true);
    setDocUrl(null);

    try {
      const res = await fetch(`/api/documents/${docId}/url`);
      const data = await res.json();
      if (res.ok && data.url) {
        setDocUrl(data.url);
      }
    } catch {
      setDocUrl(null);
    } finally {
      setDocLoading(false);
    }
  };

  const handleStartEdit = (entry: EntryItem) => {
    setEditingEntry(entry);
    setEditSourceName(entry.sourceName);
    setEditQuantity(entry.quantity);
    setEditDate(entry.entryDate);
    setEditDocType(entry.document?.docType || "FUEL_INVOICE");
    setEditInvoiceNumber(entry.document?.invoiceNumber || "");
    setEditFile(null);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    startUpdateTransition(async () => {
      setEditError(null);
      let uploadResult = null;

      if (editFile) {
        const formData = new FormData();
        formData.append("file", editFile);
        formData.append("siteId", editingEntry.siteId || siteId || "");
        formData.append("docType", editDocType);
        if (editInvoiceNumber) {
          formData.append("invoiceNumber", editInvoiceNumber);
        }
        formData.append("invoiceDate", editDate);

        const upRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await upRes.json();
        if (!upRes.ok) {
          setEditError(uploadData.error || "File upload failed");
          return;
        }
        uploadResult = uploadData;
      }

      try {
        await updateDraftEntry(editingEntry.id, {
          entryDate: editDate,
          sourceName: editSourceName,
          quantity: editQuantity,
          unit: editingEntry.unit,
          factorId: editingEntry.factorId,
          docType: editDocType,
          invoiceNumber: editInvoiceNumber,
          document: uploadResult,
        });
        setLocalEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id
              ? {
                  ...e,
                  sourceName: editSourceName,
                  quantity: editQuantity,
                  entryDate: editDate,
                  document: uploadResult
                    ? {
                        id: uploadResult.id || e.document?.id || "doc-new",
                        originalName: uploadResult.originalName,
                        mimeType: uploadResult.mimeType,
                        sha256: uploadResult.sha256,
                        docType: editDocType,
                        invoiceNumber: editInvoiceNumber,
                      }
                    : e.document
                    ? {
                        ...e.document,
                        docType: editDocType,
                        invoiceNumber: editInvoiceNumber,
                      }
                    : null,
                }
              : e
          )
        );
        setEditingEntry(null);
        router.refresh();
      } catch (err: any) {
        setEditError(err.message || "Failed to update entry");
      }
    });
  };

  const handleSubmitSingle = (entryId: string) => {
    setSubmittingId(entryId);
    startSubmitTransition(async () => {
      try {
        await submitSingleEntryAction(entryId);
        setLocalEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, status: "SUBMITTED" } : e
          )
        );
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Failed to submit entry");
      } finally {
        setSubmittingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={scopeFilter} onValueChange={(val) => val && setScopeFilter(val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue>
                {scopeFilter === "ALL"
                  ? "All Scopes"
                  : scopeFilter === "SCOPE_1"
                  ? "Scope 1"
                  : scopeFilter === "SCOPE_2"
                  ? "Scope 2"
                  : "Scope 3"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Scopes</SelectItem>
              <SelectItem value="SCOPE_1">Scope 1</SelectItem>
              <SelectItem value="SCOPE_2">Scope 2</SelectItem>
              <SelectItem value="SCOPE_3">Scope 3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : statusFilter === "DRAFT"
                  ? "Draft"
                  : statusFilter === "SUBMITTED"
                  ? "Submitted"
                  : statusFilter === "APPROVED"
                  ? "Approved"
                  : statusFilter === "REJECTED"
                  ? "Rejected"
                  : "Locked"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="LOCKED">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>tCO₂e</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Audit</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-xs text-muted-foreground"
                >
                  No emission records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const canEdit =
                  item.status === "DRAFT" || item.status === "REJECTED";

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {item.entryDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {item.scope.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">
                        {item.sourceName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.category.replace(/_/g, " ")}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="font-semibold text-xs">
                      {item.tco2e}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "APPROVED" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.document ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            handleOpenDoc(
                              item.document!.id,
                              item.document!.originalName
                            )
                          }
                        >
                          <FileText className="h-3 w-3" />
                          <span className="max-w-[90px] truncate">
                            {item.document.originalName}
                          </span>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {item.auditStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            className="h-7 text-xs"
                            onClick={() => handleStartEdit(item)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            className="h-7 text-xs"
                            disabled={isSubmitting && submittingId === item.id}
                            onClick={() => handleSubmitSingle(item.id)}
                          >
                            {isSubmitting && submittingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                Submit
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {item.status}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!viewingDocId}
        onOpenChange={(open) => !open && setViewingDocId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold truncate">
              {docName}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {docLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : docUrl ? (
              <div className="rounded border bg-muted/20 p-2 flex flex-col items-center">
                {docName.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={docUrl}
                    className="w-full h-[400px] border-0 rounded"
                    title={docName}
                  />
                ) : (
                  <img
                    src={docUrl}
                    alt={docName}
                    className="max-h-[400px] object-contain rounded"
                  />
                )}
                <div className="mt-2">
                  <Button asChild size="xs" variant="outline">
                    <a href={docUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Original
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Document unavailable.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Edit Entry &amp; Evidence
            </DialogTitle>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-3 py-2 text-xs">
              {editError && (
                <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {editError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="editSource">Source Name</Label>
                <Input
                  id="editSource"
                  value={editSourceName}
                  onChange={(e) => setEditSourceName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editQty">
                    Quantity ({editingEntry.unit})
                  </Label>
                  <Input
                    id="editQty"
                    type="number"
                    step="any"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editDate">Date</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-2 space-y-3">
                <div className="font-semibold text-foreground text-xs">
                  Document Details
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="editDocType">Document Type</Label>
                    <Select
                      value={editDocType}
                      onValueChange={(val) => val && setEditDocType(val)}
                    >
                      <SelectTrigger id="editDocType">
                        <SelectValue>
                          {DOC_TYPE_LABELS[editDocType] || editDocType}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUEL_INVOICE">Fuel Invoice</SelectItem>
                        <SelectItem value="EB_BILL">Electricity Bill</SelectItem>
                        <SelectItem value="WEIGHBRIDGE_SLIP">Weighbridge Slip</SelectItem>
                        <SelectItem value="GAS_INVOICE">Gas Cylinder Slip</SelectItem>
                        <SelectItem value="PURCHASE_INVOICE">Material Invoice</SelectItem>
                        <SelectItem value="TRAVEL_TICKET">Travel Ticket</SelectItem>
                        <SelectItem value="LOGISTICS_RECEIPT">Freight Slip</SelectItem>
                        <SelectItem value="OTHER_PROOF">Other Proof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editInvoiceNum">Invoice Number</Label>
                    <Input
                      id="editInvoiceNum"
                      placeholder="INV-..."
                      value={editInvoiceNumber}
                      onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editFile">
                    Replace Document File
                  </Label>
                  {editingEntry.document && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      Current: {editingEntry.document.originalName}
                    </div>
                  )}
                  <Input
                    id="editFile"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="text-xs"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingEntry(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isUpdating}
              onClick={handleSaveEdit}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
