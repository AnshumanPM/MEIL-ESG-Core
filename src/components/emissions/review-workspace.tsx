"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { reviewSubmissionAction } from "@/lib/actions/emissions";
import {
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ReviewEntry {
  id: string;
  entryDate: string;
  scope: string;
  category: string;
  sourceName: string;
  quantity: string;
  unit: string;
  factorValue: string;
  tco2e: string;
  status: string;
  submitterName?: string | null;
  document: {
    id: string;
    originalName: string;
    mimeType: string;
    sha256: string;
    docType: string;
    invoiceNumber?: string | null;
  } | null;
}

export function ReviewWorkspace({
  siteId,
  siteName,
  period,
  entries,
}: {
  siteId: string;
  siteName: string;
  period: string;
  entries: ReviewEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    entries[0]?.document?.id || null,
  );
  const [selectedDocName, setSelectedDocName] = useState<string>(
    entries[0]?.document?.originalName || "",
  );
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDoc = async (id: string, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
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

  const handleApprove = () => {
    setError(null);
    setSuccess(null);
    const ids = entries.map((e) => e.id);

    startTransition(async () => {
      try {
        await reviewSubmissionAction(ids, "APPROVE");
        setSuccess("Submission approved.");
        setTimeout(() => {
          router.push("/dashboard/review");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Approval failed");
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setError(null);
    setSuccess(null);
    const ids = entries.map((e) => e.id);

    startTransition(async () => {
      try {
        await reviewSubmissionAction(ids, "REJECT", rejectReason);
        setRejectDialogOpen(false);
        setSuccess("Submission returned for correction.");
        setTimeout(() => {
          router.push("/dashboard/review");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Rejection failed");
      }
    });
  };

  const totalTco2e = entries
    .reduce((acc, curr) => acc + parseFloat(curr.tco2e), 0)
    .toFixed(3);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Done</AlertTitle>
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card border-border flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
        <div className="text-xs font-medium">
          {entries.length} entries &bull; {totalTco2e} tCO₂e
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="xs"
            disabled={isPending}
            onClick={() => setRejectDialogOpen(true)}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>

          <Button size="xs" disabled={isPending} onClick={handleApprove}>
            {isPending ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Approve Submission
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="bg-card overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>tCO₂e</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer ${
                      item.document?.id === selectedDocId
                        ? "bg-secondary/50 font-medium"
                        : ""
                    }`}
                    onClick={() => {
                      if (item.document) {
                        loadDoc(item.document.id, item.document.originalName);
                      }
                    }}
                  >
                    <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {item.entryDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {item.scope.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.sourceName}</TableCell>
                    <TableCell className="text-xs">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {item.tco2e}
                    </TableCell>
                    <TableCell>
                      {item.submitterName ? (
                        <span className="text-foreground text-[11px] font-medium">
                          {item.submitterName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.document ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-6 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDoc(
                              item.document!.id,
                              item.document!.originalName,
                            );
                          }}
                        >
                          <FileText className="h-3 w-3" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">
                          None
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="border-border flex h-full flex-col">
            <CardHeader className="border-b p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate text-xs font-bold">
                  {selectedDocName || "Document Viewer"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center p-3">
              {docLoading ? (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="text-muted-foreground mb-2 h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground text-xs">
                    Loading...
                  </span>
                </div>
              ) : docUrl ? (
                <div className="flex w-full flex-1 flex-col items-center">
                  {selectedDocName.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={docUrl}
                      className="h-90 w-full rounded border"
                      title={selectedDocName}
                    />
                  ) : (
                    <img
                      src={docUrl}
                      alt={selectedDocName}
                      className="max-h-90 rounded border object-contain"
                    />
                  )}
                  <div className="mt-2">
                    <Button asChild size="xs" variant="outline">
                      <a href={docUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Open Original
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-12 text-center text-xs">
                  Select an entry to view proof.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Reject Submission
            </DialogTitle>
            <DialogDescription className="text-xs">
              State the reason for returning this submission to the site
              manager.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Enter reason..."
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
