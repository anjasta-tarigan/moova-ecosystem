import React, { useEffect, useState } from "react";
import {
  Award,
  Download,
  Share2,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CertCanvas, {
  AUTO_LAYOUT,
  getTemplate,
  CertDesign,
  CERT_W,
  CERT_H,
} from "../components/CertCanvas";
import { getMyCertificates } from "../services/api/certificateApi";

// -- Types ------------------------------------------------------
type AwardType = "WINNER" | "PARTICIPANT" | "JUDGE" | "MENTOR" | "CUSTOM";
type CertStatus = "ACTIVE" | "REVOKED";

interface Cert {
  id: string;
  certCode: string;
  awardType: AwardType;
  customTitle?: string;
  rankLabel?: string;
  status: CertStatus;
  issuedAt: string;
  certHash: string;
  prevHash: string;
  templateId?: string;
  bgDataUrl?: string;
  user: { id: string; name: string; email: string };
  event?: { id: string; title: string } | null;
  issuedBy: { id: string; name: string };
}

// -- Helpers ----------------------------------------------------
function buildDesign(cert: Cert): CertDesign {
  return {
    mode: cert.templateId === "custom" ? "custom" : "builtin",
    templateId: (cert.templateId ?? "modern") as any,
    bgDataUrl: cert.bgDataUrl ?? undefined,
    autoLayout: true,
    layout: [...AUTO_LAYOUT],
  };
}

const GRAD: Record<AwardType, string> = {
  WINNER: "from-amber-500 to-yellow-600",
  PARTICIPANT: "from-blue-500 to-indigo-600",
  JUDGE: "from-purple-500 to-violet-600",
  MENTOR: "from-green-500 to-teal-600",
  CUSTOM: "from-slate-500 to-slate-700",
};

function getAwardLabel(cert: Cert): string {
  if (cert.awardType === "CUSTOM") return cert.customTitle ?? "Award";
  if (cert.awardType === "WINNER") return cert.rankLabel ?? "1st Place";
  return cert.awardType.charAt(0) + cert.awardType.slice(1).toLowerCase();
}

// -- QR pre-generator -------------------------------------------
// Generates QR data URLs silently (no DOM output) and stores them
// in qrMap so the preview modal can display immediately.
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

// -- Imperative PDF download ------------------------------------
// Creates a fresh DOM container, renders CertCanvas into it with
// createRoot, waits for all images to load, then captures with
// html2canvas. No pre-rendered elements, no race conditions.
async function downloadCertPDF(cert: Cert, qrDataUrl: string): Promise<void> {
  // 1. Create temporary container at absolute position
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

  // 2. Render CertCanvas imperatively
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

  root.render(
    <CertCanvas
      design={buildDesign(cert)}
      template={getTemplate(cert.templateId)}
      recipient={{
        name: cert.user?.name ?? "Recipient",
        awardType: cert.awardType,
        rankLabel: cert.rankLabel,
        customTitle: cert.customTitle,
      }}
      certCode={cert.certCode}
      issuerName={cert.issuedBy?.name ?? "GIVA Administrator"}
      eventTitle={cert.event?.title ?? ""}
      issuedAt={cert.issuedAt}
      scale={1}
      draggable={false}
      layout={AUTO_LAYOUT}
      qrDataUrl={qrDataUrl}
    />,
  );

  // 3. Wait two animation frames for React to flush + browser to paint
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );

  // 4. Wait for all <img> elements to fully load
  //    (qrDataUrl is a data URL so loads instantly, but be safe)
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

  // 5. One final frame to ensure paint is complete
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    const el = container.firstChild as HTMLElement;
    if (!el) throw new Error("CertCanvas did not render");

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
  } finally {
    // Always cleanup
    root.unmount();
    document.body.removeChild(container);
  }
}

// -- Preview Modal ----------------------------------------------
const MODAL_SCALE = 640 / CERT_W;

