"use client";

import { useEffect, useState } from "react";
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

export default function SetupPage() {
  const router = useRouter();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [templateName, setTemplateName] = useState("My Quote Template");
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
    const result: ExtractResult = JSON.parse(raw);
    setVariables(result.variables);
    setDocumentStructure(result.documentStructure);
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

  const handleContinue = () => {
    const template: Template = {
      id: `tpl_${Date.now()}`,
      name: templateName,
      variables,
      documentStructure,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem("template", JSON.stringify(template));
    router.push("/create");
  };

  const handleSaveTemplate = () => {
    const template: Template = {
      id: `tpl_${Date.now()}`,
      name: templateName,
      variables,
      documentStructure,
      createdAt: new Date().toISOString(),
    };
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
          {activeVars.length} variables found. Give each one a clear label so
          your team knows what to fill in.
        </p>
      </div>

      {/* Template name */}
      <div className="card p-4 mb-6">
        <label className="label">Template name</label>
        <input
          className="input"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Standard Quote Template"
        />
      </div>

      {/* Variables list */}
      <div className="space-y-3 mb-6">
        {variables.map((variable) => (
          <div
            key={variable.id}
            className={`card p-4 ${variable.skipped ? "opacity-50" : ""}`}
          >
            <div className="flex items-start gap-3">
              {/* Section badge */}
              <span
                className={`badge mt-0.5 ${SECTION_COLORS[variable.section] || SECTION_COLORS.custom}`}
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
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Original text */}
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

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
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

      {/* Add variable */}
      <button
        onClick={addVariable}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors mb-8"
      >
        + Add custom variable
      </button>

      {/* Summary */}
      <div className="card p-4 mb-6 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span>
            <span className="font-semibold text-gray-900">{activeVars.length}</span>{" "}
            <span className="text-gray-500">active</span>
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

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleContinue} className="btn-primary flex-1">
          Continue to Fill Quote →
        </button>
      </div>
    </div>
  );
}
