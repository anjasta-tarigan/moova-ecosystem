import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

// -- QR pre-generator (silent, no DOM output) -----------------------
const QRGenerator: React.FC<{
  certCode: string;
  onGenerated: (certCode: string, dataUrl: string) => void;
}> = ({ certCode, onGenerated }) => {
  const verifyUrl = `${window.location.origin}/#/verify/${certCode}`;
  useEffect(() => {
    import("qrcode").then((Q) =>
      Q.toDataURL(verifyUrl, {
        width: 96,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      }).then((dataUrl) => onGenerated(certCode, dataUrl)),
    );
  }, [certCode]);
  return null;
};

// -- Imperative PDF download with QR injection ----------------------
async function downloadSingleCert(cert: any, qrDataUrl: string) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    left: "-9999px",
    top: "0",
    width: CERT_W + "px",
    height: CERT_H + "px",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(container);

  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

  root.render(
    <CertCanvas
      design={buildDesign(cert)}
      template={getTemplate(cert.templateId)}
      recipient={{
        name: cert.user?.fullName ?? cert.user?.name ?? "Recipient",
        awardType: cert.awardType,
        rankLabel: cert.rankLabel,
        customTitle: cert.customTitle,
      }}
      certCode={cert.certCode}
      issuerName={
        cert.issuedBy?.fullName ?? cert.issuedBy?.name ?? "GIVA Administrator"
      }
      eventTitle={cert.event?.title ?? ""}
      issuedAt={cert.issuedAt}
      scale={1}
      draggable={false}
      layout={AUTO_LAYOUT}
      qrDataUrl={qrDataUrl}
    />,
  );

  // Wait for React to flush + browser to paint
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );

  // Wait for all images to load
  await document.fonts.ready;
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((r) => {
            img.onload = () => r();
            img.onerror = () => r();
          }),
    ),
  );

  // One final frame to ensure paint
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    const el = container.firstChild as HTMLElement;
    if (!el) throw new Error("CertCanvas did not render");

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
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

    // Draw QR directly onto PDF as a fallback/overlay
    if (qrDataUrl) {
      const qrX = (0.8 * CERT_W + 8) / CERT_W * 297;
      const qrY = (0.76 * CERT_H + 8) / CERT_H * 210;
      const qrSize = 80 / CERT_W * 297;
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    }
    pdf.save(`${cert.certCode}.pdf`);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

const EventCertificateView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/superadmin")
    ? "/superadmin"
    : "/admin";

  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any | null>(null);
  const [revoking, setRevoking] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [rl, setRL] = useState(false);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const handleQRGenerated = (certCode: string, dataUrl: string) =>
    setQrMap((prev) => ({ ...prev, [certCode]: dataUrl }));

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

  const handleDownload = async (cert: any) => {
    const qr = qrMap[cert.certCode];
    if (!qr) {
      alert("QR code is still generating. Please wait a moment and try again.");
      return;
    }
    try {
      await downloadSingleCert(cert, qr);
    } catch {
      alert("PDF generation failed. Please try again.");
    }
  };

  const eventTitle = certs[0]?.event?.title ?? "General Certificates";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Pre-generate QR data URLs silently */}
      {certs.map(
        (c) =>
          !qrMap[c.certCode] && (
            <QRGenerator
              key={c.id}
              certCode={c.certCode}
              onGenerated={handleQRGenerated}
            />
          ),
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`${basePath}/certificates`)}
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
          onClick={() => navigate(`${basePath}/certificates/create`)}
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
                        onClick={() => handleDownload(cert)}
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
                  qrDataUrl={qrMap[preview.certCode] || undefined}
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs text-slate-400">
                {!qrMap[preview.certCode]
                  ? "Generating QR code..."
                  : "Ready to download"}
              </p>
              <button
                onClick={() => handleDownload(preview)}
                disabled={!qrMap[preview.certCode]}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-40"
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
