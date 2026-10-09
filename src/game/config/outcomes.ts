import type { OutcomeReason } from '../core/models';

export interface OutcomeText {
  title: string;
  message: string;
}

export const OUTCOMES: Readonly<Record<OutcomeReason, OutcomeText>> = {
  burnout: {
    title: 'BURNOUT',
    message: 'Your stress hit 100. You need a long vacation away from the WiFi.',
  },
  fired: {
    title: 'YOU’RE FIRED',
    message: 'Your reputation reached zero. The client found someone else.',
  },
  evicted: {
    title: 'EVICTED',
    message: 'You could not pay the rent. Time to find a cheaper apartment.',
  },
  'week-survived': {
    title: 'WEEK SURVIVED',
    message: 'Rent paid, baby happy, client satisfied. You beat remote life — for now.',
  },
};
