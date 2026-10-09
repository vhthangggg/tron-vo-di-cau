import test from 'node:test';
import assert from 'node:assert/strict';
import {KEEP_CAPACITY, containerUsage, canStoreCatch, keepCatch, disposeCatch, shipHome} from '../src/catch-inventory.js';
import {mountBait, resolveBait} from '../src/bait-system.js';
import {STARTER_STEPS, advanceTutorial, claimTutorial} from '../src/tutorial.js';

const fish = (id, weight = 1) => ({id, weight, fishId: 'ro', value: 3000, mapId: 'AO'});

test('each keep container enforces its own count and weight without deleting existing fish', () => {
  for (const [container, limit] of Object.entries(KEEP_CAPACITY)) {
    const fullByCount = Object.freeze(Array.from({length: limit.count}, (_, i) => Object.freeze(fish(`old-${i}`, .1))));
    const rejected = keepCatch(fullByCount, fish('new'), container);
    assert.equal(rejected.ok, false);
    assert.equal(rejected.reason, 'capacity');
    assert.equal(rejected.catches, fullByCount);
    assert.equal(containerUsage(fullByCount, container).full, true);

    const almostFull = Object.freeze([Object.freeze(fish('large', limit.kg - .25))]);
    assert.equal(keepCatch(almostFull, fish('fits', .25), container).ok, true);
    assert.equal(keepCatch(almostFull, fish('too-heavy', .26), container).ok, false);
    assert.equal(almostFull.length, 1);
    assert.deepEqual(containerUsage(almostFull, container), {
      count: 1, kg: limit.kg - .25, maxCount: limit.count, maxKg: limit.kg, full: false
    });
  }
});

test('capacity changes preserve grandfathered fish and permit handling them', () => {
  const grandfathered = Array.from({length: 40}, (_, i) => fish(`old-${i}`));
  assert.equal(containerUsage(grandfathered, 'keepnet').full, true);
  assert.equal(keepCatch(grandfathered, fish('new'), 'keepnet').catches, grandfathered);
  const disposed = disposeCatch(grandfathered, 'old-0', 'release');
  assert.equal(disposed.ok, true);
  assert.equal(disposed.catches.length, 39);
  assert.equal(grandfathered.length, 40);
});

test('keeping rejects duplicate identities, malformed catches and unknown containers', () => {
  const catches = [fish('catch-1')];
  assert.equal(canStoreCatch(catches, fish('catch-1')).reason, 'duplicate');
  for (const container of ['missing', 'constructor', '__proto__']) {
    assert.equal(canStoreCatch([], fish('catch-2'), container).reason, 'container');
    assert.equal(containerUsage([], container).full, true);
  }
  for (const invalid of [null, {id: 'bad', weight: -1}, {id: 'bad', weight: NaN}])
    assert.equal(keepCatch(catches, invalid).catches, catches);
  assert.equal(keepCatch(null, fish('catch-1')).ok, false);
});

test('a kept fish can be used for only one result', () => {
  for (const action of ['sell', 'gift', 'cook', 'release']) {
    const catches = Object.freeze([Object.freeze(fish('catch-1')), Object.freeze(fish('catch-2'))]);
    const first = disposeCatch(catches, 'catch-1', action);
    assert.equal(first.ok, true);
    assert.deepEqual(first.catches.map(c => c.id), ['catch-2']);
    for (const replay of ['sell', 'gift', 'cook', 'release'])
      assert.equal(disposeCatch(first.catches, 'catch-1', replay).ok, false);
    assert.equal(catches.length, 2);
  }
});

test('bringing fish home merges unique identities and survives a transfer replay', () => {
  const kept = Object.freeze([Object.freeze(fish('trip-1')), Object.freeze(fish('trip-2'))]);
  const home = Object.freeze([Object.freeze(fish('home-1'))]);
  const first = shipHome(kept, home);
  assert.equal(first.ok, true);
  assert.equal(first.moved, 2);
  assert.deepEqual(first.kept, []);
  assert.deepEqual(first.home.map(c => c.id), ['home-1', 'trip-1', 'trip-2']);
  const replay = shipHome(kept, first.home);
  assert.equal(replay.ok, true);
  assert.equal(replay.moved, 0);
  assert.deepEqual(replay.home, first.home);
  assert.equal(kept.length, 2);
  assert.equal(home.length, 1);
});

test('a conflicting or corrupted home transfer fails entirely without partial loss', () => {
  const kept = [fish('new-1'), fish('same-1', 2)], home = [fish('same-1', 1)];
  const result = shipHome(kept, home);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'conflict');
  assert.equal(result.kept, kept);
  assert.equal(result.home, home);
  assert.equal(result.moved, 0);
  assert.equal(shipHome([fish('duplicate'), fish('duplicate')], []).ok, false);
});

