import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Download,
  XCircle,
  RefreshCw,
  CheckCircle,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CertCanvas, {
  CERT_W,
  CERT_H,
  AUTO_LAYOUT,
  getTemplate,
  CertDesign,
} from "../../components/CertCanvas";
import {
  getAdminCertificates,
  revokeCertificate,
} from "../../services/api/adminApi";

const MODAL_SCALE = 660 / CERT_W;

function buildDesign(cert: any): CertDesign {
  return {
    mode: cert.templateId === "custom" ? "custom" : "builtin",
    templateId: cert.templateId ?? "modern",
    bgDataUrl: cert.bgDataUrl ?? undefined,
    autoLayout: true,
    layout: [...AUTO_LAYOUT],
  };
}

async function downloadSingleCert(cert: any) {
  const el = document.getElementById(`ev-cert-${cert.id}`);
  if (!el) return;

  await document.fonts.ready;
  const qrImg = el.querySelector('img[alt="QR"]') as HTMLImageElement | null;
  if (qrImg && !qrImg.complete) {
    await new Promise<void>((r) => {
      qrImg.onload = () => r();
      qrImg.onerror = () => r();
    });
  }
  const brandImg = el.querySelector(
    'img[alt="GIVA"]',
  ) as HTMLImageElement | null;
  if (brandImg && !brandImg.complete) {
    await new Promise<void>((r) => {
      brandImg.onload = () => r();
      brandImg.onerror = () => r();
    });
  }

  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 8000,
      width: CERT_W,
      height: CERT_H,
    });
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210);
    pdf.save(`${cert.certCode}.pdf`);
  } catch {
    alert("PDF generation failed. Please try again.");
  }
}

const EventCertificateView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any | null>(null);
  const [revoking, setRevoking] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [rl, setRL] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminCertificates({
        eventId: eventId === "general" ? undefined : eventId,
        limit: 200,
      });
      setCerts(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handleRevoke = async () => {
    if (!revoking) return;
    setRL(true);
    try {
      await revokeCertificate(revoking.certCode, reason);
      setRevoking(null);
      setReason("");
      load();
    } catch {
      // silent
    } finally {
      setRL(false);
    }
  };

  const eventTitle = certs[0]?.event?.title ?? "General Certificates";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {certs.map((c) => (
        <div
          key={c.id}
          id={`ev-cert-${c.id}`}
          style={{ position: "absolute", left: -9999, top: 0 }}
        >
          <CertCanvas
            design={buildDesign(c)}
            template={getTemplate(c.templateId)}
            recipient={{
              name: c.user?.fullName ?? c.user?.name ?? "Recipient",
              awardType: c.awardType,
              rankLabel: c.rankLabel,
              customTitle: c.customTitle,
            }}
            certCode={c.certCode}
            issuerName={
              c.issuedBy?.fullName ?? c.issuedBy?.name ?? "GIVA Administrator"
            }
            eventTitle={c.event?.title ?? ""}
            issuedAt={c.issuedAt}
            scale={1}
            draggable={false}
            layout={AUTO_LAYOUT}
          />
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/certificates")}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">
            {eventTitle}
          </h1>
          <p className="text-sm text-slate-500">
            {certs.length} certificate{certs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/certificates/create")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
        >
          + Issue More
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          No certificates for this event.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {certs.map((cert) => {
            const tpl = getTemplate(cert.templateId);
            return (
              <div
                key={cert.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div
                  onClick={() => setPreview(cert)}
                  className="relative cursor-pointer flex items-center justify-center overflow-hidden"
                  style={{
                    height: 180,
                    background: tpl.bg,
                    backgroundColor: tpl.bgColor,
                  }}
                >
                  <div className="text-center" style={{ color: tpl.textColor }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: tpl.accentColor,
                        marginBottom: 6,
                      }}
                    >
                      {cert.awardType === "WINNER"
                        ? cert.rankLabel
                        : cert.awardType}
                    </div>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}
                    >
                      {cert.user?.fullName ?? cert.user?.name ?? "-"}
                    </div>
                  </div>
                  {cert.status === "REVOKED" && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs uppercase">
                        Revoked
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-bold text-slate-900 text-sm mb-0.5">
                    {cert.user?.fullName ?? cert.user?.name ?? "-"}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">{cert.certCode}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    {cert.status === "ACTIVE" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <XCircle size={10} /> Revoked
                      </span>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => setPreview(cert)}
                        title="Preview"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => downloadSingleCert(cert)}
                        title="Download PDF"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Download size={15} />
                      </button>
                      {cert.status === "ACTIVE" && (
                        <button
                          onClick={() => setRevoking(cert)}
                          title="Revoke"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Certificate Preview</h3>
              <button
                onClick={() => setPreview(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-start justify-center">
              <div
                style={{
                  width: CERT_W * MODAL_SCALE,
                  height: CERT_H * MODAL_SCALE,
                  overflow: "hidden",
                  borderRadius: 8,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                }}
              >
                <CertCanvas
                  design={buildDesign(preview)}
                  template={getTemplate(preview.templateId)}
                  recipient={{
                    name:
                      preview.user?.fullName ??
                      preview.user?.name ??
                      "Recipient",
                    awardType: preview.awardType,
                    rankLabel: preview.rankLabel,
                    customTitle: preview.customTitle,
                  }}
                  certCode={preview.certCode}
                  issuerName={
                    preview.issuedBy?.fullName ??
                    preview.issuedBy?.name ??
                    "GIVA Administrator"
                  }
                  eventTitle={preview.event?.title ?? ""}
                  issuedAt={preview.issuedAt}
                  scale={MODAL_SCALE}
                  draggable={false}
                  layout={AUTO_LAYOUT}
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => downloadSingleCert(preview)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {revoking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRevoking(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Revoke Certificate
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Revoke <strong>{revoking.certCode}</strong> for{" "}
              <strong>{revoking.user?.fullName ?? revoking.user?.name}</strong>?
              This cannot be undone.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for revocation..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 mb-4 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRevoking(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={rl}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {rl ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Revoking...
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCertificateView;
