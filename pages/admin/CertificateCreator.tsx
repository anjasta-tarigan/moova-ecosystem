import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Award,
  RefreshCw,
  AlertTriangle,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../lib/axios";
import {
  issueCertificate,
  CertificatePayload,
} from "../../services/api/adminApi";
import CertCanvas, {
  CERT_W,
  CERT_H,
  AUTO_LAYOUT,
  TEMPLATES,
  CertDesign,
  TemplateStyle,
  AwardType,
} from "../../components/CertCanvas";

const PREVIEW_W = 680;
const previewScale = PREVIEW_W / CERT_W;

interface Recipient {
  userId: string;
  name: string;
  email: string;
  awardType: AwardType;
  rankLabel?: string;
  customTitle?: string;
}

const RANKS = ["1st Place", "2nd Place", "3rd Place"] as const;

async function generateQrDataUrl(certCode: string): Promise<string> {
  const verifyUrl = `${window.location.origin}/#/verify/${certCode}`;
  const Q = await import("qrcode");
  return Q.toDataURL(verifyUrl, {
    width: 96,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

async function downloadCertPDF(
  certCode: string,
  design: CertDesign,
  template: any,
  recipient: any,
  issuerName: string,
  eventTitle: string,
  issuedAt: string,
) {
  const qrDataUrl = await generateQrDataUrl(certCode);

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
      design={design}
      template={template}
      recipient={recipient}
      certCode={certCode}
      issuerName={issuerName}
      eventTitle={eventTitle}
      issuedAt={issuedAt}
      scale={1}
      draggable={false}
      layout={design.layout}
      qrDataUrl={qrDataUrl}
    />,
  );

  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );

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

    // Draw QR directly onto PDF as fallback/overlay
    if (qrDataUrl) {
      const qrX = (0.8 * CERT_W + 8) / CERT_W * 297;
      const qrY = (0.76 * CERT_H + 8) / CERT_H * 210;
      const qrSize = 80 / CERT_W * 297;
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    }
    pdf.save(`${certCode}.pdf`);
  } catch (err) {
    console.error("[PDF]", err);
    alert("PDF generation failed. Please try again.");
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

const CertificateCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/superadmin")
    ? "/superadmin"
    : "/admin";
  const [step, setStep] = useState(1);

  const [design, setDesign] = useState<CertDesign>({
    mode: "builtin",
    templateId: "formal",
    autoLayout: true,
    layout: [...AUTO_LAYOUT],
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(
    TEMPLATES[0],
  );

  const [events, setEvents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [recipientTab, setRecipientTab] = useState<"students" | "judges">("students");
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [bulkAward, setBulkAward] = useState<AwardType>("PARTICIPANT");

  const [issuing, setIssuing] = useState(false);
  const [issuedList, setIssuedList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 2) return;
    api
      .get("/api/admin/events", { params: { limit: 100 } })
      .then((r) => setEvents(r.data.data ?? []))
      .catch(() => {});
    api
      .get("/api/admin/siswa", { params: { limit: 300 } })
      .then((r) => setStudents(r.data.data ?? []))
      .catch(() => {});
    api
      .get("/api/superadmin/users", { params: { role: "JUDGE", limit: 200 } })
      .then((r) => setJudges(r.data.data ?? []))
      .catch(() => {});
  }, [step]);

  const handleEventChange = (id: string) => {
    setEventId(id);
    setEventTitle(events.find((e) => e.id === id)?.title ?? "");
    setRecipients([]);
  };

  const getPersonName = (s: any): string =>
    `${s.siswaProfile?.firstName ?? ""} ${s.siswaProfile?.lastName ?? ""}`.trim() ||
    s.fullName ||
    s.name ||
    s.email;

  const togglePerson = (s: any) => {
    setRecipients((prev) => {
      const exists = prev.find((r) => r.userId === s.id);
      if (exists) return prev.filter((r) => r.userId !== s.id);
      return [
        ...prev,
        {
          userId: s.id,
          name: getPersonName(s),
          email: s.email,
          awardType: bulkAward,
          rankLabel: bulkAward === "WINNER" ? "1st Place" : undefined,
        },
      ];
    });
  };

  const applyBulkAward = () => {
    setRecipients((prev) =>
      prev.map((r) => ({
        ...r,
        awardType: bulkAward,
        rankLabel:
          bulkAward === "WINNER" ? (r.rankLabel ?? "1st Place") : undefined,
      })),
    );
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport: vp,
        } as any).promise;
        setDesign((d) => ({
          ...d,
          mode: "custom",
          bgDataUrl: canvas.toDataURL("image/png"),
        }));
      } catch {
        alert("Could not read PDF. Try PNG/JPG.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setDesign((d) => ({
          ...d,
          mode: "custom",
          bgDataUrl: ev.target?.result as string,
        }));
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  const handleIssue = async () => {
    setIssuing(true);
    setError(null);
    const codes: string[] = [];

    for (const r of recipients) {
      try {
        const res = await issueCertificate({
          userId: r.userId,
          eventId: eventId || undefined,
          awardType: r.awardType,
          rankLabel: r.rankLabel,
          customTitle: r.customTitle,
          templateId:
            design.mode === "builtin"
              ? (design.templateId ?? "modern")
              : "custom",
          bgDataUrl: design.mode === "custom" ? design.bgDataUrl : undefined,
        } as CertificatePayload);
        codes.push(res.data.data?.certCode ?? "");
      } catch {
        // Continue issuing for other recipients.
      }
    }

    if (codes.length === 0) {
      setError(
        "No certificates were issued. Please verify your selections and try again.",
      );
    }

    setIssuedList(codes);
    setIssuing(false);
  };

  const stepLabels = ["Design", "Recipients", "Preview & Issue"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`${basePath}/certificates`)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Create Certificates
          </h1>
          <p className="text-sm text-slate-500">
            Design -&gt; Select recipients -&gt; Issue
          </p>
        </div>
      </div>

      <div className="flex items-center">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const cur = step === n;
          return (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : cur
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-400"
                  }`}
                >
                  {done ? <Check size={14} /> : n}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    cur ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${step > n ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-700 mb-3">
                Design Source
              </p>
              <div className="flex gap-2">
                {(["builtin", "custom"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDesign((d) => ({ ...d, mode: m }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                      design.mode === m
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {m === "builtin" ? "Built-in" : "Custom Upload"}
                  </button>
                ))}
              </div>
            </div>

            {design.mode === "builtin" && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-bold text-slate-700 mb-3">
                  Template
                </p>
                <div className="space-y-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t);
                        setDesign((d) => ({ ...d, templateId: t.id }));
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate.id === t.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 24,
                          borderRadius: 4,
                          background: t.bg,
                          flexShrink: 0,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {t.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.description}
                        </p>
                      </div>
                      {selectedTemplate.id === t.id && (
                        <Check size={16} className="ml-auto text-slate-900" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {design.mode === "custom" && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-bold text-slate-700 mb-3">
                  Background Image
                </p>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload size={20} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 font-medium">
                    PNG, JPG, or PDF
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    A4 landscape recommended (297x210mm)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    className="hidden"
                    onChange={handleBgUpload}
                  />
                </label>
                {design.bgDataUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-xs text-slate-600 font-medium">
                      Background loaded
                    </span>
                    <button
                      onClick={() =>
                        setDesign((d) => ({ ...d, bgDataUrl: undefined }))
                      }
                      className="ml-auto p-1 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-700 mb-3">
                Component Layout
              </p>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    Auto Layout
                  </p>
                  <p className="text-xs text-slate-400">
                    System places components automatically
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDesign((d) => ({
                      ...d,
                      autoLayout: !d.autoLayout,
                      layout: !d.autoLayout ? [...AUTO_LAYOUT] : d.layout,
                    }))
                  }
                >
                  {design.autoLayout ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} className="text-slate-300" />
                  )}
                </button>
              </div>
              {!design.autoLayout && (
                <>
                  <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3">
                    Drag components on the preview to reposition. Blue dashed
                    border = safe print margin.
                  </p>
                  <button
                    onClick={() =>
                      setDesign((d) => ({
                        ...d,
                        layout: [...AUTO_LAYOUT],
                        autoLayout: true,
                      }))
                    }
                    className="w-full py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Reset to Auto Layout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-700">
                Preview
                {!design.autoLayout && (
                  <span className="ml-2 text-xs font-normal text-blue-500">
                    (drag mode active)
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                A4 Landscape - 297 x 210 mm
              </p>
            </div>
            <div
              style={{
                width: CERT_W * previewScale,
                height: CERT_H * previewScale,
                overflow: "hidden",
                borderRadius: 8,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            >
              <CertCanvas
                design={design}
                template={selectedTemplate}
                recipient={{
                  name: "Sample Recipient",
                  awardType: "PARTICIPANT",
                }}
                certCode="GIVA-2024-SAMPLE"
                issuerName="GIVA Administrator"
                eventTitle="Sample Event Title"
                issuedAt={new Date().toISOString()}
                scale={previewScale}
                draggable={!design.autoLayout}
                layout={design.layout}
                onLayoutChange={(l) =>
                  setDesign((d) => ({ ...d, layout: l, autoLayout: false }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Event *
              </label>
              <select
                value={eventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">- Select event -</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-700 mb-3">
                Bulk Award Type
              </p>
              <select
                value={bulkAward}
                onChange={(e) => setBulkAward(e.target.value as AwardType)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 mb-3"
              >
                {(
                  [
                    "WINNER",
                    "PARTICIPANT",
                    "JUDGE",
                    "MENTOR",
                    "CUSTOM",
                  ] as AwardType[]
                ).map((v) => (
                  <option key={v} value={v}>
                    {v.charAt(0) + v.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                disabled={!recipients.length}
                onClick={applyBulkAward}
                className="w-full py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Apply to selected ({recipients.length})
              </button>
            </div>

            {recipients.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-bold text-slate-700 mb-3">
                  Recipients ({recipients.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recipients.map((r) => (
                    <div
                      key={r.userId}
                      className="flex flex-col gap-1.5 text-xs bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          size={12}
                          className="text-emerald-500 shrink-0"
                        />
                        <span className="flex-1 truncate text-slate-700 font-medium">
                          {r.name}
                        </span>
                        <button
                          onClick={() =>
                            setRecipients((p) =>
                              p.filter((x) => x.userId !== r.userId),
                            )
                          }
                          className="text-slate-300 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      {r.awardType === "WINNER" && (
                        <div className="flex items-center gap-2 pl-5">
                          <span className="text-slate-400 text-[10px] font-bold uppercase">
                            Rank:
                          </span>
                          <div className="flex gap-1">
                            {RANKS.map((rank) => (
                              <button
                                key={rank}
                                onClick={() =>
                                  setRecipients((p) =>
                                    p.map((x) =>
                                      x.userId === r.userId
                                        ? { ...x, rankLabel: rank }
                                        : x,
                                    ),
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                  r.rankLabel === rank
                                    ? rank === "1st Place"
                                      ? "bg-amber-500 text-white border-amber-500"
                                      : rank === "2nd Place"
                                        ? "bg-slate-400 text-white border-slate-400"
                                        : "bg-amber-700 text-white border-amber-700"
                                    : "bg-white text-slate-500 border-slate-200"
                                }`}
                              >
                                {rank.replace(" Place", "")}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="pl-5">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            r.awardType === "WINNER"
                              ? "bg-amber-100 text-amber-700"
                              : r.awardType === "JUDGE"
                                ? "bg-purple-100 text-purple-700"
                                : r.awardType === "MENTOR"
                                  ? "bg-green-100 text-green-700"
                                  : r.awardType === "CUSTOM"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {r.awardType === "WINNER"
                            ? (r.rankLabel ?? "1st Place")
                            : r.awardType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Tabs: Students | Judges */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4">
              {(["students", "judges"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRecipientTab(tab)}
                  className={`text-sm font-bold pb-1 border-b-2 transition-colors ${
                    recipientTab === tab
                      ? "text-slate-900 border-slate-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  {tab === "students" ? `Students (${students.length})` : `Judges (${judges.length})`}
                </button>
              ))}
              <button
                onClick={() => {
                  const list = recipientTab === "students" ? students : judges;
                  setRecipients((prev) => {
                    const existingIds = new Set(prev.map((r) => r.userId));
                    const newRecipients = list
                      .filter((s) => !existingIds.has(s.id))
                      .map((s) => ({
                        userId: s.id,
                        name: getPersonName(s),
                        email: s.email,
                        awardType: recipientTab === "judges" ? ("JUDGE" as AwardType) : bulkAward,
                        rankLabel: bulkAward === "WINNER" && recipientTab === "students" ? "1st Place" : undefined,
                      }));
                    return [...prev, ...newRecipients];
                  });
                }}
                className="text-xs text-blue-600 hover:underline font-medium ml-auto"
              >
                Select All
              </button>
            </div>
            <div className="overflow-y-auto max-h-[480px]">
              {(() => {
                const list = recipientTab === "students" ? students : judges;
                if (list.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                      Loading {recipientTab}...
                    </div>
                  );
                }
                return list.map((s: any) => {
                  const name = getPersonName(s);
                  const sel = !!recipients.find((r) => r.userId === s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => togglePerson(s)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                        sel
                          ? "bg-emerald-50 hover:bg-emerald-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          sel
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-200"
                        }`}
                      >
                        {sel && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {s.email}
                          {recipientTab === "judges" && (
                            <span className="ml-2 text-purple-500 font-medium">JUDGE</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          {issuedList.length === 0 ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap gap-6">
                {[
                  { label: "Event", val: eventTitle || "None" },
                  {
                    label: "Design",
                    val:
                      design.mode === "builtin"
                        ? selectedTemplate.label
                        : "Custom Upload",
                  },
                  { label: "Recipients", val: `${recipients.length} recipients` },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">
                      {s.label}
                    </p>
                    <p className="font-bold text-slate-900">{s.val}</p>
                  </div>
                ))}
              </div>

              {recipients[0] && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">
                    Sample Preview - {recipients[0].name}
                  </p>
                  <div
                    style={{
                      width: CERT_W * previewScale,
                      height: CERT_H * previewScale,
                      overflow: "hidden",
                      borderRadius: 8,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    <CertCanvas
                      design={design}
                      template={selectedTemplate}
                      recipient={recipients[0]}
                      certCode="GIVA-PREVIEW-ONLY"
                      issuerName="GIVA Administrator"
                      eventTitle={eventTitle}
                      issuedAt={new Date().toISOString()}
                      scale={previewScale}
                      draggable={false}
                      layout={design.layout}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleIssue}
                disabled={issuing || !recipients.length}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
              >
                {issuing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Issuing {recipients.length} certificates...
                  </>
                ) : (
                  <>
                    <Award size={16} />
                    Issue {recipients.length} Certificates
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-emerald-200">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {issuedList.length} Certificates Issued!
              </h2>
              <p className="text-slate-500 mb-8">
                Certificates are now available in the event view.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() =>
                    navigate(
                      eventId
                        ? `${basePath}/certificates/event/${eventId}`
                        : `${basePath}/certificates`,
                    )
                  }
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
                >
                  View Certificates
                </button>
                <button
                  onClick={() => navigate(`${basePath}/certificates`)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back to List
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {issuedList.length === 0 && (
        <div className="flex justify-between pt-2">
          <button
            onClick={() =>
              step === 1
                ? navigate(`${basePath}/certificates`)
                : setStep((s) => s - 1)
            }
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} />
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 && (
            <button
              onClick={() => {
                if (step === 2) {
                  if (!recipients.length) {
                    alert("Please select at least one recipient.");
                    return;
                  }
                  const missingRank = recipients.filter(
                    (r) => r.awardType === "WINNER" && !r.rankLabel,
                  );
                  if (missingRank.length) {
                    alert(
                      `Assign rank for: ${missingRank.map((r) => r.name).join(", ")}`,
                    );
                    return;
                  }
                }
                setStep((s) => s + 1);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      <div id="hidden-cert-download" className="hidden" />
    </div>
  );
};

export default CertificateCreator;
