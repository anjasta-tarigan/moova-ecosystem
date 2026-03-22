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
    description: "Deep navy & gold — elegant official look",
    bg: "linear-gradient(160deg,#0A1628 0%,#132347 50%,#0D1B3E 100%)",
    bgColor: "#0A1628",
    textColor: "#E8EDF5",
    accentColor: "#D4A843",
    fontFamily: '"Playfair Display",Georgia,"Times New Roman",serif',
    borderStyle: "none",
  },
  {
    id: "modern",
    label: "Modern",
    description: "White with blue accent — clean & professional",
    bg: "#FFFFFF",
    bgColor: "#FFFFFF",
    textColor: "#0F172A",
    accentColor: "#1D4ED8",
    fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
    borderStyle: "none",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Warm grey — understated elegance",
    bg: "linear-gradient(180deg,#FAFAF9 0%,#F5F5F4 100%)",
    bgColor: "#FAFAF9",
    textColor: "#1C1917",
    accentColor: "#78716C",
    fontFamily: '"Helvetica Neue",Arial,sans-serif',
    borderStyle: "none",
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
  qrDataUrl?: string;
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
  qrDataUrl: qrDataUrlProp,
}) => {
  const verifyUrl = `${window.location.origin}/#/verify/${certCode}`;
  const qrUrlHook = useQR(qrDataUrlProp ? "" : verifyUrl);
  const qrUrl = qrDataUrlProp || qrUrlHook;
  const tpl = template ?? getTemplate(design.templateId);

  const accentColor = tpl.accentColor;
  const textColor = tpl.textColor;
  const fontFamily = tpl.fontFamily;
  const isDark = tpl.id === "formal";
  const isModern = tpl.id === "modern";
  const isMinimal = tpl.id === "minimal";

  const awardLabel =
    recipient.awardType === "CUSTOM"
      ? (recipient.customTitle ?? "")
      : recipient.awardType === "WINNER"
        ? `${recipient.rankLabel ?? "1st Place"} — Winner`
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
    border: tpl.borderStyle,
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
      {/* ── FORMAL TEMPLATE DECORATIONS ── */}
      {isDark && design.mode === "builtin" && (
        <>
          {/* Top accent bar with gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${accentColor} 0%, #B8860B 50%, ${accentColor} 100%)`,
              zIndex: 20,
            }}
          />
          {/* Bottom accent bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${accentColor} 0%, #B8860B 50%, ${accentColor} 100%)`,
              zIndex: 20,
            }}
          />
          {/* Inner border frame */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              right: 18,
              bottom: 18,
              border: `1.5px solid ${accentColor}40`,
              borderRadius: 2,
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
          {/* Corner geometric accents */}
          {[
            { top: 18, left: 18 },
            { top: 18, right: 18 },
            { bottom: 18, left: 18 },
            { bottom: 18, right: 18 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: 36,
                height: 36,
                zIndex: 6,
                pointerEvents: "none",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36">
                <path
                  d={
                    i === 0
                      ? "M0 0 L18 0 L18 3 L3 3 L3 18 L0 18 Z"
                      : i === 1
                        ? "M18 0 L36 0 L36 18 L33 18 L33 3 L18 3 Z"
                        : i === 2
                          ? "M0 18 L3 18 L3 33 L18 33 L18 36 L0 36 Z"
                          : "M18 33 L33 33 L33 18 L36 18 L36 36 L18 36 Z"
                  }
                  fill={accentColor}
                  opacity="0.6"
                />
              </svg>
            </div>
          ))}
          {/* Subtle rosette watermark */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              opacity: 0.03,
              zIndex: 1,
            }}
          >
            <svg width="400" height="400" viewBox="0 0 400 400">
              <circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="#D4A843"
                strokeWidth="0.5"
              />
              <circle
                cx="200"
                cy="200"
                r="150"
                fill="none"
                stroke="#D4A843"
                strokeWidth="0.3"
              />
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke="#D4A843"
                strokeWidth="0.3"
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={200 + 120 * Math.cos(angle)}
                    y1={200 + 120 * Math.sin(angle)}
                    x2={200 + 180 * Math.cos(angle)}
                    y2={200 + 180 * Math.sin(angle)}
                    stroke="#D4A843"
                    strokeWidth="0.3"
                  />
                );
              })}
            </svg>
          </div>
        </>
      )}

      {/* ── MODERN TEMPLATE DECORATIONS ── */}
      {isModern && design.mode === "builtin" && (
        <>
          {/* Top accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: `linear-gradient(90deg, #1D4ED8 0%, #3B82F6 50%, #1D4ED8 100%)`,
              zIndex: 20,
            }}
          />
          {/* Left geometric stripe */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: "100%",
              background: `linear-gradient(180deg, ${accentColor}08 0%, ${accentColor}03 100%)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          {/* Right side accent geometric shape */}
          <svg
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: 200,
              zIndex: 2,
              pointerEvents: "none",
            }}
            viewBox="0 0 200 794"
            preserveAspectRatio="none"
          >
            <path
              d="M160 0 L200 0 L200 794 L160 794 Z"
              fill={`${accentColor}05`}
            />
            <path
              d="M180 0 L200 0 L200 794 L180 794 Z"
              fill={`${accentColor}04`}
            />
          </svg>
          {/* Subtle grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(${accentColor}06 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* ── MINIMAL TEMPLATE DECORATIONS ── */}
      {isMinimal && design.mode === "builtin" && (
        <>
          {/* Thin top accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: "#A8A29E",
              zIndex: 20,
            }}
          />
          {/* Subtle inner border */}
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 24,
              right: 24,
              bottom: 24,
              border: "1px solid #E7E5E4",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        </>
      )}

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

      {/* ── SYSTEM NAME ── */}
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
                letterSpacing: 3,
                textTransform: "uppercase",
                opacity: isDark ? 0.5 : 0.45,
                fontFamily: '"Inter",Arial,sans-serif',
              }}
            >
              GIVA — Science &amp; Innovation Ecosystem
            </div>
            <div
              style={{
                fontSize: 9,
                opacity: 0.35,
                fontFamily: '"Inter",Arial,sans-serif',
                marginTop: 2,
              }}
            >
              Official Certificate of Achievement
            </div>
          </div>
        </div>
      </Comp>

      {/* Certificate ID badge (top-right) */}
      <div
        style={{
          position: "absolute",
          right: SAFE_MARGIN + 8,
          top: CERT_H * 0.06,
          textAlign: "right",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.35,
            fontFamily: '"Inter",Arial,sans-serif',
          }}
        >
          Certificate ID
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono","Courier New",monospace',
            fontSize: 11,
            fontWeight: 600,
            opacity: isDark ? 0.6 : 0.7,
            marginTop: 2,
          }}
        >
          {certCode}
        </div>
      </div>

      {/* ── AWARD TITLE ── */}
      <Comp id="awardTitle" centered>
        <div style={{ textAlign: "center" }}>
          {/* Decorative line above */}
          <div
            style={{
              width: 50,
              height: 1,
              backgroundColor: accentColor,
              opacity: 0.5,
              margin: "0 auto 14px",
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: accentColor,
              whiteSpace: "nowrap",
              letterSpacing: isDark ? 1 : -0.5,
              lineHeight: 1.1,
            }}
          >
            {awardLabel || "Award Title"}
          </div>
        </div>
      </Comp>

      {/* "This certifies that" label */}
      <div
        style={{
          position: "absolute",
          left: CERT_W * 0.5,
          top: CERT_H * 0.36,
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 10,
          fontSize: 10,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: 0.4,
          fontFamily: '"Inter",Arial,sans-serif',
          whiteSpace: "nowrap",
        }}
      >
        This certifies that
      </div>

      {/* ── RECIPIENT NAME ── */}
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
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: isDark ? 1 : -1,
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
              height: isDark ? 1 : 2,
              background: isDark
                ? `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`
                : `linear-gradient(90deg, transparent, rgba(15,23,42,0.15), transparent)`,
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        </div>
      </Comp>

      {/* ── EVENT NAME ── */}
      <Comp id="eventName" centered>
        <div
          style={{
            textAlign: "center",
            fontSize: 14,
            opacity: 0.55,
            fontFamily: '"Inter",Arial,sans-serif',
            whiteSpace: "nowrap",
          }}
        >
          {eventTitle || "Event Name"}
        </div>
      </Comp>

      {/* ── SIGNATURE ── */}
      <Comp id="signature">
        <div>
          <div
            style={{
              width: 160,
              borderBottom: `1px solid ${isDark ? accentColor + "40" : "#CBD5E1"}`,
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 700 }}>{issuerName}</div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 3,
              textTransform: "uppercase",
              opacity: 0.4,
              fontFamily: '"Inter",Arial,sans-serif',
              marginTop: 2,
            }}
          >
            Authorized Issuer
          </div>
        </div>
      </Comp>

      {/* ── QR + DATE ── */}
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
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR"
                crossOrigin="anonymous"
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
              opacity: 0.45,
              fontFamily: '"Inter",Arial,sans-serif',
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
