import type { MeetingTemplate } from '../core/models';

export interface TaskTemplate {
  title: string;
  type: string;
}

export const TASK_TEMPLATES: readonly TaskTemplate[] = [
  { title: 'Write component', type: 'Code' },
  { title: 'Fix checkout bug', type: 'Bug' },
  { title: 'Reply to client', type: 'Email' },
  { title: 'Design landing page', type: 'Design' },
  { title: 'Review pull request', type: 'Review' },
  { title: 'Update API docs', type: 'Docs' },
  { title: 'Optimize images', type: 'Perf' },
];

/** One meeting per day, cycling through this list. */
export const MEETING_TEMPLATES: readonly MeetingTemplate[] = [
  {
    title: 'Sprint sync',
    briefing: 'Remember: the client asked for a',
    keyFact: 'blue onboarding page',
    dialogue: 'Let’s keep the blue onboarding page approachable.',
    question: 'What color did the client request for onboarding?',
    options: ['Red', 'Blue', 'Green'],
    answerIndex: 1,
  },
  {
    title: 'Client check-in',
    briefing: 'The launch date was moved to',
    keyFact: 'Friday',
    dialogue: 'So we are all aligned on shipping this Friday.',
    question: 'When is the new launch date?',
    options: ['Monday', 'Wednesday', 'Friday'],
    answerIndex: 2,
  },
  {
    title: 'Design review',
    briefing: 'The approved logo uses a',
    keyFact: 'rounded font',
    dialogue: 'The rounded font feels friendlier for our users.',
    question: 'Which font style was approved for the logo?',
    options: ['Rounded', 'Serif', 'Monospace'],
    answerIndex: 0,
  },
  {
    title: 'Retrospective',
    briefing: 'Last sprint the main blocker was',
    keyFact: 'slow code reviews',
    dialogue: 'We really need to speed up code reviews this time.',
    question: 'What was the main blocker last sprint?',
    options: ['Server costs', 'Slow code reviews', 'Too many meetings'],
    answerIndex: 1,
  },
];

export interface MarketEffects {
  meals?: number;
  energy?: number;
  stress?: number;
  food?: number;
  baby?: number;
}

export interface MarketItem {
  id: string;
  label: string;
  description: string;
  price: number;
  effects: MarketEffects;
}

export const MARKET_ITEMS: readonly MarketItem[] = [
  {
    id: 'groceries',
    label: 'Groceries',
    description: '+3 meals in the fridge.',
    price: 40,
    effects: { meals: 3 },
  },
  {
    id: 'delivery',
    label: 'Food delivery',
    description: 'Instant +40 food.',
    price: 18,
    effects: { food: 40 },
  },
  {
    id: 'coffee',
    label: 'Cold brew',
    description: '+12 energy, +2 stress.',
    price: 6,
    effects: { energy: 12, stress: 2 },
  },
  {
    id: 'meditation',
    label: 'Meditation app',
    description: '-15 stress.',
    price: 12,
    effects: { stress: -15 },
  },
  {
    id: 'mobile',
    label: 'Baby mobile',
    description: 'Baby needs +25.',
    price: 35,
    effects: { baby: 25 },
  },
];
