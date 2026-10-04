"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitMonthEntries } from "@/lib/actions/emissions";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function MonthSubmitClient({
  financialYear,
  draftCount,
}: {
  financialYear: string;
  draftCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await submitMonthEntries(financialYear);
        setSuccess(`Submitted ${res.submittedCount} entries for review.`);
        setTimeout(() => {
          router.push("/site");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Failed to submit reporting period");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Submitted</AlertTitle>
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || draftCount === 0}
        size="sm"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Submit {draftCount} Entries for Review
          </>
        )}
      </Button>
    </div>
  );
}
