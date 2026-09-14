import { describe, expect, it } from 'vitest';
import { projectCharacterGrowth } from '../src/app/character-growth';
import { projectCharacterLoadout } from '../src/app/character-loadout';
import { completedTraining } from '../src/app/training';
import { playEpisode } from './helpers/episode01-playthrough';

const base = {
  plan: 'follow_junho' as const,
  signal: 'listen_more' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
};

describe('TASK-010B training, inventory and equipment', () => {
  it('reinforced reporting trains Junho, grants and equips his radio without aging him', () => {
    const { state } = playEpisode({ ...base, evening: 'rest' });
    expect(state.flags).toMatchObject({
      'training.lim_junho.reporting': true,
      'growth.lim_junho': 'focused',
      'inventory.lim_junho.item.site_radio': true,
      'equipment.lim_junho.communication': 'item.site_radio',
    });

    const growth = projectCharacterGrowth(state.flags, 'lim_junho')!;
    const loadout = projectCharacterLoadout(state.flags, 'lim_junho')!;
    expect(growth.stage).toBe('focused');
    expect(growth.age_visual_change).toBe(false);
    expect(completedTraining(state.flags, 'lim_junho')?.training_id).toBe('training.lim_junho.reporting');
    expect(loadout.inventory.map(item => item.item_id)).toEqual(expect.arrayContaining(['item.beginner_toolbox', 'item.site_radio']));
    expect(loadout.equipped.find(item => item.slot === 'communication')?.item_id).toBe('item.site_radio');
  });

  it('evening study grants the camera and lets the player explicitly equip it', () => {
    const { state } = playEpisode({ ...base, evening: 'study', equipment: 'training_equip_camera' });
    expect(state.flags).toMatchObject({
      'training.player.site_basics': true,
      'growth.player': 'focused',
      'inventory.player.item.inspection_camera': true,
      'equipment.player.secondary_tool': 'item.inspection_camera',
      'equipment.player.last_choice': 'camera',
    });

    const training = completedTraining(state.flags, 'player')!;
    const loadout = projectCharacterLoadout(state.flags, 'player')!;
    expect(training.training_id).toBe('training.player.site_basics');
    expect(loadout.inventory.map(item => item.item_id)).toEqual(expect.arrayContaining(['item.safety_tablet', 'item.inspection_camera']));
    expect(loadout.equipped.find(item => item.slot === 'secondary_tool')?.item_id).toBe('item.inspection_camera');
  });

  it('can keep the current loadout while retaining the earned camera in inventory', () => {
    const { state } = playEpisode({ ...base, evening: 'study', equipment: 'training_keep_loadout' });
    expect(state.flags['training.player.site_basics']).toBe(true);
    expect(state.flags['inventory.player.item.inspection_camera']).toBe(true);
    expect(state.flags['equipment.player.last_choice']).toBe('keep');
    expect(state.flags['equipment.player.secondary_tool']).toBeUndefined();

    const loadout = projectCharacterLoadout(state.flags, 'player')!;
    expect(loadout.inventory.some(item => item.item_id === 'item.inspection_camera')).toBe(true);
  });

  it('does not grant player training rewards when the player rests instead', () => {
    const { state } = playEpisode({ ...base, evening: 'rest' });
    expect(state.flags['training.player.site_basics']).toBeUndefined();
    expect(state.flags['inventory.player.item.inspection_camera']).toBeUndefined();
    expect(state.flags['equipment.player.secondary_tool']).toBeUndefined();
  });
});
