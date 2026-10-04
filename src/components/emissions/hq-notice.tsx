import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HqNotice({
  orgId,
  isHq,
  orgRole,
}: {
  orgId?: string | null;
  isHq?: boolean;
  orgRole?: string | null;
}) {
  return (
    <Card className="max-w-xl">
      <CardHeader className="space-y-1 p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {isHq ? "HQ Org" : "Unmapped Org"}
          </Badge>
          <span className="text-muted-foreground font-mono text-[11px]">
            {orgId}
          </span>
        </div>
        <CardTitle className="text-base font-semibold">
          {isHq ? "HQ Context" : "Site Unlinked"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isHq
            ? "Switch to a project site organization to view site entries, or use HQ modules."
            : "This organization is not mapped to a project site."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between gap-2 border-t p-4 pt-3">
        <OrganizationSwitcher hidePersonal />
        <div className="flex gap-2">
          <Button asChild size="xs" variant="outline">
            <Link href="/dashboard/review">Review</Link>
          </Button>
          <Button asChild size="xs" variant="outline">
            <Link href="/dashboard/admin/sites">Sites</Link>
          </Button>
          <Button asChild size="xs">
            <Link href="/dashboard/reports/brsr">BRSR</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
