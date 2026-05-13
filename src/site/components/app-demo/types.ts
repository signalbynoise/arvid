export type { MiniTeam as Team, MiniProject as Project, Step } from '../mini-demo/types';

export interface Requirement {
  id: string;
  shortId: string;
  title: string;
  owner: string;
  createdAt: string;
  completeness: number;
  clarity: 'High' | 'Medium' | 'Low';
  risk: 'Low' | 'Medium' | 'High';
  status?: string;
  implStatus?: string;
}

export interface Question {
  id: string;
  shortId: string;
  text: string;
  status: 'Answered' | 'Unanswered';
  importance: string;
  category: string;
  author: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  shortId: string;
  author: string;
  createdAt: string;
  text: string;
  isCurrent: boolean;
}

export interface Summary {
  title: string;
  shortId: string;
  objective: string;
  tags: string[];
  targetCompleteness: number;
}
