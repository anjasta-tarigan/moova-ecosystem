import React from "react";

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  description?: string;
}

export interface SectionProps {
  id: string;
  tag: string;
  headline: string;
  subheadline: string;
  className?: string;
  children?: React.ReactNode;
  dark?: boolean;
}

export interface CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  link?: string;
}

// --- Auth & Role Types ---

export type UserRole = "SUPERADMIN" | "ADMIN" | "JUDGE" | "STUDENT";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
}
