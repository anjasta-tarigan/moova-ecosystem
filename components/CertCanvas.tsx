import React, { useState, useEffect, useRef } from "react";
import { Move } from "lucide-react";

export const CERT_W = 1122;
export const CERT_H = 794;
export const SAFE_MARGIN = 30;

export type TemplateId = "formal" | "modern" | "minimal";
export type AwardType =
  | "WINNER"
  | "PARTICIPANT"
  | "JUDGE"
  | "MENTOR"
  | "CUSTOM";

export interface ComponentLayout {
  id: string;
  x: number;
  y: number;
}

export interface CertDesign {
  mode: "builtin" | "custom";
  templateId?: TemplateId;
  bgDataUrl?: string;
  autoLayout: boolean;
  layout: ComponentLayout[];
}

export interface TemplateStyle {
  id: TemplateId;
  label: string;
  description: string;
  bg: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  borderStyle: string;
}

export interface CertRecipient {
  name: string;
  awardType?: AwardType;
  rankLabel?: string;
  customTitle?: string;
}

export const AUTO_LAYOUT: ComponentLayout[] = [
  { id: "systemName", x: 0.05, y: 0.06 },
  { id: "awardTitle", x: 0.5, y: 0.23 },
  { id: "recipient", x: 0.5, y: 0.43 },
  { id: "eventName", x: 0.5, y: 0.57 },
  { id: "signature", x: 0.06, y: 0.82 },
  { id: "qrDate", x: 0.8, y: 0.76 },
];

export const TEMPLATES: TemplateStyle[] = [
  {
    id: "formal",
    label: "Formal",
    description: "Navy & gold - classic official look",
    bg: "linear-gradient(145deg,#0F172A 0%,#1E3A5F 100%)",
    bgColor: "#0F172A",
    textColor: "#F8FAFC",
    accentColor: "#F59E0B",
    fontFamily: 'Georgia,"Times New Roman",serif',
    borderStyle: "8px solid #1E3A5F",
  },
  {
    id: "modern",
    label: "Modern",
    description: "White with blue bar - clean & professional",
    bg: "#FFFFFF",
    bgColor: "#FFFFFF",
    textColor: "#0F172A",
    accentColor: "#2563EB",
    fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
    borderStyle: "8px solid #E2E8F0",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Light grey - understated elegance",
    bg: "linear-gradient(180deg,#F8FAFC 0%,#F1F5F9 100%)",
    bgColor: "#F8FAFC",
    textColor: "#1E293B",
    accentColor: "#475569",
    fontFamily: '"Helvetica Neue",Arial,sans-serif',
    borderStyle: "8px solid #CBD5E1",
  },
];

export function getTemplate(id?: string | null): TemplateStyle {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[1];
}

export function useQR(value: string): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!value) return;
    import("qrcode").then((Q) =>
      Q.toDataURL(value, {
        width: 96,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setUrl),
    );
  }, [value]);
  return url;
}

export interface CertCanvasProps {
  design: CertDesign;
  template?: TemplateStyle;
  recipient: CertRecipient;
  certCode: string;
  issuerName: string;
  eventTitle: string;
  issuedAt: string;
  scale?: number;
  draggable?: boolean;
  layout: ComponentLayout[];
  onLayoutChange?: (l: ComponentLayout[]) => void;
  qrDataUrl?: string; // ← NEW: injected from parent for PDF
}

