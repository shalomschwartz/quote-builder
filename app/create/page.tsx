"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Template, QuoteValues, LineItem } from "@/lib/types";

const EMPTY_LINE_ITEM = (): LineItem => ({
  id: `item_${Date.now()}_${Math.random()}`,
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export default function CreatePage() {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<QuoteValues>({});
  const [lineItems, setLineItems] = useState<LineItem[]>([EMPTY_LINE_ITEM()]);
  const [vatRate, setVatRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("template");
    if (!raw) {
      router.push("/");
      return;
    }
    const tpl: Template = JSON.parse(raw);
    setTemplate(tpl);

    // Pre-fill with original text as placeholder values
    const initial: QuoteValues = {};
    tpl.variables.forEach((v) => {
      if (!v.skipped) {
        initial[v.key] = "";
      }
    });
    setValues(initial);
  }, [router]);

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const updateLineItem = (id: string, changes: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, EMPTY_LINE_ITEM()]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const handleGenerate = async () => {
    if (!template) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, values, lineItems, vatRate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });

      sessionStorage.setItem(
        "pdfData",
        JSON.stringify({
          pdfBase64,
          template,
          values,
          lineItems,
          vatRate,
        })
      );

      router.push("/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  const activeVariables = template.variables.filter((v) => !v.skipped);

  const renderInput = (variable: (typeof activeVariables)[0]) => {
    const commonProps = {
      className: "input",
      value: values[variable.key] || "",
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setValue(variable.key, e.target.value),
      placeholder: variable.placeholder || variable.originalText || variable.label,
      required: variable.required,
    };

    if (variable.type === "textarea") {
      return <textarea {...commonProps} rows={3} />;
    }

    if (variable.type === "date") {
      return <input {...commonProps} type="date" />;
    }

    if (variable.type === "email") {
      return <input {...commonProps} type="email" />;
    }

    if (variable.type === "phone") {
      return <input {...commonProps} type="tel" />;
    }

    if (variable.type === "number" || variable.type === "currency") {
      return <input {...commonProps} type="number" step="0.01" />;
    }

    return <input {...commonProps} type="text" />;
  };

  // Group variables by section
  const sections = ["header", "client", "items", "totals", "terms", "footer", "custom"];
  const grouped = sections.reduce<Record<string, typeof activeVariables>>(
    (acc, section) => {
      const vars = activeVariables.filter((v) => v.section === section);
      if (vars.length) acc[section] = vars;
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/setup")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to setup
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Fill in your quote</h1>
        <p className="text-gray-500 text-sm">
          Template: <span className="font-medium">{template.name}</span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Variable sections */}
        {Object.entries(grouped).map(([section, vars]) => (
          <div key={section} className="card p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 capitalize">
              {section}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {vars.map((variable) => (
                <div
                  key={variable.id}
                  className={variable.type === "textarea" ? "col-span-2" : ""}
                >
                  <label className="label">
                    {variable.label}
                    {variable.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderInput(variable)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Line items */}
        {template.documentStructure.hasItemsTable && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Line Items
            </h2>

            <div className="space-y-3 mb-4">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Unit Price</div>
                <div className="col-span-1"></div>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      className="input"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, { description: e.target.value })
                      }
                      placeholder="Product or service description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addLineItem}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add line item
            </button>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">VAT</span>
                  <input
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                    type="number"
                    min="0"
                    max="100"
                    value={vatRate}
                    onChange={(e) =>
                      setVatRate(parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <span className="font-medium">{vatAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-blue-600">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? "Generating PDF..." : "Generate PDF →"}
        </button>
      </div>
    </div>
  );
}
