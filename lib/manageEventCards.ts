export type ManageEventCardKey =
  | "configuration"
  | "faqs"
  | "criteria"
  | "timeline"
  | "rules"
  | "resources"
  | "community"
  | "participants"
  | "judges"
  | "stages"
  | "awards";

export const MANAGE_EVENT_CARDS: Array<{
  key: ManageEventCardKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: "configuration",
    title: "Event Configuration",
    subtitle: "Core event profile, schedule, taxonomy, and eligibility.",
  },
  {
    key: "faqs",
    title: "FAQs",
    subtitle: "Frequently asked questions for participants.",
  },
  {
    key: "criteria",
    title: "Judging & Grading Criteria",
    subtitle: "Scoring metrics and percentage weights.",
  },
  {
    key: "timeline",
    title: "Timeline",
    subtitle: "Milestones and important event dates.",
  },
  {
    key: "rules",
    title: "Rules & Eligibility",
    subtitle: "Policy and rulebook details for participants.",
  },
  {
    key: "resources",
    title: "Resources & Downloads",
    subtitle: "Upload and publish participant assets.",
  },
  {
    key: "community",
    title: "Event Community (Q&A)",
    subtitle: "Monitor event threads and discussion activity.",
  },
  {
    key: "participants",
    title: "Participant & Team",
    subtitle: "Track registrations and team composition.",
  },
  {
    key: "judges",
    title: "Judge Assignment",
    subtitle: "Assign judges by category and stage.",
  },
  {
    key: "stages",
    title: "Competition Stages",
    subtitle: "Configure Abstract, Paper, and Final windows.",
  },
  {
    key: "awards",
    title: "Awards & Recognition",
    subtitle: "Enable awards and define winner tiers.",
  },
];

export const getCardMeta = (key?: string) =>
  MANAGE_EVENT_CARDS.find((item) => item.key === key);
