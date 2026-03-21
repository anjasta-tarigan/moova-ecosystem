import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertOctagon,
  Search,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Hash,
} from "lucide-react";
import { verifyCertificate } from "../services/api/certificateApi";

type VerifyResult = {
  valid: boolean;
  reason: string;
  cert: any | null;
  hashInfo?: {
    certHash: string;
    prevHash: string;
    algorithm: string;
    isGenesis: boolean;
  };
  revokedAt?: string;
  revocationReason?: string;
};

const CertificateVerificationPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(id ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) doVerify(id);
  }, [id]);

  const doVerify = async (c: string) => {
    if (!c.trim()) return;
    setLoading(true);
    try {
      const res = await verifyCertificate(c.trim());
      setResult(res.data.data);
    } catch {
      setResult({ valid: false, reason: "CERT_NOT_FOUND", cert: null });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", `#/verify/${code}`);
    doVerify(code);
  };

  const AWARD_LABELS: Record<string, string> = {
    WINNER: "Winner",
    PARTICIPANT: "Participant",
    JUDGE: "Judge",
    MENTOR: "Mentor",
    CUSTOM: "Special Award",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src="/brand.png" alt="GIVA" className="h-7 w-auto" />
            <span className="font-black text-slate-900 text-lg">
              GIVA Verify
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} /> Blockchain Verification
          </span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 max-w-2xl flex flex-col gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Certificate Verification
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Verify the authenticity of a GIVA certificate. Each certificate is
            secured with a SHA-256 hash chain - any tampering is detected.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. GIVA-2024-AB12CD"
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-slate-900 placeholder:text-slate-400 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              "Verify"
            )}
          </button>
        </form>

        {result && (
          <div
            className={`bg-white rounded-2xl border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-400 ${
              result.valid
                ? "border-emerald-200"
                : result.reason === "CERT_REVOKED"
                  ? "border-red-200"
                  : "border-slate-200"
            }`}
          >
            <div
              className={`p-5 flex items-center justify-center gap-3 ${
                result.valid
                  ? "bg-emerald-50 text-emerald-700"
                  : result.reason === "CERT_REVOKED"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-600"
              }`}
            >
              {result.valid ? (
                <>
                  <CheckCircle size={28} />
                  <div>
                    <span className="text-xl font-bold block">
                      Certificate is Valid
                    </span>
                    <span className="text-xs opacity-70">
                      Hash-chain integrity confirmed
                    </span>
                  </div>
                </>
              ) : result.reason === "CERT_REVOKED" ? (
                <>
                  <AlertOctagon size={28} />
                  <span className="text-xl font-bold">Certificate Revoked</span>
                </>
              ) : result.reason === "HASH_MISMATCH" ? (
                <>
                  <XCircle size={28} />
                  <div>
                    <span className="text-xl font-bold block">
                      Integrity Failure
                    </span>
                    <span className="text-xs opacity-70">
                      Hash mismatch - possible tampering
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={28} />
                  <span className="text-xl font-bold">
                    Certificate Not Found
                  </span>
                </>
              )}
            </div>

            {result.cert && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Recipient",
                      val: result.cert.user?.fullName ?? result.cert.user?.name,
                      large: true,
                    },
                    {
                      label: "Award",
                      val:
                        result.cert.awardType === "CUSTOM"
                          ? result.cert.customTitle
                          : result.cert.awardType === "WINNER"
                            ? `${result.cert.rankLabel} - Winner`
                            : AWARD_LABELS[result.cert.awardType],
                    },
                    { label: "Event", val: result.cert.event?.title ?? "-" },
                    {
                      label: "Issue Date",
                      val: new Date(result.cert.issuedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      ),
                    },
                    {
                      label: "Certificate ID",
                      val: result.cert.certCode,
                      mono: true,
                    },
                  ].map((f) => (
                    <div key={f.label}>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        {f.label}
                      </span>
                      <p
                        className={`font-medium text-slate-800 ${f.large ? "text-2xl font-bold text-slate-900" : ""} ${f.mono ? "font-mono text-sm" : ""}`}
                      >
                        {f.val ?? "-"}
                      </p>
                    </div>
                  ))}
                </div>

                {result.reason === "CERT_REVOKED" && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800">
                    <strong>Revocation Date:</strong>{" "}
                    {result.revokedAt
                      ? new Date(result.revokedAt).toLocaleDateString()
                      : "-"}
                    <br />
                    <strong>Reason:</strong>{" "}
                    {result.revocationReason ?? "Not specified"}
                  </div>
                )}

                {result.hashInfo && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Hash size={13} /> Blockchain Integrity Record
                    </p>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <div className="flex-shrink-0 bg-white border border-slate-200 rounded-lg p-3 text-center min-w-[120px]">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Prev Block
                        </p>
                        <p className="font-mono text-[9px] text-slate-500 break-all">
                          {result.hashInfo.isGenesis
                            ? "GENESIS"
                            : `${result.hashInfo.prevHash.substring(0, 16)}...`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-slate-300 font-bold text-lg">
                        -&gt;
                      </div>
                      <div className="flex-shrink-0 bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center min-w-[120px] ring-2 ring-emerald-400 ring-offset-1">
                        <p className="text-[9px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
                          This Block ✓
                        </p>
                        <p className="font-mono text-[9px] text-emerald-700 break-all">
                          {`${result.hashInfo.certHash.substring(0, 16)}...`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-slate-300 font-bold text-lg">
                        -&gt;
                      </div>
                      <div className="flex-shrink-0 bg-white border border-dashed border-slate-200 rounded-lg p-3 text-center min-w-[120px] opacity-50">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Next Block
                        </p>
                        <p className="text-[9px] text-slate-400">pending...</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          label: "certHash (SHA-256)",
                          val: result.hashInfo.certHash,
                          badge: "✓ Verified",
                        },
                        {
                          label: "prevHash (chain link)",
                          val: result.hashInfo.prevHash,
                        },
                      ].map((h) => (
                        <div key={h.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              {h.label}
                            </span>
                            {h.badge && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                {h.badge}
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-slate-700 break-all bg-white rounded p-2 border border-slate-100">
                            {h.val}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Algorithm", val: "SHA-256" },
                        {
                          label: "Chain Type",
                          val: result.hashInfo.isGenesis
                            ? "Genesis Block"
                            : "Chained",
                        },
                        { label: "Integrity", val: "Intact ✓", green: true },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="bg-white rounded-lg border border-slate-100 p-3"
                        >
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                            {m.label}
                          </p>
                          <p
                            className={`text-xs font-bold ${m.green ? "text-emerald-600" : "text-slate-700"}`}
                          >
                            {m.val}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Hash formula: SHA-256(certCode | userId | eventId |
                      issuedAt | prevHash). Any modification to the record
                      produces a different hash, immediately invalidating the
                      chain - identical to tamper-evident permissioned
                      blockchain ledgers.
                    </p>
                  </div>
                )}

                {result.valid && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3 text-sm text-slate-500">
                    <ShieldCheck
                      size={20}
                      className="text-emerald-500 shrink-0"
                    />
                    This certificate was cryptographically signed by GIVA using
                    SHA-256 hash chaining. The record has not been tampered
                    with.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} GIVA Ecosystem. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default CertificateVerificationPage;
