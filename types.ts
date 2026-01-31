
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  headingFont: string;
  bgImage?: string;
  style: string;
  type: 'safe' | 'bold' | 'creative' | 'custom' | 'static';
}

export interface ResumeData {
  name: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: {
    id: string;
    company: string;
    position: string;
    period: string;
    description: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
  projects?: {
    id: string;
    name: string;
    description: string;
    link?: string;
  }[];
  appearance?: {
    accentColor: string;
    theme: 'light' | 'dark' | 'glass' | 'ai';
    fontFamily: string;
    activeThemeId?: string;
    bgImage?: string;
  };
}

export interface PersonaResult {
  persona: string;
  title: string;
  roast: string;
}

export interface AnalysisResult {
  data: ResumeData;
  persona: string;
  roast: string;
}

export enum AppStep {
  API_CONFIG = 'api_config',
  LANDING = 'landing',
  ANALYZING = 'analyzing',
  EDITING = 'editing',
  PUBLISHED = 'published'
}

export enum EditorTab {
  CONTENT = 'content',
  VIBES = 'vibes',
  MAGIC = 'magic'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
