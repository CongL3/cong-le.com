import { AppCategory, AppData, JobData, StatData } from './types';
import { Smartphone, Code2, Download, Trophy } from 'lucide-react';

export const HERO_CONTENT = {
  name: "Cong Le",
  title: "Principal iOS Engineer · Capital One",
  subtitle: "I architect large-scale iOS systems by day and ship indie apps to 500k+ users by night.",
  blurb: "11+ years deep in iOS — from leading architecture modernization on a regulated banking app to building and launching 20+ indie apps on the App Store. I operate across the full stack of product engineering: system design, delivery, developer experience, and growth.",
  signalSentence: "I own the technical direction of a banking iOS platform and independently built a portfolio that crossed half a million downloads.",
  strengths: [
    "Defining and evolving mobile architecture for large, long-lived codebases",
    "Shipping end-to-end — from system design through App Store release",
    "Bridging engineering, product, and design in regulated environments",
    "Building reusable infrastructure that compounds across teams and projects",
    "Turning side projects into real products with real retention",
  ],
  profileImage: "https://github.com/CongL3.png",
  email: "support@cong-le.com",
  appStoreLink: "https://apps.apple.com/gb/developer/cong-le/id954373766",
  githubLink: "https://github.com/CongL3",
  linkedinLink: "https://www.linkedin.com/in/cong-le-ios/",
  xLink: "https://x.com/CongLe",
};