const CertCanvas: React.FC<CertCanvasProps> = ({
  design,
  template,
  recipient,
  certCode,
  issuerName,
  eventTitle,
  issuedAt,
  scale = 1,
  draggable = false,
  layout,
  onLayoutChange,
  qrDataUrl: qrDataUrlProp, // ← injected override
}) => {
  const verifyUrl = `${window.location.origin}/#/verify/${certCode}`;
  const qrUrlHook = useQR(qrDataUrlProp ? "" : verifyUrl);
  const qrUrl = qrDataUrlProp || qrUrlHook;
  const tpl = template ?? getTemplate(design.templateId);

  const accentColor = tpl.accentColor;
  const textColor = tpl.textColor;
  const fontFamily = tpl.fontFamily;
  const isDark = tpl.id === "formal";

  const awardLabel =
    recipient.awardType === "CUSTOM"
      ? (recipient.customTitle ?? "")
      : recipient.awardType === "WINNER"
        ? `${recipient.rankLabel ?? "1st Place"} - Winner`
        : recipient.awardType === "JUDGE"
          ? "Certificate of Judgeship"
          : recipient.awardType === "MENTOR"
            ? "Certificate of Mentorship"
            : "Certificate of Participation";

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const getPos = (id: string): ComponentLayout =>
    layout.find((l) => l.id === id) ??
    AUTO_LAYOUT.find((l) => l.id === id) ?? { id, x: 0.5, y: 0.5 };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!draggable || !onLayoutChange) return;
    e.preventDefault();
    const pos = getPos(id);
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };

  useEffect(() => {
    if (!draggable) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !onLayoutChange) return;
      const { id, startX, startY, origX, origY } = dragRef.current;
      const dx = (e.clientX - startX) / (CERT_W * scale);
      const dy = (e.clientY - startY) / (CERT_H * scale);
      const newX = Math.min(0.95, Math.max(0.02, origX + dx));
      const newY = Math.min(0.95, Math.max(0.02, origY + dy));
      onLayoutChange(
        layout.map((l) => (l.id === id ? { ...l, x: newX, y: newY } : l)),
      );
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggable, layout, scale, onLayoutChange]);

  const bgStyle =
    design.mode === "custom" && design.bgDataUrl
      ? `url(${design.bgDataUrl}) center/cover no-repeat`
      : tpl.bg;

  const rootStyle: React.CSSProperties = {
    width: CERT_W,
    height: CERT_H,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    flexShrink: 0,
    border: design.mode === "builtin" ? tpl.borderStyle : "8px solid #E2E8F0",
    background: bgStyle,
    backgroundColor: tpl.bgColor,
    fontFamily,
    color: textColor,
    userSelect: draggable ? "none" : undefined,
  };

  const Comp: React.FC<{
    id: string;
    children: React.ReactNode;
    centered?: boolean;
  }> = ({ id, children, centered }) => {
    const pos = getPos(id);
    return (
      <div
        onMouseDown={(e) => handleMouseDown(e, id)}
        style={{
          position: "absolute",
          left: pos.x * CERT_W,
          top: pos.y * CERT_H,
          transform: centered ? "translateX(-50%)" : undefined,
          cursor: draggable ? "grab" : "default",
          zIndex: 10,
        }}
      >
        {draggable && (
          <div
            style={{
              position: "absolute",
              top: -18,
              left: 0,
              background: "#3B82F6",
              color: "#fff",
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 3,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {id} <Move size={8} style={{ display: "inline" }} />
          </div>
        )}
        {children}
      </div>
    );
  };

  return (
    <div style={rootStyle}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: accentColor,
          zIndex: 20,
        }}
      />

      {draggable && (
        <div
          style={{
            position: "absolute",
            inset: SAFE_MARGIN,
            border: "1.5px dashed rgba(59,130,246,0.5)",
            borderRadius: 4,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -16,
              left: 0,
              fontSize: 9,
              color: "rgba(59,130,246,0.8)",
              fontFamily: "Arial",
              whiteSpace: "nowrap",
            }}
          >
            Safe print margin (8 mm)
          </span>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: 0.025,
          fontSize: 160,
          fontWeight: 900,
          letterSpacing: -8,
          zIndex: 1,
          color: isDark ? "#fff" : "#000",
        }}
      >
        GIVA
      </div>

      <Comp id="systemName">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/brand.png"
            alt="GIVA"
            crossOrigin="anonymous"
            style={{ height: 30, objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: 0.7,
                fontFamily: "Arial,sans-serif",
              }}
            >
              GIVA - Science &amp; Innovation Ecosystem
            </div>
            <div
              style={{
                fontSize: 9,
                opacity: 0.5,
                fontFamily: "Arial,sans-serif",
              }}
            >
              Official Certificate of Achievement
            </div>
          </div>
        </div>
      </Comp>

      <div
        style={{
          position: "absolute",
          right: SAFE_MARGIN + 4,
          top: CERT_H * 0.06,
          textAlign: "right",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.5,
            fontFamily: "Arial,sans-serif",
          }}
        >
          Certificate ID
        </div>
        <div
          style={{
            fontFamily: '"Courier New",monospace',
            fontSize: 11,
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          {certCode}
        </div>
      </div>

      <Comp id="awardTitle" centered>
        <div
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 700,
            color: accentColor,
            whiteSpace: "nowrap",
            letterSpacing: -0.5,
          }}
        >
          {awardLabel || "Award Title"}
        </div>
      </Comp>

      <div
        style={{
          position: "absolute",
          left: CERT_W * 0.5,
          top: CERT_H * 0.36,
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 10,
          fontSize: 11,
          letterSpacing: 5,
          textTransform: "uppercase",
          opacity: 0.55,
          fontFamily: "Arial,sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        This certifies that
      </div>

      <Comp id="recipient" centered>
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              whiteSpace: "nowrap",
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            {recipient.name || "Recipient Name"}
          </div>
          <div
            style={{
              marginTop: 14,
              height: 2,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.35)"
                : "rgba(15,23,42,0.20)",
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        </div>
      </Comp>

      <Comp id="eventName" centered>
        <div
          style={{
            textAlign: "center",
            fontSize: 14,
            opacity: 0.65,
            fontFamily: "Arial,sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {eventTitle || "Event Name"}
        </div>
      </Comp>

      <Comp id="signature">
        <div>
          <div
            style={{
              width: 160,
              borderBottom: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 700 }}>{issuerName}</div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.5,
              fontFamily: "Arial,sans-serif",
            }}
          >
            Authorized Issuer
          </div>
        </div>
      </Comp>

      <Comp id="qrDate">
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "#FFFFFF",
              padding: 8,
              borderRadius: 8,
              display: "inline-block",
              lineHeight: 0,
              border: "1px solid #E2E8F0",
            }}
          >
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR"
                width={80}
                height={80}
                style={{ display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "#94A3B8",
                  fontFamily: "Arial",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                QR
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              opacity: 0.55,
              fontFamily: "Arial,sans-serif",
            }}
          >
            {new Date(issuedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </Comp>
    </div>
  );
};

export default CertCanvas;
