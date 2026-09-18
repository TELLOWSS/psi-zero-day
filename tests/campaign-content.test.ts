import { describe, expect, it } from 'vitest';
import { createCampaignRegistry } from '../src/content/campaign';

describe('Campaign content registry', () => {
  it('keeps Episode 01 intact and adds the formal Episode 02 opening slice', () => {
    const content = createCampaignRegistry().getValidatedContent();
    expect(content.events).toHaveLength(28);
    expect(content.events.some(event => event.event_id === 'e02_01_lift_route_pressure')).toBe(true);
    expect(content.events.some(event => event.event_id === 'e02_02_lift_route_return')).toBe(true);
  });

  it('starts Day 02 only after the Episode 01 next-day checkpoint', () => {
    const first = createCampaignRegistry().getEvent('e02_01_lift_route_pressure');
    expect(first?.conditions).toContainEqual({ kind: 'event_completed', event_id: 'e01_10_next_day_tease', minimum_count: 1 });
  });
});
