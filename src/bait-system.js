import {BAITS} from './content.js';

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
