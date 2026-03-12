import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert at analyzing business quotation documents.
Extract all variable fields from the document and return them as structured JSON.

There are two kinds of variables:

1. USER-FILLED variables — fields the user must fill in each time:
   - Customer name, address, contact details
   - Quote number, date, expiry date
   - Product/service descriptions, quantities, unit prices
   - Payment terms, delivery dates, notes

2. CALCULATED variables — fields that can be computed automatically from line items:
   - Subtotal (sum of all line item totals) → formula: "subtotal"
   - VAT / tax amount (subtotal × VAT rate) → formula: "vat_amount"
   - Total / grand total (subtotal + VAT) → formula: "total"
   - Discount amount → formula: "discount_amount"
   Mark these with type: "calculated" and include the formula field.
   Do NOT ask the user to fill these in manually.

Also detect the document's primary brand color (the most prominent non-black, non-white color used for headings, borders, or highlights). Return it as a hex code.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "variables": [
    {
      "id": "unique_snake_case_id",
      "key": "variable_key",
      "label": "Human readable label",
      "type": "text|number|date|currency|email|phone|textarea|calculated",
      "formula": "subtotal|vat_amount|total|discount_amount|null",
      "required": true,
      "skipped": false,
      "placeholder": "example value or hint",
      "originalText": "the actual text/value found in the document",
      "section": "header|client|items|totals|terms|footer"
    }
  ],
  "documentStructure": {
    "hasHeader": true,
    "hasItemsTable": true,
    "hasTotals": true,
    "hasFooter": false,
    "sections": ["header", "client", "items", "totals", "terms"]
  },
  "primaryColor": "#2563eb"
}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;

    let textContent = "";
    let isImage = false;
    let imageBase64 = "";
    let imageMediaType = "";

    if (fileType === "application/pdf") {
      // Dynamically require pdf-parse to avoid test file import issues in Next.js
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const parsed = await pdfParse(buffer);
      textContent = parsed.text;
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    } else if (fileType.startsWith("image/")) {
      isImage = true;
      imageBase64 = buffer.toString("base64");
      imageMediaType = fileType;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, Word doc, or image." },
        { status: 400 }
      );
    }

    let message;

    if (isImage) {
      message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageMediaType as
                    | "image/jpeg"
                    | "image/png"
                    | "image/gif"
                    | "image/webp",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: "Analyze this quotation document and extract all variable fields. Return only the JSON object.",
              },
            ],
          },
        ],
      });
    } else {
      message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this quotation document and extract all variable fields. Return only the JSON object.\n\nDocument content:\n${textContent}`,
          },
        ],
      });
    }

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response as JSON");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // Clean up: remove "null" formula strings
    if (extractedData.variables) {
      extractedData.variables = extractedData.variables.map((v: Record<string, unknown>) => ({
        ...v,
        formula: v.formula === "null" || !v.formula ? undefined : v.formula,
      }));
    }

    return NextResponse.json({
      ...extractedData,
      primaryColor: extractedData.primaryColor || "#2563eb",
      rawText: textContent,
    });
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract variables",
      },
      { status: 500 }
    );
  }
}
