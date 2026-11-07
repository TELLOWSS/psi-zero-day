import {describe,it,expect} from 'vitest';
import concept from '../content/art/omega-prototype-8dir-v0.json';
import {OMEGA_DIRECTIONS,OMEGA_ART_CONTRACT} from '../src/ui/omega-operator-motion';

describe('OMEGA visual release gating must not confuse concept art with playable animation',()=>{
 it('has exactly 8 named direction candidates in engine order',()=>{
   expect(concept.directions.map(view=>view.id)).toEqual([...OMEGA_DIRECTIONS]);
   expect(new Set(concept.directions.map(view=>view.id)).size).toBe(8);
   expect(concept.candidateAtlas.width/concept.candidateAtlas.columns).toBe(384);
   expect(concept.candidateAtlas.height).toBe(512);
 });
 it('blocks a mirrored direction and an unapproved atlas from runtime selection',()=>{
   expect(concept.status).toBe('CONCEPT_REVIEW_ONLY');
   expect(concept.approvedForGameplay).toBe(false);
   expect(concept.directions.some(view=>view.mirrored)).toBe(true);
   expect(concept.directions.find(view=>view.id==='NE')?.status).toBe('REQUIRES_NEW_REAR_RIGHT_ART');
   expect(concept.directions.every(view=>view.status==='APPROVED')).toBe(false);
 });
 it('requires real authored motion, not a one-frame direction-only turntable',()=>{
   expect(concept.candidateAtlas.rows).toBe(1);
   expect(OMEGA_ART_CONTRACT.contactFramesPerDirection).toBeGreaterThan(concept.candidateAtlas.rows);
   expect(concept.requiredForGameplay).toContain('8x6 transparent locomotion contact atlas');
   expect(concept.canonicalMainArt).toBe('/assets/reignition/veteran-return.webp');
 });
});
