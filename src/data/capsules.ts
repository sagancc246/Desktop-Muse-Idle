export interface CapsuleDefinition {
  id: string;
  name: string;
  description: string;
}

export const capsules: CapsuleDefinition[] = [
  {
    id: 'muse_capsule',
    name: 'Muse Capsule',
    description: 'A future cosmetic capsule reward used by stage and skin unlock masters.',
  },
  {
    id: 'noir_gothic',
    name: 'Noir Gothic Capsule Ticket',
    description: 'A placeholder capsule target for Noir Gothic until capsule opening is implemented.',
  },
  {
    id: 'vega_bumper',
    name: 'Vega Bumper Capsule Ticket',
    description: 'A placeholder capsule target for Vega Bumper until capsule opening is implemented.',
  },
];

export function getCapsuleById(capsuleId: string): CapsuleDefinition | undefined {
  return capsules.find((capsule) => capsule.id === capsuleId);
}
