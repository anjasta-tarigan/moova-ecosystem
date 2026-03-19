import React, { useEffect, useState } from "react";
import { Award, Download, ExternalLink } from "lucide-react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { profileApi } from "../services/api/profileApi";

const JudgeCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const res = await profileApi.getMyCertificates();
        const data = res.data.data || [];
        setCertificates(data.filter((c: any) => c.type === "JUDGE"));
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificates();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-slate-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Judge Credentials
        </h1>
        <p className="text-slate-500 mt-2">
          Download official certificates verifying your contribution to the
          ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                <Award size={32} />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${cert.status === "ACTIVE" || cert.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {cert.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {cert.award}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {cert.issuedBy} • {cert.event?.title || "Event"} •{" "}
              {cert.issueDate
                ? new Date(cert.issueDate).toLocaleDateString()
                : "--"}
            </p>

            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => alert("Coming soon")}
              >
                <Download size={16} className="mr-2" /> PDF
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => window.open(`/#/verify/${cert.id}`, "_blank")}
              >
                <ExternalLink size={16} className="mr-2" /> Verify
              </Button>
            </div>
          </div>
        ))}
      </div>

      {certificates.length === 0 && (
        <div className="flex items-center justify-center min-h-64 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">
            No judge certificates yet. Complete judging assignments to earn
            credentials.
          </p>
        </div>
      )}
    </div>
  );
};

export default JudgeCertificates;
