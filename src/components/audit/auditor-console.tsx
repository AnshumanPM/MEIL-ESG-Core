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
import { Textarea } from "@/components/ui/textarea";
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
import { auditVerifyAction } from "@/lib/actions/emissions";
import {
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface AuditEntryItem {
  id: string;
  siteId: string;
  siteName: string;
  financialYear: string;
  entryDate: string;
  scope: string;
  category: string;
  sourceName: string;
  quantity: string;
  unit: string;
  factorValue: string;
  tco2e: string;
  status: string;
  auditStatus: "NONE" | "VERIFIED" | "FLAGGED";
  auditComment?: string | null;
  document?: {
    id: string;
    originalName: string;
    mimeType: string;
    sha256: string;
    docType: string;
    invoiceNumber?: string | null;
  } | null;
}

export function AuditorConsole({ entries }: { entries: AuditEntryItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const [flagEntryId, setFlagEntryId] = useState<string | null>(null);
  const [flagComment, setFlagComment] = useState("");

  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const siteList = Array.from(new Set(entries.map((e) => e.siteId)));
  const siteNames: Record<string, string> = {};
  entries.forEach((e) => {
    if (e.siteId && e.siteName) siteNames[e.siteId] = e.siteName;
  });

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.siteId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAuditStatus =
      statusFilter === "ALL" || e.auditStatus === statusFilter;

    const matchesSite = siteFilter === "ALL" || e.siteId === siteFilter;

    return matchesSearch && matchesAuditStatus && matchesSite;
  });

  const handleVerify = (id: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        await auditVerifyAction(id, "VERIFIED");
        setActionSuccess("Entry verified.");
      } catch (err: any) {
        setActionError(err.message || "Failed to verify entry");
      }
    });
  };

  const handleFlag = () => {
    if (!flagEntryId) return;

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        await auditVerifyAction(flagEntryId, "FLAGGED", flagComment);
        setFlagEntryId(null);
        setFlagComment("");
        setActionSuccess("Entry flagged.");
      } catch (err: any) {
        setActionError(err.message || "Failed to flag entry");
      }
    });
  };

  const openDoc = async (id: string, name: string) => {
    setViewingDocId(id);
    setDocName(name);
    setDocLoading(true);
    setDocUrl(null);

    try {
      const res = await fetch(`/api/documents/${id}/url`);
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

  return (
    <div className="space-y-4 max-w-6xl">
      {actionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
          <AlertDescription className="text-xs">{actionError}</AlertDescription>
        </Alert>
      )}

      {actionSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Success</AlertTitle>
          <AlertDescription className="text-xs">{actionSuccess}</AlertDescription>
        </Alert>
      )}

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
          <Select value={siteFilter} onValueChange={(val) => val && setSiteFilter(val)}>
            <SelectTrigger className="h-9 min-w-[140px] text-xs">
              <SelectValue>
                {siteFilter === "ALL" ? "All Sites" : siteNames[siteFilter] || siteFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sites</SelectItem>
              {siteList.map((sid) => (
                <SelectItem key={sid} value={sid}>
                  {siteNames[sid] || sid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : statusFilter === "NONE"
                  ? "Pending"
                  : statusFilter === "VERIFIED"
                  ? "Verified"
                  : "Flagged"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="NONE">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Factor</TableHead>
              <TableHead>tCO₂e</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Audit Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-20 text-center text-muted-foreground text-xs"
                >
                  No matching entries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">
                      {item.siteName}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {item.siteId} &bull; {item.financialYear}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-foreground">
                      {item.sourceName}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {item.scope.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {item.factorValue} kg/unit
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {item.tco2e}
                  </TableCell>
                  <TableCell>
                    {item.document ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-6 text-xs gap-1"
                        onClick={() =>
                          openDoc(
                            item.document!.id,
                            item.document!.originalName
                          )
                        }
                      >
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[80px] truncate">
                          {item.document.originalName}
                        </span>
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.auditStatus === "VERIFIED" ? "secondary" : item.auditStatus === "FLAGGED" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {item.auditStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={isPending || item.auditStatus === "VERIFIED"}
                        onClick={() => handleVerify(item.id)}
                        className="h-7 text-xs"
                      >
                        Verify
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={isPending}
                        onClick={() => setFlagEntryId(item.id)}
                        className="h-7 text-xs"
                      >
                        Flag
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!flagEntryId} onOpenChange={() => setFlagEntryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Flag Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide observation or finding for this entry.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Finding observation..."
              rows={3}
              value={flagComment}
              onChange={(e) => setFlagComment(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFlagEntryId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending || !flagComment.trim()}
              onClick={handleFlag}
            >
              Flag Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
