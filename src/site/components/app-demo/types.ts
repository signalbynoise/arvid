export interface ProjectChild {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface Project {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: ProjectChild[];
}

export interface Requirement {
  id: string;
  title: string;
  owner: string;
  completeness: number;
  clarity: 'High' | 'Medium' | 'Low';
  risk: 'Low' | 'Medium' | 'High';
}

export interface Question {
  id: string;
  text: string;
  status: 'Answered' | 'Unanswered';
  importance: string;
  category: string;
}

export interface Answer {
  id: string;
  author: string;
  date: string;
  text: string;
  isCurrent: boolean;
}

export interface Summary {
  title: string;
  objective: string;
  tags: string[];
  targetCompleteness: number;
}

export interface Step {
  action: string;
  delay: number;
}
