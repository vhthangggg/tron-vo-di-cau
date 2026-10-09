export const STARTER_STEPS = Object.freeze([
  {id: 'prepare', title: 'Chuẩn bị đi câu', event: 'DEPARTURE_VALIDATED', reward: 120,
    hint: 'Mang cần, mồi và những bộ phận cần thiết trong túi; kiểm tra trước khi rời nhà.'},
  {id: 'bait', title: 'Thu mồi từ vườn', event: 'BAIT_COLLECTED', reward: 160,
    hint: 'Chăm Ruộng vườn tại nhà, rồi đào giun hoặc thu hoạch ngô; mồi bột mua ở Chợ bến.'},
  {id: 'rig', title: 'Lắp bộ câu', event: 'RIG_VALIDATED', reward: 200,
    hint: 'Lắp các bộ phận tương thích với kỹ thuật đang dùng và kiểm tra bộ câu.'},
  {id: 'float', title: 'Cân bộ câu', event: 'FLOAT_CALIBRATED', reward: 240,
    hint: 'Chỉnh chì và tầng mồi để phao làm việc. Bộ không dùng phao cần được kiểm tra theo kỹ thuật của nó.'},
  {id: 'spot', title: 'Chọn vị trí câu', event: 'SPOT_SELECTED', reward: 280,
    hint: 'Chọn điểm nước câu được; xét độ sâu, bèo, chướng ngại và loài cá muốn câu.'},
  {id: 'cast', title: 'Quăng đúng vùng nước', event: 'CAST_COMPLETED', reward: 320,
    hint: 'Chạm vùng nước hợp lệ rồi quăng; chờ mồi và phao thực sự xuống điểm đã chọn.'},
  {id: 'bite', title: 'Đọc tín hiệu cá', event: 'BITE_RECOGNIZED', reward: 360,
    hint: 'Chờ tín hiệu ăn thật và đóng cá đúng nhịp; những lần rỉa chưa đủ để giật.'},
  {id: 'land', title: 'Đưa cá lên bờ', event: 'FISH_LANDED', reward: 400,
    hint: 'Dùng hai tay theo hướng cá và giữ lực kéo phù hợp đến khi đưa cá lên bờ.'},
  {id: 'keep', title: 'Cất cá vào rọ', event: 'FISH_STORED', reward: 440,
    hint: 'Cho cá đã lên bờ vào vật chứa còn đủ số lượng và khối lượng.'},
  {id: 'home', title: 'Về nhà và xử lý thành quả', event: 'TRIP_COMPLETED', reward: 500,
    hint: 'Mang cá về nhà, sau đó bán, nấu ăn hoặc mang biếu vợ.'}
].map(step => Object.freeze(step)));

function completedBy(step, event, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  switch (step.id) {
    case 'prepare': return event === 'DEPARTURE_VALIDATED' && payload.valid === true;
    case 'bait': return event === 'BAIT_COLLECTED' && Number.isSafeInteger(payload.count) && payload.count > 0;
    case 'rig': return event === 'RIG_VALIDATED' && payload.valid === true;
    case 'float': return (event === 'FLOAT_CALIBRATED' && payload.balanced === true)
      || (event === 'RIG_CALIBRATED' && payload.usesFloat === false && payload.valid === true);
    case 'spot': return event === 'SPOT_SELECTED' && payload.valid === true && payload.inWater !== false;
    case 'cast': return event === 'CAST_COMPLETED' && payload.valid === true && payload.inWater !== false;
    case 'bite': return event === 'BITE_RECOGNIZED' && payload.success === true;
    case 'land': return event === 'FISH_LANDED' && payload.success === true;
    case 'keep': return event === 'FISH_STORED' && payload.stored === true;
    case 'home': return event === 'TRIP_COMPLETED' && payload.completed === true
      && payload.returned === true && payload.handled === true;
    default: return false;
  }
}

export function advanceTutorial(progress, event, payload) {
  const next = progress && typeof progress === 'object' && !Array.isArray(progress) ? {...progress} : {};
  // Lessons are optional and can be completed in any order. Only verified outcomes count.
  for (const step of STARTER_STEPS) {
    if (next[step.id]?.completed || !completedBy(step, event, payload)) continue;
    next[step.id] = {completed: true, claimed: false};
  }
  return next;
}

export function claimTutorial(progress, id) {
  if (!STARTER_STEPS.some(step => step.id === id) || !progress?.[id]?.completed || progress[id].claimed)
    return {ok: false, progress};
  return {ok: true, progress: {...progress, [id]: {...progress[id], claimed: true}}};
}