test('bait portions survive repeated retrieval and spend once on their terminal outcome', () => {
  for (const outcome of ['eaten', 'lost', 'replaced']) {
    const stock = Object.freeze({worm: 2, corn: 3});
    let mounted = Object.freeze(mountBait(stock, 'worm', {mountId: 'mount-1'}));
    assert.equal(mounted.mountId, 'mount-1');
    for (let i = 0; i < 8; i++) {
      const result = resolveBait(stock, mounted, 'retrieved');
      assert.equal(result.stock.worm, 2);
      assert.equal(result.consumed, false);
      mounted = result.mounted;
    }
    const final = resolveBait(stock, mounted, outcome);
    assert.equal(final.stock.worm, 1);
    assert.equal(final.stock.corn, 3);
    assert.equal(final.mounted, null);
    assert.equal(final.consumed, true);
    assert.equal(resolveBait(final.stock, final.mounted, outcome), null);
    assert.equal(stock.worm, 2);
  }
});

test('reusable lures survive fish bites and replacement but actual loss removes one', () => {
  const stock = {lure: 1};
  const mounted = mountBait(stock, 'lure');
  assert.equal(mounted.reusable, true);
  for (const outcome of ['eaten', 'retrieved']) {
    const resolved = resolveBait(stock, mounted, outcome);
    assert.equal(resolved.stock.lure, 1);
    assert.equal(resolved.mounted.id, 'lure');
    assert.equal(resolved.consumed, false);
  }
  const replaced = resolveBait(stock, mounted, 'replaced');
  assert.equal(replaced.stock.lure, 1);
  assert.equal(replaced.mounted, null);
  const lost = resolveBait(stock, mounted, 'lost');
  assert.equal(lost.stock.lure, 0);
  assert.equal(lost.mounted, null);
});

test('invalid bait actions and a consumed mount cannot subtract stock', () => {
  assert.equal(mountBait({worm: 0}, 'worm'), null);
  assert.equal(mountBait({worm: 1.5}, 'worm'), null);
  assert.equal(mountBait({missing: 3}, 'missing'), null);
  assert.equal(mountBait(null, 'worm'), null);
  const stock = {worm: 2};
  const mounted = mountBait(stock, 'worm');
  assert.equal(resolveBait(stock, mounted, 'wait'), null);
  assert.equal(resolveBait(stock, {...mounted, consumed: true}, 'lost').stock.worm, 2);
  assert.equal(resolveBait({worm: 0}, mounted, 'lost'), null);
});

test('the ten practical lesson IDs preserve progress and reject failed or UI-only actions', () => {
  assert.deepEqual(STARTER_STEPS.map(step => step.id), ['prepare', 'bait', 'rig', 'float', 'spot', 'cast', 'bite', 'land', 'keep', 'home']);
  assert.ok(STARTER_STEPS.every(step => step.hint && Number.isSafeInteger(step.reward) && step.reward > 0));
  for (const step of STARTER_STEPS) {
    assert.deepEqual(advanceTutorial({}, step.event), {});
    assert.deepEqual(advanceTutorial({}, step.event, {}), {});
  }
  const failed = [
    ['DEPARTURE_VALIDATED', {valid: false}], ['BAIT_COLLECTED', {count: 0}],
    ['RIG_VALIDATED', {valid: false}], ['FLOAT_CALIBRATED', {balanced: false}],
    ['SPOT_SELECTED', {valid: true, inWater: false}], ['CAST_COMPLETED', {valid: true, inWater: false}],
    ['BITE_RECOGNIZED', {success: false}], ['FISH_LANDED', {success: false}],
    ['FISH_STORED', {stored: false}], ['TRIP_COMPLETED', {completed: true, returned: true, handled: false}]
  ];
  for (const [event, payload] of failed) assert.deepEqual(advanceTutorial({}, event, payload), {});
});

test('verified outcomes advance only their lesson and reward claims remain idempotent', () => {
  const events = [
    ['DEPARTURE_VALIDATED', {valid: true}], ['BAIT_COLLECTED', {count: 6}],
    ['RIG_VALIDATED', {valid: true}], ['FLOAT_CALIBRATED', {balanced: true}],
    ['SPOT_SELECTED', {valid: true, inWater: true}], ['CAST_COMPLETED', {valid: true, inWater: true}],
    ['BITE_RECOGNIZED', {success: true}], ['FISH_LANDED', {success: true}],
    ['FISH_STORED', {stored: true}], ['TRIP_COMPLETED', {completed: true, returned: true, handled: true}]
  ];
  let progress = {};
  for (const [i, [event, payload]] of events.entries()) {
    const before = progress;
    const advanced = advanceTutorial(Object.freeze(before), event, payload);
    assert.equal(Object.keys(advanced).length, i + 1);
    assert.equal(Object.keys(before).length, i);
    const id = STARTER_STEPS[i].id;
    const claimed = claimTutorial(advanced, id);
    assert.equal(claimed.ok, true);
    assert.equal(claimTutorial(claimed.progress, id).ok, false);
    progress = claimed.progress;
    assert.deepEqual(advanceTutorial(progress, event, payload), progress);
  }
});

test('tutorial actions may occur out of order and nonfloat techniques have their own valid setup', () => {
  const progress = advanceTutorial({}, 'FISH_STORED', {stored: true});
  assert.equal(progress.keep.completed, true);
  assert.equal(progress.prepare, undefined);
  assert.equal(advanceTutorial(progress, 'RIG_CALIBRATED', {usesFloat: false, valid: true}).float.completed, true);
  assert.equal(advanceTutorial(progress, 'RIG_CALIBRATED', {usesFloat: true, valid: true}).float, undefined);
  assert.equal(claimTutorial(progress, 'missing').ok, false);
});