const PreviewModal: React.FC<{
  cert: Cert;
  qrDataUrl: string;
  onClose: () => void;
}> = ({ cert, qrDataUrl, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const verifyUrl = `${window.location.origin}/#/verify/${cert.certCode}`;

  const handleDownload = async () => {
    if (!qrDataUrl) {
      alert("QR code is still generating. Please wait a moment and try again.");
      return;
    }
    setDownloading(true);
    try {
      await downloadCertPDF(cert, qrDataUrl);
    } catch (err) {
      console.error("[PDF]", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full
                      max-w-4xl z-10 overflow-hidden flex flex-col
                      max-h-[90vh]"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-4
                        border-b border-slate-100"
        >
          <div>
            <h3 className="font-bold text-slate-900">Your Certificate</h3>
            <p className="text-xs text-slate-400 mt-0.5">{cert.certCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scaled preview */}
        <div
          className="flex-1 overflow-y-auto p-6 bg-slate-100
                        flex items-start justify-center"
        >
          <div
            style={{
              width: CERT_W * MODAL_SCALE,
              height: CERT_H * MODAL_SCALE,
              overflow: "hidden",
              borderRadius: 8,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          >
            <CertCanvas
              design={buildDesign(cert)}
              template={getTemplate(cert.templateId)}
              recipient={{
                name: cert.user?.name ?? "Recipient",
                awardType: cert.awardType,
                rankLabel: cert.rankLabel,
                customTitle: cert.customTitle,
              }}
              certCode={cert.certCode}
              issuerName={cert.issuedBy?.name ?? "GIVA Administrator"}
              eventTitle={cert.event?.title ?? ""}
              issuedAt={cert.issuedAt}
              scale={MODAL_SCALE}
              draggable={false}
              layout={AUTO_LAYOUT}
              qrDataUrl={qrDataUrl || undefined}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className="p-4 border-t border-slate-100 flex
                        justify-between items-center"
        >
          <p className="text-xs text-slate-400">
            {!qrDataUrl ? "Generating QR code..." : "Ready to download"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(verifyUrl);
                alert("Verification link copied!");
              }}
              className="flex items-center gap-2 px-4 py-2 border
                         border-slate-200 text-slate-700 text-sm font-bold
                         rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Share2 size={15} /> Share
            </button>
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl || downloading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900
                         text-white text-sm font-bold rounded-lg
                         hover:bg-black transition-colors disabled:opacity-40"
            >
              {downloading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download size={15} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Main page --------------------------------------------------
const DashboardCertificates: React.FC = () => {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Cert | null>(null);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const handleQRGenerated = (certCode: string, dataUrl: string) =>
    setQrMap((prev) => ({ ...prev, [certCode]: dataUrl }));

  useEffect(() => {
    getMyCertificates()
      .then((r) => {
        const payload = r.data;
        const list: Cert[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setCerts(list);
      })
      .catch((err) => console.error("[Certificates]", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw size={24} className="animate-spin text-slate-300" />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/*
        Pre-generate QR data URLs for all certs silently.
        Results stored in qrMap, passed to modal on open.
        No DOM output - purely async computation.
      */}
      {certs.map(
        (cert) =>
          !qrMap[cert.certCode] && (
            <QRGenerator
              key={cert.id}
              certCode={cert.certCode}
              onGenerated={handleQRGenerated}
            />
          ),
      )}

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row justify-between
                      items-start sm:items-end gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verify, download, and share your achievements.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 bg-blue-50
                        border border-blue-200 text-blue-700
                        rounded-lg text-xs font-bold"
        >
          <ShieldCheck size={15} /> Blockchain Hash-Verified
        </div>
      </div>

      {/* Empty state */}
      {certs.length === 0 ? (
        <div
          className="text-center py-24 bg-white rounded-2xl
                        border border-dashed border-slate-200"
        >
          <Award size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No Certificates Yet
          </h3>
          <p className="text-sm text-slate-500">
            Participate in events to earn certificates.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2
                        xl:grid-cols-3 gap-6"
        >
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="group bg-white rounded-2xl border border-slate-200
                shadow-sm hover:shadow-md hover:-translate-y-1
                transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div
                className={`h-44 bg-gradient-to-br ${GRAD[cert.awardType]}
                  flex items-center justify-center relative cursor-pointer`}
                onClick={() => setPreview(cert)}
              >
                <Award
                  size={52}
                  className="text-white/80 group-hover:scale-110
                             transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  {cert.status === "ACTIVE" ? (
                    <span
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm
                      text-white text-[10px] font-bold rounded-full
                      border border-white/30"
                    >
                      Verified
                    </span>
                  ) : (
                    <span
                      className="px-2 py-1 bg-red-600 text-white
                      text-[10px] font-bold rounded-full"
                    >
                      Revoked
                    </span>
                  )}
                </div>
                <div
                  className="absolute inset-0 bg-black/0
                  group-hover:bg-black/10 transition-colors
                  flex items-center justify-center"
                >
                  <span
                    className="opacity-0 group-hover:opacity-100
                    transition-opacity bg-white/20 backdrop-blur-sm
                    text-white text-xs font-bold px-3 py-1.5 rounded-full
                    border border-white/30"
                  >
                    View Certificate
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider
                               text-slate-400 mb-1"
                >
                  {getAwardLabel(cert)}
                </p>
                <h3
                  className="font-bold text-slate-900 text-base mb-1
                               leading-snug"
                >
                  {cert.event?.title ?? "GIVA Ecosystem"}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div
                  className="mt-auto pt-4 border-t border-slate-50
                                flex gap-2"
                >
                  <button
                    onClick={() => setPreview(cert)}
                    className="flex-1 py-2 text-xs font-bold text-slate-700
                      border border-slate-200 rounded-lg hover:bg-slate-50
                      transition-colors"
                  >
                    View &amp; Download
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/#/verify/${cert.certCode}`;
                      navigator.clipboard.writeText(url);
                      alert("Verification link copied!");
                    }}
                    className="p-2 border border-slate-200 rounded-lg
                      text-slate-400 hover:text-blue-600 hover:bg-blue-50
                      transition-colors"
                    title="Copy verification link"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          cert={preview}
          qrDataUrl={qrMap[preview.certCode] ?? ""}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default DashboardCertificates;
