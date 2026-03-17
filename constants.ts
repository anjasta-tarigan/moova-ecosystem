import { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'About', href: '/about', description: 'Our mission and vision.' },
  { label: 'Programs', href: '/programs', description: 'Structured innovation pathways.' },
  { label: 'Partners', href: '/partners', description: 'Collaborate with the ecosystem.' },
  { label: 'Events', href: '/events', description: 'Summits and workshops.' },
  { label: 'Calendar', href: '/calendar', description: 'Schedule of activities.' },
  { label: 'Community', href: '/community', description: 'Global network.' },
];

export const PARTNERS = [
  "TechGlobal", "ScienceDirect", "InnovateUI", "FutureFunds", "BioLabs", "UniNetwork"
];

// Rich Event Data Model
export const EVENTS = [
  {
    id: "global-science-summit-2024",
    title: "Global Science Summit 2024",
    shortDescription: "The premier gathering for cross-border scientific collaboration and policy making.",
    fullDescription: "The Global Science Summit 2024 connects leading researchers, policymakers, and industry innovators to discuss the future of scientific infrastructure. This year's theme focuses on 'Borderless Innovation' and the mechanisms required to accelerate technology transfer in emerging markets.",
    date: "Oct 12-14, 2024",
    location: "London, UK & Virtual",
    format: "Hybrid",
    category: "Conference",
    image: "https://picsum.photos/800/600?random=10",
    status: "Open",
    eligibility: ["Researchers", "Policy Makers", "Deep Tech Founders"],
    sdgs: [9, 17],
    timeline: [
      { date: "Aug 01, 2024", title: "Early Bird Registration", desc: "Discounted tickets available." },
      { date: "Sep 15, 2024", title: "Abstract Submission Deadline", desc: "Final call for research papers." },
      { date: "Oct 12, 2024", title: "Summit Day 1", desc: "Opening Ceremony & Keynotes." }
    ],
    faqs: [
      { q: "Is virtual participation available?", a: "Yes, all keynotes will be streamed live." },
      { q: "Are there grants for students?", a: "Limited travel grants are available for PhD students." }
    ]
  },
  {
    id: "deep-tech-hackathon",
    title: "Deep Tech Hackathon: AI for Good",
    shortDescription: "A 48-hour intensive competition to solve critical challenges using artificial intelligence.",
    fullDescription: "Join 500+ developers and scientists in a sprint to build deployable AI solutions for climate resilience and healthcare. Teams will have access to proprietary datasets and mentorship from Google DeepMind and OpenAI engineers.",
    date: "Nov 05, 2024",
    location: "Berlin, DE",
    format: "In-Person",
    category: "Competition",
    image: "https://picsum.photos/800/600?random=11",
    status: "Upcoming",
    eligibility: ["Students", "Data Scientists", "Engineers"],
    sdgs: [3, 13],
    timeline: [
      { date: "Oct 01, 2024", title: "Applications Open", desc: "Team formation begins." },
      { date: "Oct 25, 2024", title: "Pre-Hack Workshop", desc: "Technical briefing and API access." },
      { date: "Nov 05, 2024", title: "Hacking Begins", desc: "48 hours of coding." }
    ],
    faqs: [
      { q: "Do I need a team?", a: "You can apply individually and be matched with a team." }
    ]
  },
  {
    id: "future-health-innovators",
    title: "Future Health Innovators Workshop",
    shortDescription: "Bridging the gap between medical research and commercial healthcare solutions.",
    fullDescription: "An intensive 3-day workshop designed for medical researchers looking to commercialize their findings. Covers IP law, regulatory pathways (FDA/EMA), and venture capital fundraising fundamentals.",
    date: "Dec 10, 2024",
    location: "Singapore",
    format: "In-Person",
    category: "Workshop",
    image: "https://picsum.photos/800/600?random=12",
    status: "Closed",
    eligibility: ["Medical Researchers", "BioTech Founders"],
    sdgs: [3],
    timeline: [
      { date: "Nov 01, 2024", title: "Registration Closes", desc: "Capacity reached." },
      { date: "Dec 10, 2024", title: "Workshop Start", desc: "Module 1: IP Strategy." }
    ],
    faqs: []
  },
   {
    id: "sustainable-cities-challenge",
    title: "Sustainable Cities Challenge",
    shortDescription: "Designing the urban infrastructure of tomorrow.",
    fullDescription: "A global open innovation challenge seeking hardware and software solutions that improve urban energy efficiency. Winners receive a $50k pilot contract with partner municipalities.",
    date: "Jan 15, 2025",
    location: "Online",
    format: "Online",
    category: "Innovation Challenge",
    image: "https://picsum.photos/800/600?random=14",
    status: "Open",
    eligibility: ["Startups", "Urban Planners", "Architects"],
    sdgs: [11, 7],
    timeline: [
      { date: "Dec 01, 2024", title: "Challenge Launch", desc: "Problem statements released." },
      { date: "Jan 15, 2025", title: "Submission Deadline", desc: "Proposal due date." },
       { date: "Feb 20, 2025", title: "Winner Announcement", desc: "Live broadcast." }
    ],
    faqs: [
       { q: "Who owns the IP?", a: "Teams retain 100% of their Intellectual Property." }
    ]
  }
];