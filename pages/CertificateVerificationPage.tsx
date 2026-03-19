import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertOctagon,
  Search,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import Button from "../components/Button";
import { certificatesApi } from "../services/api/certificatesApi";
import { formatDate } from "../lib/utils";
import LoadingSpinner from "../components/LoadingSpinner";

type CertificateResult = {
  id: string;
  recipient: { fullName: string };
  event: { title: string };
  type: string;
  award: string;
  issueDate: string;
  status: string;
  issuedBy: string;
  revocationReason?: string | null;
};

const CertificateVerificationPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certId, setCertId] = useState(id || "");
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      handleVerify(id);
    }
  }, [id]);

  const handleVerify = async (searchId: string) => {
    if (!searchId) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      const res = await certificatesApi.verify(searchId.trim());
      setResult(res.data?.data);
    } catch (err: any) {
      setResult(null);
      if (err?.response?.status !== 404) {
        setError("Unable to verify certificate. Please try again.");
      }
    } finally {
      setSearched(true);
      setIsVerifying(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(certId);
    // Update URL without reload
    window.history.pushState({}, "", `#/verify/${certId}`);
  };

  const isValid = result?.status === "VALID";
  const statusLabel = isValid ? "Certificate is Valid" : "Certificate Revoked";
  const issueDateLabel = result?.issueDate ? formatDate(result.issueDate) : "-";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center font-bold text-white">
              G
            </div>
            <span className="font-bold text-slate-900">GIVA Verify</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Certificate Verification
          </h1>
          <p className="text-slate-500">
            Verify the authenticity of a GIVA certificate by entering the unique
            Certificate ID found on the document.
          </p>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 mb-10"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g., CERT-2024-8821)"
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-slate-900 placeholder:text-slate-400 font-mono"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={isVerifying || !certId.trim()}
            className="min-w-[120px]"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </form>

        {/* Results */}
        {searched && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && !isVerifying && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                {error}
              </div>
            )}
            {isVerifying ? (
              <div className="flex items-center justify-center p-10 bg-white rounded-2xl border border-slate-200">
                <LoadingSpinner size="md" />
              </div>
            ) : result ? (
              <div
                className={`bg-white rounded-2xl border-2 overflow-hidden ${isValid ? "border-emerald-100" : "border-red-100"}`}
              >
                {/* Status Banner */}
                <div
                  className={`p-6 flex items-center justify-center gap-3 ${isValid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                >
                  {isValid ? (
                    <>
                      <CheckCircle size={28} />
                      <span className="text-xl font-bold">{statusLabel}</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon size={28} />
                      <span className="text-xl font-bold">{statusLabel}</span>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="p-8 space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Recipient
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      {result.recipient?.fullName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Event
                      </span>
                      <p className="font-medium text-slate-700 mt-1">
                        {result.event?.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Award / Role
                      </span>
                      <p className="font-medium text-slate-700 mt-1">
                        {result.award}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Issue Date
                      </span>
                      <p className="font-medium text-slate-700 mt-1">
                        {issueDateLabel}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Certificate ID
                      </span>
                      <p className="font-mono text-slate-700 mt-1">
                        {result.id}
                      </p>
                    </div>
                  </div>

                  {!isValid && result.revocationReason && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800">
                      <strong>Revocation Reason:</strong>{" "}
                      {result.revocationReason}
                    </div>
                  )}

                  {isValid && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3 text-sm text-slate-500">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      This certificate was cryptographically signed by GIVA.
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isValid && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download size={16} /> Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink size={16} /> Share on LinkedIn
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Certificate Not Found
                </h3>
                <p className="text-slate-500">
                  We could not find a certificate with ID{" "}
                  <strong>{certId}</strong>. <br />
                  Please check the ID and try again.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} GIVA Ecosystem. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default CertificateVerificationPage;
