import { AppCategory, AppData, JobData, StatData } from './types';
import { Smartphone, Code2, Download, Trophy } from 'lucide-react';

export const HERO_CONTENT = {
  name: "Cong Le",
  title: "Principal iOS Engineer",
  subtitle: "Principal iOS Engineer at Capital One. 10+ years building intuitive, high-impact mobile products.",
  blurb: "I build iOS products that are clean, fast, and genuinely useful — from enterprise banking experiences to indie utilities used by 500k+ people.",
  profileImage: "https://github.com/CongL3.png",
  email: "anniversarytrackerteamcong@gmail.com",
  appStoreLink: "https://apps.apple.com/gb/developer/cong-le/id954373766",
  githubLink: "https://github.com/CongL3",
  linkedinLink: "https://www.linkedin.com/in/cong-le-ios/",
  xLink: "https://x.com/CongLe",
};

export const STATS: StatData[] = [
  { label: "Experience", value: "10+ Years", icon: Code2, description: "iOS Engineering" },
  { label: "Apps", value: "11+", icon: Smartphone, description: "Live on App Store" },
  { label: "Downloads", value: "500k+", icon: Download, description: "Portfolio-wide" },
  { label: "Flagship", value: "250k+", icon: Trophy, description: "Anniversary Tracker" },
];

export const EXPERIENCE: JobData[] = [
  {
    id: "capone-principal",
    role: "Principal iOS Engineer",
    company: "Capital One",
    location: "Nottingham, UK",
    period: "Dec 2021 - Present",
    isCurrent: true,
    description: [
      "Leading architecture modernization across a large iOS codebase.",
      "Driving delivery across product, design, and QA in a regulated environment.",
      "Raising engineering quality through testing, CI/CD, and team standards.",
      "Mentoring engineers and shaping technical direction for long-term scalability."
    ],
    technologies: ["Swift", "SwiftUI", "UIKit", "Architecture", "CI/CD"]
  },
  {
    id: "career-break",
    role: "Career Break",
    company: "Teaching & Personal Development",
    period: "2019 - 2021",
    description: [
      "Focused on communication, mentoring, and leadership in education settings.",
      "Strengthened coaching and people skills now applied to engineering leadership."
    ],
    technologies: ["Communication", "Leadership", "Coaching"]
  },
  {
    id: "capone-senior",
    role: "Senior iOS Engineer",
    company: "Capital One",
    location: "London, UK",
    period: "2015 - 2018",
    description: [
      "Built and shipped core banking features used by large customer cohorts.",
      "Partnered across disciplines to maintain reliability and release quality."
    ],
    technologies: ["Objective-C", "Swift", "Jenkins", "TDD"]
  }
];

