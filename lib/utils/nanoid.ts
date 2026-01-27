import { nanoid } from 'nanoid';

export function generatePlanId(): string {
  return nanoid(21);
}
