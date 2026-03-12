"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmailModal from "@/components/EmailModal";

export default function PreviewPage() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [templateName, setTemplateName] = useState("quote");

  useEffect(() => {
    const raw = sessionStorage.getItem("pdfData");
    if (!raw) {
      router.push("/");
      return;
    }
    const { pdfBase64: b64, template } = JSON.parse(raw);
    setPdfBase64(b64);
    setTemplateName(template?.name || "quote");

    // Create blob URL for preview
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [router]);

  const handleDownload = () => {
    const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewQuote = () => {
    // Keep the template but clear the PDF data
    sessionStorage.removeItem("pdfData");
    router.push("/create");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/create")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Back to edit
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your quote is ready</h1>
        </div>

        <div className="flex gap-3">
          <button onClick={handleNewQuote} className="btn-secondary">
            New Quote
          </button>
          <button onClick={() => setShowEmail(true)} className="btn-secondary">
            ✉ Send Email
          </button>
          <button onClick={handleDownload} className="btn-primary">
            ↓ Download PDF
          </button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="card overflow-hidden" style={{ height: "75vh" }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Quote PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading preview...
          </div>
        )}
      </div>

      {/* Email modal */}
      {showEmail && (
        <EmailModal
          pdfBase64={pdfBase64}
          fileName={`${templateName.replace(/\s+/g, "-").toLowerCase()}.pdf`}
          onClose={() => setShowEmail(false)}
        />
      )}
    </div>
  );
}
