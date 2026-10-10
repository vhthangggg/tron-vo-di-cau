// Game balance values (0–100) are proposals, NOT verified SKU specifications.
// Keep this module and data/lures.catalog.json synchronized.
export const LURE_CATALOG = Object.freeze([
  {
    "id": "lure_01",
    "name": "Minnow nổi HENGJIA",
    "category": "minnow",
    "asset": "/assets/items/lures/moi-minnow-noi.webp",
    "file": "moi-minnow-noi.webp",
    "affiliateUrl": "https://s.shopee.vn/1LgQk0h4ts",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "floating",
      "minDepthM": 0,
      "maxDepthM": 1.2,
      "minWeightG": 5,
      "maxWeightG": 12,
      "action": "wobble + twitch",
      "hookExample": "2 lưỡi ba tiêu",
      "snagRisk": 42,
      "durability": 66,
      "attraction": 64,
      "priceCoins": 6000,
      "compatibleFishBaitId": "lure",
      "targetFishIds": [
        "fish_04",
        "fish_35"
      ],
      "retrieveNote": "Sông, cửa sông; thu đều, giật ngắn.",
      "needsSeparateHook": false
    },
    "note": "Minnow nổi; rung thân nhẹ, có thể giật ngắn hoặc thu đều.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_02",
    "name": "Minnow lơ lửng",
    "category": "jerkbait",
    "asset": "/assets/items/lures/moi-minnow-lo-lung.webp",
    "file": "moi-minnow-lo-lung.webp",
    "affiliateUrl": "https://s.shopee.vn/5LCZUBgUPU",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "suspending",
      "minDepthM": 0.4,
      "maxDepthM": 1.8,
      "minWeightG": 7,
      "maxWeightG": 14,
      "action": "dart + pause",
      "hookExample": "2 lưỡi ba tiêu",
      "snagRisk": 44,
      "durability": 72,
      "attraction": 75,
      "priceCoins": 12500,
      "compatibleFishBaitId": "lure",
      "targetFishIds": [
        "fish_35",
        "fish_39"
      ],
      "retrieveNote": "Hồ, cửa sông; twitch-pause.",
      "needsSeparateHook": false
    },
    "note": "Jerkbait đứng tầng nước khi dừng, nhấn mạnh giật–dừng.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_03",
    "name": "Crankbaits 3D",
    "category": "crankbait",
    "asset": "/assets/items/lures/moi-crankbait.webp",
    "file": "moi-crankbait.webp",
    "affiliateUrl": "https://s.shopee.vn/8KqB3t4MOe",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "floating",
      "minDepthM": 0.5,
      "maxDepthM": 2.5,
      "minWeightG": 6,
      "maxWeightG": 16,
      "action": "wide wobble",
      "hookExample": "2 lưỡi ba tiêu",
      "snagRisk": 58,
      "durability": 68,
      "attraction": 67,
      "priceCoins": 8500,
      "compatibleFishBaitId": "crank",
      "targetFishIds": [
        "fish_04",
        "fish_22"
      ],
      "retrieveNote": "Hồ, kênh; thu đều, stop-go.",
      "needsSeparateHook": false
    },
    "note": "Crankbait có thìa lặn, lắc mạnh; không phù hợp thảm bèo dày.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_04",
    "name": "Popper",
    "category": "popper",
    "asset": "/assets/items/lures/moi-popper.webp",
    "file": "moi-popper.webp",
    "affiliateUrl": "https://s.shopee.vn/5At9IAn3IF",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "floating",
      "minDepthM": 0,
      "maxDepthM": 0,
      "minWeightG": 7,
      "maxWeightG": 15,
      "action": "pop + splash",
      "hookExample": "2 lưỡi ba tiêu",
      "snagRisk": 35,
      "durability": 72,
      "attraction": 72,
      "priceCoins": 10000,
      "compatibleFishBaitId": "popper",
      "targetFishIds": [
        "fish_04",
        "fish_22"
      ],
      "retrieveNote": "Mặt nước thoáng, mép cỏ; giật–đợi.",
      "needsSeparateHook": false
    },
    "note": "Mặt lõm tạo tiếng nước, dùng kéo ngắt quãng trên mặt nước.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_05",
    "name": "RINLURE Pencil sinking",
    "category": "sinking_pencil",
    "asset": "/assets/items/lures/moi-pencil.webp",
    "file": "moi-pencil.webp",
    "affiliateUrl": "https://s.shopee.vn/AAHpFXhzvq",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "sinking",
      "minDepthM": 0.2,
      "maxDepthM": 2,
      "minWeightG": 8,
      "maxWeightG": 17,
      "action": "sink + dart",
      "hookExample": "2 lưỡi ba tiêu (kiểm tra SKU)",
      "snagRisk": 42,
      "durability": 70,
      "attraction": 72,
      "priceCoins": 13500,
      "compatibleFishBaitId": "lure",
      "targetFishIds": [
        "fish_35",
        "fish_39"
      ],
      "retrieveNote": "Sông, cửa sông; đếm chìm, giật ngang.",
      "needsSeparateHook": false
    },
    "note": "Pencil sinking là mồi CHÌM; không gắn hành động walk-the-dog nổi.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_06",
    "name": "Nhái hơi chống vướng",
    "category": "hollow_frog",
    "asset": "/assets/items/lures/moi-nhai-hoi.webp",
    "file": "moi-nhai-hoi.webp",
    "affiliateUrl": "https://s.shopee.vn/1LgQkCWBIv",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "floating",
      "minDepthM": 0,
      "maxDepthM": 0,
      "minWeightG": 8,
      "maxWeightG": 20,
      "action": "walk + splash",
      "hookExample": "lưỡi đôi áp thân chống vướng",
      "snagRisk": 12,
      "durability": 65,
      "attraction": 70,
      "priceCoins": 9500,
      "compatibleFishBaitId": "popper",
      "targetFishIds": [
        "fish_04",
        "fish_22"
      ],
      "retrieveNote": "Bèo, sen, cỏ nổi; đi nhẹ, dừng.",
      "needsSeparateHook": false
    },
    "note": "Nhái hơi thân rỗng mềm: giảm mắc cỏ nhưng cần chờ cá ngậm mồi.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_07",
    "name": "Nhái nhảy",
    "category": "jump_frog",
    "asset": "/assets/items/lures/moi-nhai-nhay.webp",
    "file": "moi-nhai-nhay.webp",
    "affiliateUrl": "https://s.shopee.vn/gQjy6T82w",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "floating",
      "minDepthM": 0,
      "maxDepthM": 0,
      "minWeightG": 8,
      "maxWeightG": 16,
      "action": "hop + pop + pause",
      "hookExample": "lưỡi đôi chống vướng (kiểm tra SKU)",
      "snagRisk": 15,
      "durability": 74,
      "attraction": 78,
      "priceCoins": 11500,
      "compatibleFishBaitId": "popper",
      "targetFishIds": [
        "fish_04",
        "fish_22"
      ],
      "retrieveNote": "Thảm bèo, cỏ nổi, bờ lau; thu chậm – nhấp – dừng.",
      "needsSeparateHook": false
    },
    "note": "Jump frog nảy và tạo sóng mặt; không đồng nhất với nhái hơi thân rỗng.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [
      "https://snakeheadfishing.club/shop/snkhd-5cm-jump-frog-lure/",
      "https://snakeheadfishing.club/the-ultimate-guide-to-snakehead-fishing/"
    ],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_08",
    "name": "Thìa lượn",
    "category": "spoon",
    "asset": "/assets/items/lures/moi-thia-luon.webp",
    "file": "moi-thia-luon.webp",
    "affiliateUrl": "https://s.shopee.vn/1LgQkP1Htv",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "sinking",
      "minDepthM": 0.5,
      "maxDepthM": 4,
      "minWeightG": 7,
      "maxWeightG": 24,
      "action": "flutter + flash",
      "hookExample": "lưỡi ba tiêu đuôi",
      "snagRisk": 38,
      "durability": 85,
      "attraction": 66,
      "priceCoins": 5000,
      "compatibleFishBaitId": "spoon",
      "targetFishIds": [
        "fish_35",
        "fish_39"
      ],
      "retrieveNote": "Sông, cửa sông; thu đều, thả rơi.",
      "needsSeparateHook": false
    },
    "note": "Thìa kim loại rung và phản sáng; tránh rê vào rong dày.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_09",
    "name": "Thìa lượn gắn mồi ruồi",
    "category": "spoon_fly",
    "asset": "/assets/items/lures/moi-thia-gan-ruoi.webp",
    "file": "moi-thia-gan-ruoi.webp",
    "affiliateUrl": "https://s.shopee.vn/3LRV6I8oWb",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "sinking",
      "minDepthM": 0.3,
      "maxDepthM": 3,
      "minWeightG": 7,
      "maxWeightG": 20,
      "action": "flutter + feather pulse",
      "hookExample": "lưỡi đuôi có lông/ruồi (kiểm tra SKU)",
      "snagRisk": 39,
      "durability": 68,
      "attraction": 72,
      "priceCoins": 8000,
      "compatibleFishBaitId": "spoon",
      "targetFishIds": [
        "fish_35",
        "fish_39"
      ],
      "retrieveNote": "Sông, kênh; thu chậm, giật nhẹ.",
      "needsSeparateHook": false
    },
    "note": "Lông/ruồi rung theo dòng; ưu tiên tầng nước vừa.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_10",
    "name": "Cá mềm đuôi mái chèo",
    "category": "soft_swimbait",
    "asset": "/assets/items/lures/moi-ca-mem.webp",
    "file": "moi-ca-mem.webp",
    "affiliateUrl": "https://s.shopee.vn/113aMHDXLF",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "variable",
      "minDepthM": 0.3,
      "maxDepthM": 3.5,
      "minWeightG": 8,
      "maxWeightG": 13,
      "action": "paddle-tail kick",
      "hookExample": "chưa gắn lưỡi; cần rig offset/jighead",
      "snagRisk": 22,
      "durability": 40,
      "attraction": 75,
      "priceCoins": 7000,
      "compatibleFishBaitId": "lure",
      "targetFishIds": [
        "fish_04",
        "fish_22",
        "fish_35"
      ],
      "retrieveNote": "Ven cỏ, đáy thoáng; thu đều hoặc nhấp đáy.",
      "needsSeparateHook": true
    },
    "note": "Mồi mềm cần rig lưỡi phù hợp; không giả định đã có lưỡi khi mua.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_11",
    "name": "Cá sắt VIB",
    "category": "blade_vib",
    "asset": "/assets/items/lures/moi-ca-sat-vib.webp",
    "file": "moi-ca-sat-vib.webp",
    "affiliateUrl": "https://s.shopee.vn/30oek5RN3o",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "sinking",
      "minDepthM": 0.5,
      "maxDepthM": 6,
      "minWeightG": 9,
      "maxWeightG": 18,
      "action": "tight vibration",
      "hookExample": "2 lưỡi ba tiêu (kiểm tra SKU)",
      "snagRisk": 66,
      "durability": 88,
      "attraction": 80,
      "priceCoins": 16500,
      "compatibleFishBaitId": "crank",
      "targetFishIds": [
        "fish_04",
        "fish_22",
        "fish_35"
      ],
      "retrieveNote": "Kênh sâu, hồ, cửa sông; kéo-rơi.",
      "needsSeparateHook": false
    },
    "note": "VIB kim loại rung mạnh tầng sâu, đổi lại nguy cơ mắc đáy cao.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  },
  {
    "id": "lure_12",
    "name": "Metal Jig phản quang",
    "category": "metal_jig",
    "asset": "/assets/items/lures/moi-metal-jig.webp",
    "file": "moi-metal-jig.webp",
    "affiliateUrl": "https://s.shopee.vn/W7JlVtSUU",
    "market": {
      "brand": null,
      "model": null,
      "sku": null,
      "priceVnd": null,
      "lengthCm": null,
      "weightG": null,
      "workingDepthM": null,
      "verified": false
    },
    "game": {
      "buoyancy": "sinking",
      "minDepthM": 1,
      "maxDepthM": 20,
      "minWeightG": 10,
      "maxWeightG": 30,
      "action": "jerk + flutter fall",
      "hookExample": "lưỡi assist đầu (kiểm tra SKU)",
      "snagRisk": 64,
      "durability": 90,
      "attraction": 79,
      "priceCoins": 22000,
      "compatibleFishBaitId": "spoon",
      "targetFishIds": [
        "fish_35",
        "fish_39",
        "fish_47"
      ],
      "retrieveNote": "Biển, cửa sông sâu; jerk-fall.",
      "needsSeparateHook": false
    },
    "note": "Jig kim loại cho tầng nước sâu, không dùng như popper mặt nước.",
    "assetStatus": "pending_user_upload",
    "sourceUrls": [],
    "dataNotice": "Game estimates only; real SKU measurements and link tracking have not been verified."
  }
]);
export const findLure = id => LURE_CATALOG.find(lure=>lure.id===id)||null;
