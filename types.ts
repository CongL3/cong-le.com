import { LucideIcon } from "lucide-react";

export enum AppCategory {
  UTILITIES = 'Utilities',
  PHOTO_VIDEO = 'Photo & Video',
  PRODUCTIVITY = 'Productivity',
  FINANCE = 'Finance',
  ENTERTAINMENT = 'Entertainment',
  LIFESTYLE = 'Lifestyle',
  EDUCATION = 'Education',
  WEATHER = 'Weather'
}

export interface AppData {
  id: string;
  name: string;
  category: AppCategory;
  description: string;
  downloads?: string;
  rating?: number;
  iconColor: string;
  iconUrl?: string;
  isFeatured?: boolean;
  /** False when the listing is no longer available for download. */
  available?: boolean;
  /** False when the listing is intentionally omitted from acquisition UI. */
  promotable?: boolean;
  url?: string;
  /** Concrete Google Play listing when this app is also released on Android. */
  googlePlayUrl?: string;
  landingPage?: string;
  /** Optional high-intent Pocket Grove page for apps with a verified focused page. */
  focusedPage?: string;
  screenshots?: string[];
}

export interface JobData {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  description: string[];
  technologies: string[];
  isCurrent?: boolean;
}

export interface StatData {
  label: string;
  value: string;
  icon: LucideIcon;
  description?: string;
}
