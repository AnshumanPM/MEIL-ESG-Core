import { NextRequest, NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { computeSha256, uploadToR2 } from "@/lib/r2";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthContext();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string) || "OTHER_PROOF";
    const invoiceNumber = (formData.get("invoiceNumber") as string) || null;
    const invoiceDate = (formData.get("invoiceDate") as string) || null;
    const financialYear =
      (formData.get("financialYear") as string) || "2026-2027";

    if (!file) {
      return NextResponse.json(
        { error: "No document file provided" },
        { status: 400 },
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "File size exceeds the 10 MB limit" },
        { status: 400 },
      );
    }

    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Only PDF, JPG, and PNG documents are allowed.",
        },
        { status: 400 },
      );
    }

    const siteId = ctx.site?.id || (formData.get("siteId") as string);
    if (!siteId) {
      return NextResponse.json(
        { error: "No associated project site found for upload" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256 = computeSha256(buffer);

    const existingFile = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.siteId, siteId), eq(documents.sha256, sha256)))
      .limit(1);

    if (existingFile.length > 0) {
      return NextResponse.json(
        {
          error:
            "Duplicate file detected. This document hash has already been uploaded for this site.",
        },
        { status: 409 },
      );
    }

    if (invoiceNumber) {
      const existingInvoice = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.siteId, siteId),
            eq(documents.docType, docType),
            eq(documents.invoiceNumber, invoiceNumber),
          ),
        )
        .limit(1);

      if (existingInvoice.length > 0) {
        return NextResponse.json(
          {
            error: `Invoice number "${invoiceNumber}" for document type "${docType}" is already registered on this site.`,
          },
          { status: 409 },
        );
      }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${siteId}/${financialYear}/${randomUUID()}-${safeName}`;

    await uploadToR2(storageKey, buffer, file.type);

    return NextResponse.json({
      storageKey,
      sha256,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      docType,
      invoiceNumber,
      invoiceDate,
      siteId,
      financialYear,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process document upload" },
      { status: 500 },
    );
  }
}
