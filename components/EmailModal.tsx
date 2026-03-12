"use client";

import { useState } from "react";

interface EmailModalProps {
  pdfBase64: string;
  fileName: string;
  onClose: () => void;
}

export default function EmailModal({
  pdfBase64,
  fileName,
  onClose,
}: EmailModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Your Quotation");
  const [message, setMessage] = useState(
    "Please find attached your quotation. Do not hesitate to contact us if you have any questions."
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!to) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message, pdfBase64, fileName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Send Quote via Email
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium text-gray-900">Email sent!</p>
              <p className="text-sm text-gray-500 mt-1">
                Quote delivered to <strong>{to}</strong>
              </p>
              <button onClick={onClose} className="btn-primary mt-6">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">To</label>
                <input
                  className="input"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="label">Subject</label>
                <input
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  className="input"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                <span>📎</span>
                <span>{fileName}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!to || loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "Sending..." : "Send Quote"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
