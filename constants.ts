import { NavItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  { label: "About", href: "/about", description: "Our mission and vision." },
  {
    label: "Programs",
    href: "/programs",
    description: "Structured innovation pathways.",
  },
  {
    label: "Partners",
    href: "/partners",
    description: "Collaborate with the ecosystem.",
  },
  { label: "Events", href: "/events", description: "Summits and workshops." },
  {
    label: "Calendar",
    href: "/calendar",
    description: "Schedule of activities.",
  },
  { label: "Community", href: "/community", description: "Global network." },
];

export const PARTNERS = [
  "TechGlobal",
  "ScienceDirect",
  "InnovateUI",
  "FutureFunds",
  "BioLabs",
  "UniNetwork",
];

// Removed - events now from API
export const EVENTS: never[] = [];
