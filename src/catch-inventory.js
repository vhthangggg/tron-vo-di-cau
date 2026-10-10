import {FISH_KEEPERS,findFishKeeper} from './fish-keepers.js';
import {FISH} from './content.js';
import {estimatedSpecimenLength} from './species-physics.js';
export const KEEP_CAPACITY = Object.freeze({
  keepnet: Object.freeze({count: 30, kg: 35}),
  bucket: Object.freeze({count: 12, kg: 12}),
  box: Object.freeze({count: 20, kg: 25}),
  ...Object.fromEntries(FISH_KEEPERS.map(keeper=>[keeper.id,Object.freeze({count:keeper.maxFishCount,kg:keeper.capacityKg})]))
});

export function fitsKeeperLength(fish,container){
 const keeper=findFishKeeper(container),species=FISH.find(def=>def.id===fish?.fishId);
 const length=species?estimatedSpecimenLength(species,fish.weight):null;
 return !keeper?.maxFishLengthCm||length===null||length<=keeper.maxFishLengthCm;
}

const validFish = fish => fish && typeof fish.id === 'string' && fish.id.length > 0
  && Number.isFinite(fish.weight) && fish.weight > 0;
const validCatches = catches => Array.isArray(catches) && catches.every(validFish)
  && new Set(catches.map(fish => fish.id)).size === catches.length;

export function containerUsage(catches, container = 'keepnet') {
  const limit = Object.hasOwn(KEEP_CAPACITY, container) ? KEEP_CAPACITY[container] : null;
  const count = Array.isArray(catches) ? catches.length : 0;
  const kg = validCatches(catches) ? catches.reduce((sum, fish) => sum + fish.weight, 0) : Infinity;
  const maxCount = limit?.count ?? 0, maxKg = limit?.kg ?? 0;
  return {count, kg, maxCount, maxKg, full: !limit || count >= maxCount || kg >= maxKg};
}

export function canStoreCatch(catches, fish, container = 'keepnet', durability = Infinity) {
  if (!Object.hasOwn(KEEP_CAPACITY, container)) return {ok: false, reason: 'container'};
  if (!validCatches(catches) || !validFish(fish)) return {ok: false, reason: 'invalid'};
  if (catches.some(existing => existing.id === fish.id)) return {ok: false, reason: 'duplicate'};
  if(durability<=0)return {ok:false,reason:'durability'};
  const usage = containerUsage(catches, container);
  // A small tolerance accommodates decimal addition without adding useful capacity.
  if (usage.count >= usage.maxCount || usage.kg + fish.weight - usage.maxKg > 1e-9)
    return {ok: false, reason: 'capacity'};
  if(!fitsKeeperLength(fish,container))return {ok:false,reason:'length'};
  return {ok: true, reason: ''};
}

export function keepCatch(catches, fish, container = 'keepnet', durability = Infinity) {
  const result = canStoreCatch(catches, fish, container, durability);
  if (!result.ok) return {...result, catches};
  return {ok: true, catches: [...catches, {...fish}]};
}

export function disposeCatch(catches, id, action) {
  if (!['sell', 'gift', 'cook', 'release'].includes(action)) return {ok: false, reason: 'action', catches};
  if (!validCatches(catches)) return {ok: false, reason: 'invalid', catches};
  const fish = catches.find(existing => existing.id === id);
  if (!fish) return {ok: false, reason: 'missing', catches};
  return {ok: true, fish: {...fish}, action, catches: catches.filter(existing => existing.id !== id)};
}

function sameCatch(a, b) {
  // Identity fields do not include lifecycle labels, which may change on a save reload.
  return ['id', 'fishId', 'weight', 'value', 'mapId', 'caughtAt'].every(key => a[key] === b[key]);
}

export function shipHome(kept, home) {
  const failure = reason => ({ok: false, reason, catches: kept, kept, home, moved: 0});
  if (!validCatches(kept) || !validCatches(home)) return failure('invalid');
  const byId = new Map(home.map(fish => [fish.id, fish]));
  const additions = [];
  for (const fish of kept) {
    const existing = byId.get(fish.id);
    if (existing && !sameCatch(existing, fish)) return failure('conflict');
    if (!existing) {
      const copy = {...fish};
      byId.set(fish.id, copy);
      additions.push(copy);
    }
  }
  // Matching IDs are a completed transfer replay, not another owned fish.
  return {ok: true, catches: [], kept: [], home: [...home, ...additions], moved: additions.length};
}
