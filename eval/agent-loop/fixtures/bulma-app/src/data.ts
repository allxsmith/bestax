export interface Feature {
  title: string;
  body: string;
  tags: string[];
}

export const FEATURES: Feature[] = [
  {
    title: 'Weekly reports',
    body: 'Every Monday, a one-page summary of what moved, what stalled and why.',
    tags: ['Email', 'PDF'],
  },
  {
    title: 'Alerts that matter',
    body: 'Thresholds on any metric, routed to the person who owns it.',
    tags: ['Slack', 'Email'],
  },
  {
    title: 'Goals',
    body: 'Set a target, see the trend, and know early when a goal is slipping.',
    tags: ['Quarterly', 'Team'],
  },
];

export interface Plan {
  name: string;
  seats: string;
  reports: string;
  monthly: number;
}

export const PLANS: Plan[] = [
  { name: 'Starter', seats: 'Up to 5', reports: 'Weekly', monthly: 19 },
  { name: 'Team', seats: 'Up to 25', reports: 'Daily', monthly: 79 },
  { name: 'Business', seats: 'Unlimited', reports: 'Real time', monthly: 199 },
];

export const STATS = [
  { label: 'Teams', value: '3,456' },
  { label: 'Reports sent', value: '1.2M' },
  { label: 'Alerts routed', value: '48K' },
];

export interface Member {
  name: string;
  role: string;
  bio: string;
}

export const TEAM: Member[] = [
  {
    name: 'Maya Chen',
    role: 'Co-founder, product',
    bio: 'Spent eight years building analytics nobody opened, and started Lumen to fix that.',
  },
  {
    name: 'Tomás Reyes',
    role: 'Co-founder, engineering',
    bio: 'Runs the pipeline that turns raw events into the numbers in your Monday report.',
  },
];