export const APPS: AppData[] = [
  {
    id: "anniversary",
    name: "Anniversary Tracker",
    category: AppCategory.UTILITIES,
    description: "The flagship relationship tracker for anniversaries, countdowns, and meaningful milestones.",
    downloads: "250k+",
    rating: 4.7,
    iconColor: "bg-rose-500",
    iconUrl: "/images/apps/1570714816/icon.jpg",
    isFeatured: true,
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766",
    screenshots: ["/images/apps/1570714816/screenshot-1.jpg"]
  },
  {
    id: "cardvalue",
    name: "Card Value Tracker for Pokemon",
    category: AppCategory.ENTERTAINMENT,
    description: "Track Pokémon card prices and monitor collection value in one place.",
    iconColor: "bg-yellow-500",
    iconUrl: "/images/apps/6743774763/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766",
  },
  {
    id: "kids-timer",
    name: "Kids Timer - Visual Countdown",
    category: AppCategory.PRODUCTIVITY,
    description: "Visual routine timers designed to help kids stay focused and independent.",
    iconColor: "bg-blue-500",
    iconUrl: "/images/apps/6747147301/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "sunrise",
    name: "Sunrise & Sunset Tracker",
    category: AppCategory.WEATHER,
    description: "Accurate daylight and golden-hour timing for creators and outdoor plans.",
    iconColor: "bg-amber-500",
    iconUrl: "/images/apps/6740433779/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766",
  },
  {
    id: "vidcompress",
    name: "VidCompress - Video Compressor",
    category: AppCategory.PHOTO_VIDEO,
    description: "Compress large videos quickly while keeping quality good enough to share.",
    iconColor: "bg-indigo-500",
    iconUrl: "/images/apps/6740351118/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "photo-compression",
    name: "Photo Image Compression",
    category: AppCategory.PHOTO_VIDEO,
    description: "Reduce image size to save storage and speed up sharing.",
    iconColor: "bg-purple-500",
    iconUrl: "/images/apps/6740165217/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "birthday",
    name: "Birthday Reminder & Countdowns",
    category: AppCategory.PRODUCTIVITY,
    description: "Smart birthday reminders with countdowns so important dates never slip.",
    iconColor: "bg-pink-500",
    iconUrl: "/images/apps/6739454115/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "link-saver",
    name: "Link Saver - fast and easy",
    category: AppCategory.UTILITIES,
    description: "Lightweight link manager to quickly save and organize useful URLs.",
    iconColor: "bg-emerald-500",
    iconUrl: "/images/apps/6743759106/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766",
  },
  {
    id: "lullaby",
    name: "Lullaby Pal - White Noise",
    category: AppCategory.LIFESTYLE,
    description: "Calming white noise and ambient sounds for sleep and focus.",
    iconColor: "bg-sky-500",
    iconUrl: "/images/apps/6739187522/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "learn-japanese",
    name: "Learn Japanese",
    category: AppCategory.EDUCATION,
    description: "Build Japanese vocabulary and daily language habits with bite-sized practice.",
    iconColor: "bg-red-400",
    iconUrl: "/images/apps/1637507803/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "fish-finder",
    name: "Fish Finder · AI Identifier",
    category: AppCategory.LIFESTYLE,
    description: "Identify fish species with AI and keep useful details close while outdoors.",
    iconColor: "bg-cyan-600",
    iconUrl: "/images/apps/6746223793/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "pomodoro",
    name: "Pomodoro timer: Focus",
    category: AppCategory.PRODUCTIVITY,
    description: "Simple focus sessions and breaks based on the Pomodoro method.",
    iconColor: "bg-orange-500",
    iconUrl: "/images/apps/6744445553/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  }

  ,{
    id: "to-do-list",
    name: "To Do List - One focus",
    category: AppCategory.PRODUCTIVITY,
    description: "Minimal task manager focused on one thing at a time.",
    iconColor: "bg-slate-500",
    iconUrl: "/images/apps/1633843163/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1633843163"
  },
  {
    id: "couple-days",
    name: "Couple days counter",
    category: AppCategory.LIFESTYLE,
    description: "Track relationship milestones and day counts.",
    iconColor: "bg-rose-400",
    iconUrl: "/images/apps/1634973558/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1634973558"
  },
  {
    id: "water-plants",
    name: "Water them plants",
    category: AppCategory.LIFESTYLE,
    description: "Plant care reminders and watering schedules.",
    iconColor: "bg-green-500",
    iconUrl: "/images/apps/1573313539/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1573313539"
  },
  {
    id: "run-run-run",
    name: "Run Run Run",
    category: AppCategory.ENTERTAINMENT,
    description: "Arcade runner game with fast-paced gameplay.",
    iconColor: "bg-orange-500",
    iconUrl: "/images/apps/1582701318/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1582701318"
  },
  {
    id: "fish-run",
    name: "Fish Run - Collect stars",
    category: AppCategory.ENTERTAINMENT,
    description: "Casual game: collect stars and avoid obstacles.",
    iconColor: "bg-cyan-500",
    iconUrl: "/images/apps/1580103922/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1580103922"
  },
  {
    id: "baby-kicks",
    name: "Baby Kicks: Track Movements",
    category: AppCategory.LIFESTYLE,
    description: "Track baby kick sessions with simple logs and timing.",
    iconColor: "bg-pink-400",
    iconUrl: "/images/apps/6563145060/icon.jpg",
    url: "https://apps.apple.com/gb/app/id6563145060"
  },
  {
    id: "simple-timer",
    name: "Simple Timer & Stopwatch Clock",
    category: AppCategory.PRODUCTIVITY,
    description: "Simple timer and stopwatch utility.",
    iconColor: "bg-blue-400",
    iconUrl: "/images/apps/6737737475/icon.jpg",
    url: "https://apps.apple.com/gb/app/id6737737475"
  },
  {
    id: "othello",
    name: "Othello - TEAMCONG",
    category: AppCategory.ENTERTAINMENT,
    description: "Classic strategy board game implementation.",
    iconColor: "bg-neutral-600",
    iconUrl: "/images/apps/1590705319/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1590705319"
  },
  {
    id: "solitaire",
    name: "Solitaire - TEAMCONG",
    category: AppCategory.ENTERTAINMENT,
    description: "Classic solitaire card game for quick sessions.",
    iconColor: "bg-emerald-600",
    iconUrl: "/images/apps/1582328906/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1582328906"
  }
];