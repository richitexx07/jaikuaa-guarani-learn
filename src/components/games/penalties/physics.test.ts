import { describe, expect, it } from 'vitest';
import { duelFinished, G, KEEPER_DIVES, powerZone, resolveShot, xpFor } from './physics';
describe('Penales',()=>{
 it.each([
  ['left-high',220,155],['center-high',400,155],['right-high',580,155],
  ['left',220,290],['center',400,290],['right',580,290],
 ] as const)('lets the local keeper save the matching target %s',(dive,x,y)=>{
  expect(KEEPER_DIVES).toContain(dive);
  for(const knew of [true,false])for(const now of [0,170,460,900]){
   expect(resolveShot({x,y},.7,knew,now,false,dive).outcome).toBe('save');
  }
 });
 it('does not save a high shot with a low pick, or a low shot with a high pick',()=>{
  expect(resolveShot({x:400,y:155},.7,true,0,false,'center').outcome).toBe('goal');
  expect(resolveShot({x:400,y:290},.7,true,0,false,'center-high').outcome).toBe('goal');
 });
 it('does not save a high shot when the keeper picks the wrong side',()=>{
  expect(resolveShot({x:G.x+70,y:G.y+45},.7,true,0,false,'right-high').outcome).toBe('angle');
 });
 it('resolves all six outcomes',()=>{
  expect(resolveShot({x:200,y:150},.7,true,0).outcome).toBe('angle');
  expect(resolveShot({x:205,y:270},.7,true,0).outcome).toBe('goal');
  expect(resolveShot({x:400,y:250},.7,true,0).outcome).toBe('save');
  expect(resolveShot({x:150,y:180},.7,true,0).outcome).toBe('post');
  expect(resolveShot({x:200,y:125},1,true,0).outcome).toBe('over');
  expect(resolveShot({x:120,y:180},.7,true,0).outcome).toBe('wide');
 });
 it('caps XP and rewards corners',()=>{expect(xpFor(['angle','goal'])).toBe(10);expect(xpFor(['angle','angle','angle','angle','goal'])).toBe(20);});
 it('gives a larger green zone after the correct word',()=>{const a=powerZone(true),b=powerZone(false);expect(a[1]-a[0]).toBeGreaterThan(b[1]-b[0]);});
 it('alternates sudden-death pairs and stops after three tied rounds',()=>{
  const five=Array.from({length:5},()=> 'save' as const);
  expect(duelFinished(five,five)).toBe(false);
  expect(duelFinished([...five,'goal'],five)).toBe(false);
  expect(duelFinished([...five,'goal'],[...five,'save'])).toBe(true);
  expect(duelFinished([...five,'save','save','save'],[...five,'save','save','save'])).toBe(true);
 });
});