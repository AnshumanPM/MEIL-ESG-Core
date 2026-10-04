import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/db";
import { documents, sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPresignedR2Url } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getAuthContext();

    const docResult = await db
      .select({
        id: documents.id,
        storageKey: documents.storageKey,
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        siteId: documents.siteId,
      })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docResult[0];

    const isCorporateOrAuditor =
      ctx.orgRole === "org:corporate_admin" ||
      ctx.orgRole === "corporate_admin" ||
      ctx.orgRole === "org:external_auditor" ||
      ctx.orgRole === "external_auditor";

    if (!isCorporateOrAuditor) {
      if (ctx.site) {
        if (ctx.site.id !== doc.siteId) {
          return NextResponse.json(
            { error: "Access denied to document for another site" },
            { status: 403 }
          );
        }
      } else {
        const siteRow = await db
          .select({ buId: sites.buId })
          .from(sites)
          .where(eq(sites.id, doc.siteId))
          .limit(1);

        if (
          siteRow.length === 0 ||
          !ctx.buIds.includes(siteRow[0].buId)
        ) {
          return NextResponse.json(
            { error: "Access denied to document for this Business Unit" },
            { status: 403 }
          );
        }
      }
    }

    const url = await getPresignedR2Url(doc.storageKey, 300);

    return NextResponse.json({
      url,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate document link" },
      { status: 500 }
    );
  }
}
