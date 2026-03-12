import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuoteDocument } from "@/components/QuoteDocument";
import type { Template, QuoteValues, LineItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      template,
      values,
      lineItems,
      vatRate,
    }: {
      template: Template;
      values: QuoteValues;
      lineItems: LineItem[];
      vatRate: number;
    } = body;

    const pdfBuffer = await renderToBuffer(
      createElement(QuoteDocument, { template, values, lineItems, vatRate })
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quote-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
