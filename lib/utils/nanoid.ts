import { nanoid } from 'nanoid';

export function generatePlanId(): string {
  return nanoid(21);
}

export function generateActivityId(): string {
  return `act_${nanoid(12)}`;
}
