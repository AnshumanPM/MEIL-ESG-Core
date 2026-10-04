"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  updateFyConfigAction,
  lockFinancialYearAction,
} from "@/lib/actions/emissions";
import { Lock, Unlock, Loader2 } from "lucide-react";

interface FyConfigItem {
  financialYear: string;
  turnoverInrCr?: string | null;
  assuranceDone: boolean;
  assuranceAgency?: string | null;
  lockedAt?: Date | null;
}

export function PeriodManager({ configs }: { configs: FyConfigItem[] }) {
  const [selectedFy, setSelectedFy] = useState("2026-2027");
  const [isPending, startTransition] = useTransition();

  const currentConfig = configs.find((c) => c.financialYear === selectedFy);

  const [turnover, setTurnover] = useState(
    currentConfig?.turnoverInrCr || "32500.00",
  );
  const [assuranceDone, setAssuranceDone] = useState(
    currentConfig?.assuranceDone || false,
  );
  const [agency, setAgency] = useState(currentConfig?.assuranceAgency || "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLocked = !!currentConfig?.lockedAt;

  const handleFyChange = (fy: string) => {
    setSelectedFy(fy);
    const cfg = configs.find((c) => c.financialYear === fy);
    setTurnover(cfg?.turnoverInrCr || "");
    setAssuranceDone(cfg?.assuranceDone || false);
    setAgency(cfg?.assuranceAgency || "");
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateFyConfigAction(selectedFy, turnover, assuranceDone, agency);
        setSuccess(`Configuration for FY ${selectedFy} saved.`);
      } catch (err: any) {
        setError(err.message || "Failed to update configuration");
      }
    });
  };

  const handleLockPeriod = () => {
    if (
      !confirm(
        `Are you sure you want to LOCK Financial Year ${selectedFy}? All approved entries will be permanently locked.`,
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await lockFinancialYearAction(selectedFy);
        setSuccess(`Financial Year ${selectedFy} is now LOCKED.`);
      } catch (err: any) {
        setError(err.message || "Failed to lock period");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle className="text-xs font-semibold">Success</AlertTitle>
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {configs.map((c) => (
          <Button
            key={c.financialYear}
            variant={selectedFy === c.financialYear ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFyChange(c.financialYear)}
            className="text-xs font-medium"
          >
            FY {c.financialYear}
            {c.lockedAt ? (
              <Lock className="text-muted-foreground ml-1.5 h-3 w-3" />
            ) : (
              <Unlock className="text-muted-foreground ml-1.5 h-3 w-3" />
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-border">
          <form onSubmit={handleSaveConfig}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">
                FY {selectedFy} Financial Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Turnover for BRSR emissions intensity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="turnoverInput">
                  Turnover (in &#8377; Crore)
                </Label>
                <Input
                  id="turnoverInput"
                  type="number"
                  step="0.01"
                  required
                  value={turnover}
                  disabled={isLocked}
                  onChange={(e) => setTurnover(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="assuranceCheck"
                    checked={assuranceDone}
                    disabled={isLocked}
                    onChange={(e) => setAssuranceDone(e.target.checked)}
                    className="border-border h-4 w-4 rounded"
                  />
                  <Label
                    htmlFor="assuranceCheck"
                    className="cursor-pointer text-xs"
                  >
                    Third-party Assurance Completed
                  </Label>
                </div>

                {assuranceDone && (
                  <div className="space-y-1.5">
                    <Label htmlFor="agencyInput">Assurance Agency</Label>
                    <Input
                      id="agencyInput"
                      placeholder="e.g. KPMG India"
                      value={agency}
                      disabled={isLocked}
                      onChange={(e) => setAgency(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button type="submit" size="sm" disabled={isPending || isLocked}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Parameters"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="border-border flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Period Lock</CardTitle>
                <Badge
                  variant={isLocked ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {isLocked ? "LOCKED" : "OPEN"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Seals all approved submissions for the financial year.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 p-4 pt-1 text-xs">
              <p>Locked entries cannot be modified or rejected.</p>
              {currentConfig?.lockedAt && (
                <div className="text-foreground bg-muted/30 rounded border p-2 font-mono text-[11px]">
                  Locked on:{" "}
                  {new Date(currentConfig.lockedAt).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="border-border border-t p-4 pt-0">
            {isLocked ? (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Period Sealed
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleLockPeriod}
                className="w-full text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Locking...
                  </>
                ) : (
                  <>
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    Lock Financial Year {selectedFy}
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
