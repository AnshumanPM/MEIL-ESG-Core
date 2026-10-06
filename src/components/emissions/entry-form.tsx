"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmissionEntry } from "@/lib/actions/emissions";
import {
  FileUp,
  FileCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Factor {
  id: string;
  scope: "SCOPE_1" | "SCOPE_2" | "SCOPE_3";
  category: string;
  unit: string;
  kgCo2ePerUnit: string;
  authority: string;
  version: string;
}

export function EntryForm({
  factors,
  siteId,
  siteName,
}: {
  factors: Factor[];
  siteId: string;
  siteName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [scope, setScope] = useState<"SCOPE_1" | "SCOPE_2" | "SCOPE_3">(
    "SCOPE_1",
  );
  const [selectedFactorId, setSelectedFactorId] = useState<string>("");
  const [sourceName, setSourceName] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [quantity, setQuantity] = useState("");
  const [financialYear, setFinancialYear] = useState("2026-2027");

  const [docType, setDocType] = useState("FUEL_INVOICE");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [file, setFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableFactors = factors.filter((f) => f.scope === scope);

  const currentFactor =
    factors.find((f) => f.id === selectedFactorId) ||
    availableFactors[0] ||
    null;

  const currentFactorId =
    selectedFactorId || (currentFactor ? currentFactor.id : "");

  const qtyNum = parseFloat(quantity) || 0;
  const factorNum = currentFactor ? parseFloat(currentFactor.kgCo2ePerUnit) : 0;
  const liveTco2e = ((qtyNum * factorNum) / 1000).toFixed(4);

  const handleScopeChange = (val: "SCOPE_1" | "SCOPE_2" | "SCOPE_3") => {
    setScope(val);
    const matching = factors.filter((f) => f.scope === val);
    if (matching.length > 0) {
      setSelectedFactorId(matching[0].id);
      if (val === "SCOPE_1") setDocType("FUEL_INVOICE");
      else if (val === "SCOPE_2") setDocType("EB_BILL");
      else setDocType("PURCHASE_INVOICE");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file) {
      setErrorMessage("Proof document is required.");
      return;
    }

    if (!currentFactor) {
      setErrorMessage("Select a valid category.");
      return;
    }

    if (qtyNum <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }

    setUploadProgress(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("siteId", siteId);
      uploadData.append("financialYear", financialYear);
      uploadData.append("docType", docType);
      if (invoiceNumber) uploadData.append("invoiceNumber", invoiceNumber);
      if (invoiceDate) uploadData.append("invoiceDate", invoiceDate);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadJson.error || "File upload failed");
      }

      startTransition(async () => {
        try {
          await createEmissionEntry({
            financialYear,
            entryDate,
            scope,
            category: currentFactor.category,
            sourceName,
            quantity,
            unit: currentFactor.unit,
            factorId: currentFactor.id,
            document: {
              storageKey: uploadJson.storageKey,
              originalName: uploadJson.originalName,
              mimeType: uploadJson.mimeType,
              sizeBytes: uploadJson.sizeBytes,
              sha256: uploadJson.sha256,
              docType: uploadJson.docType,
              invoiceNumber: uploadJson.invoiceNumber,
              invoiceDate: uploadJson.invoiceDate,
            },
          });

          setSuccessMessage("Entry saved successfully.");
          setTimeout(() => {
            router.push("/dashboard/site/entries");
          }, 1000);
        } catch (err: any) {
          setErrorMessage(err.message || "Failed to create emission entry");
        } finally {
          setUploadProgress(false);
        }
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Upload process failed");
      setUploadProgress(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
          <AlertDescription className="text-xs">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Saved</AlertTitle>
          <AlertDescription className="text-xs">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">
                Activity Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="scope">Scope</Label>
                  <Select
                    value={scope}
                    onValueChange={(val: any) => val && handleScopeChange(val)}
                  >
                    <SelectTrigger id="scope">
                      <SelectValue>
                        {scope === "SCOPE_1"
                          ? "Scope 1 (Direct)"
                          : scope === "SCOPE_2"
                            ? "Scope 2 (Electricity)"
                            : "Scope 3 (Value Chain)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCOPE_1">Scope 1 (Direct)</SelectItem>
                      <SelectItem value="SCOPE_2">
                        Scope 2 (Electricity)
                      </SelectItem>
                      <SelectItem value="SCOPE_3">
                        Scope 3 (Value Chain)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={currentFactorId}
                    onValueChange={(val) => val && setSelectedFactorId(val)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue>
                        {currentFactor
                          ? `${currentFactor.category.replace(/_/g, " ")} (${currentFactor.unit})`
                          : "Select category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableFactors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.category.replace(/_/g, " ")} ({f.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entryDate">Date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sourceName">Source</Label>
                  <Input
                    id="sourceName"
                    placeholder="e.g. DG Set 4"
                    required
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity">
                    Quantity ({currentFactor?.unit || "Unit"})
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="0.00"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">
                Proof Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="docType">Evidence Type</Label>
                  <Select
                    value={docType}
                    onValueChange={(val) => val && setDocType(val)}
                  >
                    <SelectTrigger id="docType">
                      <SelectValue>
                        {docType === "FUEL_INVOICE"
                          ? "Fuel Invoice"
                          : docType === "EB_BILL"
                            ? "Electricity Bill"
                            : docType === "WEIGHBRIDGE_SLIP"
                              ? "Weighbridge Slip"
                              : docType === "GAS_INVOICE"
                                ? "Gas Cylinder Slip"
                                : docType === "PURCHASE_INVOICE"
                                  ? "Material Invoice"
                                  : docType === "TRAVEL_TICKET"
                                    ? "Travel Ticket"
                                    : docType === "LOGISTICS_RECEIPT"
                                      ? "Freight Slip"
                                      : "Other Proof"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FUEL_INVOICE">Fuel Invoice</SelectItem>
                      <SelectItem value="EB_BILL">Electricity Bill</SelectItem>
                      <SelectItem value="WEIGHBRIDGE_SLIP">
                        Weighbridge Slip
                      </SelectItem>
                      <SelectItem value="GAS_INVOICE">
                        Gas Cylinder Slip
                      </SelectItem>
                      <SelectItem value="PURCHASE_INVOICE">
                        Material Invoice
                      </SelectItem>
                      <SelectItem value="TRAVEL_TICKET">
                        Travel Ticket
                      </SelectItem>
                      <SelectItem value="LOGISTICS_RECEIPT">
                        Freight Slip
                      </SelectItem>
                      <SelectItem value="OTHER_PROOF">Other Proof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="INV-..."
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="file">File (PDF, JPG, PNG &le; 10MB)</Label>
                <div className="border-border rounded-md border border-dashed p-4 text-center">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    required
                    className="mx-auto max-w-xs text-xs"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  {file && (
                    <div className="text-foreground mt-2 flex items-center justify-center gap-1.5 text-xs font-medium">
                      <FileCheck className="text-muted-foreground h-3.5 w-3.5" />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div className="bg-muted/40 space-y-1.5 rounded-md p-3 text-xs">
                <div className="text-muted-foreground flex justify-between">
                  <span>Quantity:</span>
                  <span className="text-foreground font-medium">
                    {qtyNum} {currentFactor?.unit}
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>Factor:</span>
                  <span className="text-foreground font-medium">
                    {currentFactor?.kgCo2ePerUnit} kg/unit
                  </span>
                </div>
                <div className="border-border flex items-baseline justify-between border-t pt-1.5">
                  <span className="text-foreground font-semibold">tCO₂e:</span>
                  <span className="text-foreground text-xl font-bold">
                    {liveTco2e}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                type="submit"
                disabled={uploadProgress || isPending}
                className="w-full"
              >
                {uploadProgress || isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
