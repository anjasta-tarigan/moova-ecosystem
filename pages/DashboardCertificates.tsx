import React, { useEffect, useState } from "react";
import { Award, Calendar, ShieldCheck, Share2 } from "lucide-react";
import Button from "../components/Button";
import { profileApi } from "../services/api/profileApi";

interface Certificate {
  id: string;
  type: string;
  award: string;
  issueDate: string;
  issuedBy: string;
  status: string;
  event?: { title: string };
  recipient?: { fullName: string };
}

const DashboardCertificates: React.FC = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await profileApi.getMyCertificates();
      setCerts(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/#/verify/${id}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Certificates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data is fetched from the server and ready to share.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck size={16} /> Blockchain Verified
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchCertificates}
            className="mt-3 text-sm text-red-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No data available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="h-40 bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Award size={28} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-bold">
                    {cert.type}
                  </p>
                  <p className="text-lg font-bold">{cert.award}</p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                  <Calendar size={14} />{" "}
                  {new Date(cert.issueDate).toLocaleDateString()}
                </p>
                <h3 className="font-bold text-slate-900 text-lg leading-snug mb-1">
                  {cert.event?.title || "Event"}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Issued by {cert.issuedBy}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>
                    Status:{" "}
                    <strong className="text-slate-800">{cert.status}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleCopyLink(cert.id)}
                  >
                    <Share2 size={14} className="mr-1" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardCertificates;