export const STATS: StatData[] = [
  { label: "Experience", value: "11+ Years", icon: Code2, description: "iOS Engineering" },
  { label: "Apps", value: "20+", icon: Smartphone, description: "Live on App Store" },
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
    screenshots: [
      "/images/apps/1570714816/screenshot-1.jpg",
      "/images/apps/1570714816/screenshot-2.jpg",
      "/images/apps/1570714816/screenshot-3.jpg",
      "/images/apps/1570714816/screenshot-4.jpg",
    ]
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
    url: "/apps/kids-timer/"
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
    url: "/apps/birthday-reminder/"
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
    url: "/apps/lullaby-pal/"
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
    url: "/apps/fish-finder/"
  },
  {
    id: "pomodoro",
    name: "Pomodoro timer: Focus",
    category: AppCategory.PRODUCTIVITY,
    description: "Simple focus sessions and breaks based on the Pomodoro method.",
    iconColor: "bg-orange-500",
    iconUrl: "/images/apps/6744445553/icon.jpg",
    url: "https://apps.apple.com/gb/developer/cong-le/id954373766"
  },
  {
    id: "to-do-list",
    name: "To Do List - One focus",
    category: AppCategory.PRODUCTIVITY,
    description: "Minimal task manager focused on one thing at a time.",
    iconColor: "bg-slate-500",
    iconUrl: "/images/apps/1633843163/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1633843163",
    screenshots: [
      "/images/apps/1633843163/screenshot-1.jpg",
      "/images/apps/1633843163/screenshot-2.jpg",
      "/images/apps/1633843163/screenshot-3.jpg",
      "/images/apps/1633843163/screenshot-4.jpg",
      "/images/apps/1633843163/screenshot-5.jpg",
    ]
  },
  {
    id: "couple-days",
    name: "Couple days counter",
    category: AppCategory.LIFESTYLE,
    description: "Track relationship milestones and day counts.",
    iconColor: "bg-rose-400",
    iconUrl: "/images/apps/1634973558/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1634973558",
    screenshots: [
      "/images/apps/1634973558/screenshot-1.jpg",
      "/images/apps/1634973558/screenshot-2.jpg",
      "/images/apps/1634973558/screenshot-3.jpg",
      "/images/apps/1634973558/screenshot-4.jpg",
      "/images/apps/1634973558/screenshot-5.jpg",
    ]
  },
  {
    id: "water-plants",
    name: "Water them plants",
    category: AppCategory.LIFESTYLE,
    description: "Plant care reminders and watering schedules.",
    iconColor: "bg-green-500",
    iconUrl: "/images/apps/1573313539/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1573313539",
    screenshots: [
      "/images/apps/1573313539/screenshot-1.jpg",
      "/images/apps/1573313539/screenshot-2.jpg",
      "/images/apps/1573313539/screenshot-3.jpg",
    ]
  },
  {
    id: "run-run-run",
    name: "Run Run Run",
    category: AppCategory.ENTERTAINMENT,
    description: "Arcade runner game with fast-paced gameplay.",
    iconColor: "bg-orange-500",
    iconUrl: "/images/apps/1582701318/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1582701318",
    screenshots: [
      "/images/apps/1582701318/screenshot-1.jpg",
      "/images/apps/1582701318/screenshot-2.jpg",
      "/images/apps/1582701318/screenshot-3.jpg",
      "/images/apps/1582701318/screenshot-4.jpg",
    ]
  },
  {
    id: "fish-run",
    name: "Fish Run - Collect stars",
    category: AppCategory.ENTERTAINMENT,
    description: "Casual game: collect stars and avoid obstacles.",
    iconColor: "bg-cyan-500",
    iconUrl: "/images/apps/1580103922/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1580103922",
    screenshots: [
      "/images/apps/1580103922/screenshot-1.jpg",
      "/images/apps/1580103922/screenshot-2.jpg",
      "/images/apps/1580103922/screenshot-3.jpg",
      "/images/apps/1580103922/screenshot-4.jpg",
    ]
  },
  {
    id: "baby-kicks",
    name: "Baby Kicks: Track Movements",
    category: AppCategory.LIFESTYLE,
    description: "Track baby kick sessions with simple logs and timing.",
    iconColor: "bg-pink-400",
    iconUrl: "/images/apps/6563145060/icon.jpg",
    url: "https://apps.apple.com/gb/app/id6563145060",
    screenshots: [
      "/images/apps/6563145060/screenshot-1.jpg",
      "/images/apps/6563145060/screenshot-2.jpg",
      "/images/apps/6563145060/screenshot-3.jpg",
      "/images/apps/6563145060/screenshot-4.jpg",
      "/images/apps/6563145060/screenshot-5.jpg",
    ]
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
    url: "https://apps.apple.com/gb/app/id1590705319",
    screenshots: [
      "/images/apps/1590705319/screenshot-1.jpg",
      "/images/apps/1590705319/screenshot-2.jpg",
      "/images/apps/1590705319/screenshot-3.jpg",
    ]
  },
  {
    id: "solitaire",
    name: "Solitaire - TEAMCONG",
    category: AppCategory.ENTERTAINMENT,
    description: "Classic solitaire card game for quick sessions.",
    iconColor: "bg-emerald-600",
    iconUrl: "/images/apps/1582328906/icon.jpg",
    url: "https://apps.apple.com/gb/app/id1582328906",
    screenshots: [
      "/images/apps/1582328906/screenshot-1.jpg",
      "/images/apps/1582328906/screenshot-2.jpg",
      "/images/apps/1582328906/screenshot-3.jpg",
    ]
  }
  ,{
    id: "baby-names",
    name: "Baby Names: Swipe & Pick",
    category: AppCategory.LIFESTYLE,
    description: "Swipe through 10,000+ baby names from 60+ cultural origins. Match with your partner and find names you both love.",
    iconColor: "bg-pink-500",
    iconUrl: "/apps/baby-names/images/app-icon.png",
    url: "/apps/baby-names/",
  },
  {
    id: "coloring",
    name: "Coloring Book for Kids",
    category: AppCategory.ENTERTAINMENT,
    description: "Easy-to-use coloring app for children with bundled line-art pages, brush/fill tools. Fully offline.",
    iconColor: "bg-violet-500",
    iconUrl: "/apps/coloring/images/app-icon.png",
    url: "/apps/coloring/",
  },
  {
    id: "bible-prayer-companion",
    name: "Bible Prayer Companion",
    category: AppCategory.EDUCATION,
    description: "Daily Scripture Companion is a quiet, offline prayer and Scripture app built for simple daily consistency.",
    iconColor: "bg-red-400",
    iconUrl: "/images/apps/6759859294/icon.jpg",
    url: "/apps/bible-prayer/",
  }
  ,{
    id: "carddex-tcg-scanner-price",
    name: "CardDex: TCG Scanner & Price",
    category: AppCategory.UTILITIES,
    description: "Your Ultimate Pokemon Card Collecting Companion",
    iconColor: "bg-blue-500",
    iconUrl: "/images/apps/6743774763/icon.jpg",
    url: "https://apps.apple.com/gb/app/carddex-tcg-scanner-price/id6743774763?uo=4",
  }
  ,{
    id: "poop-tracker-gut-health",
    name: "Poop Tracker & Gut Health",
    category: AppCategory.LIFESTYLE,
    description: "Track your gut health in seconds.",
    iconColor: "bg-rose-400",
    iconUrl: "/images/apps/6760222884/icon.jpg",
    url: "https://apps.apple.com/gb/app/poop-tracker-gut-health/id6760222884?uo=4",
  }
  ,{
    id: "kids-coloring-book-draw",
    name: "Kids Coloring Book & Draw",
    category: AppCategory.EDUCATION,
    description: "Colour, draw, and create with a kids-first colouring app.",
    iconColor: "bg-red-400",
    iconUrl: "/images/apps/6759912464/icon.jpg",
    url: "https://apps.apple.com/gb/app/kids-coloring-book-draw/id6759912464?uo=4",
  }
  ,{
    id: "",
    name: "お返し - 内祝い・香典返し管理",
    category: AppCategory.UTILITIES,
    description: "結婚・出産・香典・快気祝いなど、日本の贈答マナーに沿ったお返しの期限と金額を自動計算。",
    iconColor: "bg-blue-500",
    iconUrl: "/images/apps/6760551450/icon.jpg",
    url: "https://apps.apple.com/gb/app/%E3%81%8A%E8%BF%94%E3%81%97-%E5%86%85%E7%A5%9D%E3%81%84-%E9%A6%99%E5%85%B8%E8%BF%94%E3%81%97%E7%AE%A1%E7%90%86/id6760551450?uo=4",
  }
];
