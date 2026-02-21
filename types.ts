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
  url?: string;
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