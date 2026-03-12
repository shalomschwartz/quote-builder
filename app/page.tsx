"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import type { ExtractResult } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError("");
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
  });

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to extract variables");
      }

      const data: ExtractResult = await res.json();
      sessionStorage.setItem("extractResult", JSON.stringify(data));
      router.push("/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const template = JSON.parse(ev.target?.result as string);
          sessionStorage.setItem("template", JSON.stringify(template));
          router.push("/create");
        } catch {
          setError("Invalid template file");
        }
      };
      reader.readAsText(f);
    };
    input.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Generate professional quotes
          <br />
          <span className="text-blue-600">in minutes</span>
        </h1>
        <p className="text-gray-500 text-lg">
          Upload your existing quote. We&apos;ll extract every variable, let you
          label them, and generate a clean PDF ready to send.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { step: "1", label: "Upload your quote template" },
          { step: "2", label: "Label each variable field" },
          { step: "3", label: "Generate & email the PDF" },
        ].map(({ step, label }) => (
          <div key={step} className="card p-4 text-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
              {step}
            </div>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div className="card p-6 mb-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : file
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <>
              <div className="text-3xl mb-2">✓</div>
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-sm text-green-600 mt-1">
                {(file.size / 1024).toFixed(0)} KB — click or drop to replace
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="font-medium text-gray-700">
                {isDragActive
                  ? "Drop it here"
                  : "Drop your quote here, or click to browse"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                PDF, Word (.docx), or image — max 10MB
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleExtract}
            disabled={!file || loading}
            className="btn-primary flex-1"
          >
            {loading ? "Analyzing with AI..." : "Extract Variables →"}
          </button>
          <button onClick={handleLoadTemplate} className="btn-secondary">
            Load Template
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        No data is stored on our servers. Templates are saved locally in your
        browser.
      </p>
    </div>
  );
}
