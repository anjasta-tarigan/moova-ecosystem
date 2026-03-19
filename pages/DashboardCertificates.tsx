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

  useEffect(() => {
    const load = async () => {
      setError(null);
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
    load();
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
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-slate-500">Loading certificates...</div>
      ) : certs.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 bg-slate-50">
          No certificates yet.
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
