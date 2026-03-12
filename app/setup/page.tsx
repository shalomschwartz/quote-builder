"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ExtractResult, Variable, Template, VariableType } from "@/lib/types";

const TYPE_OPTIONS: { value: VariableType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "calculated", label: "Auto-calculated" },
];

const SECTION_COLORS: Record<string, string> = {
  header: "bg-blue-100 text-blue-700",
  client: "bg-purple-100 text-purple-700",
  items: "bg-amber-100 text-amber-700",
  totals: "bg-green-100 text-green-700",
  terms: "bg-gray-100 text-gray-700",
  footer: "bg-pink-100 text-pink-700",
  custom: "bg-indigo-100 text-indigo-700",
};

const FORMULA_LABELS: Record<string, string> = {
  subtotal: "Sum of line items",
  vat_amount: "VAT rate × subtotal",
  total: "Subtotal + VAT",
  discount_amount: "Discount",
  line_count: "Number of items",
};

export default function SetupPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [templateName, setTemplateName] = useState("My Quote Template");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [logoBase64, setLogoBase64] = useState<string | undefined>();
  const [documentStructure, setDocumentStructure] = useState<ExtractResult["documentStructure"]>({
    hasHeader: true,
    hasItemsTable: true,
    hasTotals: true,
    hasFooter: false,
    sections: [],
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("extractResult");
    if (!raw) {
      router.push("/");
      return;
    }
    const result: ExtractResult & { primaryColor?: string } = JSON.parse(raw);
    setVariables(result.variables);
    setDocumentStructure(result.documentStructure);
    if (result.primaryColor) setPrimaryColor(result.primaryColor);
  }, [router]);

  const updateVariable = (id: string, changes: Partial<Variable>) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...changes } : v))
    );
  };

  const removeVariable = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const addVariable = () => {
    const newVar: Variable = {
      id: `custom_${Date.now()}`,
      key: `custom_field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
      skipped: false,
      placeholder: "",
      originalText: "",
      section: "custom",
    };
    setVariables((prev) => [...prev, newVar]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buildTemplate = (): Template => ({
    id: `tpl_${Date.now()}`,
    name: templateName,
    variables,
    documentStructure,
    primaryColor,
    logoBase64,
    createdAt: new Date().toISOString(),
  });

  const handleContinue = () => {
    sessionStorage.setItem("template", JSON.stringify(buildTemplate()));
    router.push("/create");
  };

  const handleSaveTemplate = () => {
    const template = buildTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeVars = variables.filter((v) => !v.skipped);
  const skippedVars = variables.filter((v) => v.skipped);
  const calculatedVars = variables.filter((v) => v.type === "calculated");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Label your variables
        </h1>
        <p className="text-gray-500">
          {activeVars.length} variables found — {calculatedVars.length} auto-calculated.
        </p>
      </div>

      {/* Template name */}
      <div className="card p-4 mb-4">
        <label className="label">Template name</label>
        <input
          className="input"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Standard Quote Template"
        />
      </div>

      {/* Branding */}
      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Branding</h2>
        <div className="flex gap-6 items-start">
          {/* Logo */}
          <div className="flex-1">
            <label className="label">Company logo</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {logoBase64 ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoBase64} alt="Logo" className="h-12 object-contain border rounded p-1" />
                <button
                  onClick={() => setLogoBase64(undefined)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors w-full text-left"
              >
                + Upload logo (PNG, JPG, SVG)
              </button>
            )}
          </div>

          {/* Primary color */}
          <div>
            <label className="label">Brand color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                className="input w-28 font-mono text-sm"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#2563eb"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Auto-detected from your document</p>
          </div>
        </div>
      </div>

      {/* Variables list */}
      <div className="space-y-3 mb-6">
        {variables.map((variable) => (
          <div
            key={variable.id}
            className={`card p-4 ${variable.skipped ? "opacity-50" : ""}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`badge mt-0.5 shrink-0 ${SECTION_COLORS[variable.section] || SECTION_COLORS.custom}`}
              >
                {variable.section}
              </span>

              <div className="flex-1 grid grid-cols-2 gap-3">
                {/* Label */}
                <div>
                  <label className="label">Label</label>
                  <input
                    className="input"
                    value={variable.label}
                    onChange={(e) =>
                      updateVariable(variable.id, { label: e.target.value })
                    }
                    disabled={variable.skipped}
                    placeholder="e.g. Client Name"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="label">Type</label>
                  {variable.type === "calculated" ? (
                    <div className="input bg-green-50 text-green-700 flex items-center gap-2">
                      <span>⚡</span>
                      <span className="text-sm">
                        {variable.formula ? FORMULA_LABELS[variable.formula] : "Auto-calculated"}
                      </span>
                    </div>
                  ) : (
                    <select
                      className="input"
                      value={variable.type}
                      onChange={(e) =>
                        updateVariable(variable.id, {
                          type: e.target.value as VariableType,
                        })
                      }
                      disabled={variable.skipped}
                    >
                      {TYPE_OPTIONS.filter(o => o.value !== "calculated").map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {variable.originalText && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">
                      Found in document:{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {variable.originalText}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {variable.type !== "calculated" && (
                  <button
                    onClick={() =>
                      updateVariable(variable.id, { skipped: !variable.skipped })
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      variable.skipped
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    {variable.skipped ? "Include" : "Skip"}
                  </button>
                )}
                <button
                  onClick={() => removeVariable(variable.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addVariable}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors mb-8"
      >
        + Add custom variable
      </button>

      <div className="card p-4 mb-6 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span>
            <span className="font-semibold text-gray-900">{activeVars.length}</span>{" "}
            <span className="text-gray-500">active</span>
          </span>
          <span>
            <span className="font-semibold text-green-600">{calculatedVars.length}</span>{" "}
            <span className="text-gray-500">auto-calculated</span>
          </span>
          <span>
            <span className="font-semibold text-gray-900">{skippedVars.length}</span>{" "}
            <span className="text-gray-500">skipped</span>
          </span>
        </div>
        <button onClick={handleSaveTemplate} className="btn-secondary text-sm">
          Download Template (.json)
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleContinue} className="btn-primary flex-1">
          Continue to Fill Quote →
        </button>
      </div>
    </div>
  );
}
