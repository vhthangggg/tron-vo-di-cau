import {BAITS} from './content.js';

export const GATHER_SOURCES = Object.freeze({
  soil: Object.freeze({id: 'soil', baitId: 'worm', name: 'Đào giun ở đất ẩm', yieldCount: 6, limit: 60, cooldown: 10}),
  home: Object.freeze({id: 'home', baitId: 'dough', name: 'Trộn mồi bột ở nhà', yieldCount: 4, limit: 40, cooldown: 12}),
  garden: Object.freeze({id: 'garden', baitId: 'corn', name: 'Lấy ngô trong vườn', yieldCount: 4, limit: 40, cooldown: 12})
});

const validStock = stock => stock && typeof stock === 'object' && !Array.isArray(stock);
const quantity = (stock, id) => stock[id] ?? 0;
const validQuantity = value => Number.isSafeInteger(value) && value >= 0;

// Mounting reserves the portion on the hook; idle time and retrieval never spend it.
export function mountBait(stock, id, {mountId} = {}) {
  const bait = BAITS.find(definition => definition.id === id);
  if (!validStock(stock) || !bait || !validQuantity(quantity(stock, id)) || quantity(stock, id) === 0) return null;
  if (mountId !== undefined && (typeof mountId !== 'string' || !mountId.length || mountId.length > 128)) return null;
  return {id, condition: 'intact', consumed: false, reusable: bait.reusable === true, ...(mountId === undefined ? {} : {mountId})};
}

export function resolveBait(stock, mounted, outcome) {
  if (!validStock(stock) || !mounted || !BAITS.some(bait => bait.id === mounted.id)
    || !['retrieved', 'eaten', 'lost', 'replaced'].includes(outcome)
    || !validQuantity(quantity(stock, mounted.id))) return null;
  const reusable = BAITS.find(bait => bait.id === mounted.id).reusable === true;
  const survives = outcome === 'retrieved' || (reusable && outcome === 'eaten');
  if (mounted.consumed) return {stock: {...stock}, mounted: null, consumed: false};
  const consume = !survives && !(reusable && outcome === 'replaced');
  if (consume && quantity(stock, mounted.id) === 0) return null;
  return {
    stock: consume ? {...stock, [mounted.id]: quantity(stock, mounted.id) - 1} : {...stock},
    mounted: survives ? {...mounted, reusable} : null,
    consumed: consume
  };
}

export function digWorms(stock, {yieldCount = 6, limit = 60} = {}) {
  if (!validStock(stock) || !validQuantity(quantity(stock, 'worm'))
    || !Number.isSafeInteger(yieldCount) || yieldCount < 1 || !Number.isSafeInteger(limit) || limit < 1) return null;
  const current = quantity(stock, 'worm');
  // Purchasing beyond the free gathering cap must never destroy the purchased portions.
  return {...stock, worm: Math.max(current, Math.min(limit, current + yieldCount))};
}

export function gatherBait(stock, sourceId) {
  const source = Object.hasOwn(GATHER_SOURCES, sourceId) ? GATHER_SOURCES[sourceId] : null;
  if (!source || !validStock(stock) || !validQuantity(quantity(stock, source?.baitId)))
    return {ok: false, stock, id: source?.baitId ?? null, gained: 0, reason: 'invalid', sourceId};
  const current = quantity(stock, source.baitId);
  const gained = Math.max(0, Math.min(source.yieldCount, source.limit - current));
  if (!gained) return {ok: false, stock, id: source.baitId, gained: 0, reason: 'capacity', sourceId};
  return {ok: true, stock: {...stock, [source.baitId]: current + gained}, id: source.baitId, gained, reason: '', sourceId};
}
