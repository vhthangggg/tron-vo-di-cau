// Địa điểm, tập tính, khối lượng và giá là mô hình gameplay; không phải dữ liệu khảo sát.
export const TECHNIQUES = {
  "don": {
    "label": "Câu đơn",
    "float": true,
    "reel": false
  },
  "dai": {
    "label": "Câu Đài",
    "float": true,
    "reel": false
  },
  "lure": {
    "label": "Lure",
    "float": false,
    "reel": true
  },
  "bottom": {
    "label": "Câu đáy",
    "float": false,
    "reel": true
  },
  "iso": {
    "label": "ISO biển",
    "float": true,
    "reel": true
  }
};

export const MAPS = [
  {
    "id": "AO",
    "name": "Ao Làng",
    "caption": "Bên cầu tre, buổi sớm",
    "price": 0,
    "current": 0,
    "water": "Nước ngọt",
    "recommended": "don",
    "background": "./assets/maps/ao-lang.png",
    "thumbnail": "./assets/maps/thumbs/ao-lang.webp",
    "maxDepth": 3.2,
    "spots": [
      {
        "id": "ben-cau-tre",
        "name": "Bến Cầu Tre",
        "x": 0.43,
        "y": 0.86,
        "depth": 1.0,
        "video": "./assets/maps/ao-lang-ben-cau-tre.mp4",
        "waterZone": [[0.05,0.34],[0.18,0.29],[0.36,0.27],[0.52,0.28],[0.66,0.30],[0.79,0.31],[0.93,0.34],[0.96,0.43],[0.88,0.52],[0.78,0.58],[0.67,0.66],[0.58,0.78],[0.45,0.82],[0.34,0.76],[0.26,0.67],[0.16,0.61],[0.07,0.58],[0.03,0.49]],
        "habitat": {"bankY":0.82,"farY":0.29,"cover":[[0.08,0.38,0.18],[0.90,0.39,0.17],[0.17,0.57,0.13]],"open":[0.50,0.48]}
      },
      {
        "id": "mui-dat",
        "name": "Mũi Đất",
        "x": 0.67,
        "y": 0.39,
        "depth": 1.2,
        "video": "./assets/maps/ao-lang-mui-dat.mp4",
        "waterZone": [[0.04,0.31],[0.18,0.27],[0.34,0.25],[0.49,0.25],[0.62,0.27],[0.75,0.28],[0.91,0.31],[0.96,0.39],[0.91,0.48],[0.82,0.54],[0.72,0.59],[0.65,0.69],[0.58,0.82],[0.48,0.87],[0.37,0.82],[0.28,0.75],[0.18,0.68],[0.08,0.63],[0.03,0.52]],
        "habitat": {"bankY":0.87,"farY":0.26,"cover":[[0.08,0.39,0.18],[0.91,0.37,0.16],[0.17,0.61,0.14]],"open":[0.52,0.47]}
      }
    ]
  },
  {
    "id": "KENH",
    "name": "Kênh Đồng",
    "caption": "Lục bình, ruộng lúa, con nước chậm",
    "price": 18000,
    "current": 0.08,
    "water": "Nước ngọt",
    "recommended": "don",
    "background": "./assets/maps/kenh-dong.webp",
    "thumbnail": "./assets/maps/thumbs/kenh-dong.webp",
    "maxDepth": 3.2,
    "spots": [
      {
        "name": "Mép cỏ",
        "x": 0.53,
        "y": 0.58,
        "depth": 1
      },
      {
        "name": "Dòng chậm",
        "x": 0.29,
        "y": 0.64,
        "depth": 1.6
      },
      {
        "name": "Cống nhỏ",
        "x": 0.76,
        "y": 0.56,
        "depth": 2
      }
    ]
  },
  {
    "id": "HO",
    "name": "Hồ Núi",
    "caption": "Vịnh đá, núi xanh và cây chìm",
    "price": 36000,
    "current": 0.03,
    "water": "Nước ngọt",
    "recommended": "dai",
    "background": "./assets/maps/ho-nui.webp",
    "thumbnail": "./assets/maps/thumbs/ho-nui.webp",
    "maxDepth": 7.2,
    "spots": [
      {
        "name": "Vịnh kín",
        "x": 0.53,
        "y": 0.58,
        "depth": 2.1
      },
      {
        "name": "Bãi đá",
        "x": 0.29,
        "y": 0.64,
        "depth": 4.5
      },
      {
        "name": "Cây chìm",
        "x": 0.76,
        "y": 0.56,
        "depth": 7.2
      }
    ]
  },
  {
    "id": "SONG",
    "name": "Sông Bãi Bồi",
    "caption": "Bờ ngô, doi cát và dòng nước phù sa",
    "price": 48000,
    "current": 0.2,
    "water": "Nước ngọt",
    "recommended": "bottom",
    "background": "./assets/maps/song-bai-boi.webp",
    "thumbnail": "./assets/maps/thumbs/song-bai-boi.webp",
    "maxDepth": 6.8,
    "spots": [
      {
        "name": "Doi cát",
        "x": 0.53,
        "y": 0.58,
        "depth": 2.2
      },
      {
        "name": "Mép dòng",
        "x": 0.29,
        "y": 0.64,
        "depth": 4.2
      },
      {
        "name": "Hố xoáy",
        "x": 0.76,
        "y": 0.56,
        "depth": 6.8
      }
    ]
  },
  {
    "id": "SUOI",
    "name": "Suối Đại Ngàn",
    "caption": "Nước trong, đá cuội dưới bóng tre",
    "price": 28000,
    "current": 0.16,
    "water": "Nước ngọt",
    "recommended": "don",
    "background": "./assets/maps/suoi-dai-ngan.webp",
    "thumbnail": "./assets/maps/thumbs/suoi-dai-ngan.webp",
    "maxDepth": 3.2,
    "spots": [
      {
        "name": "Vũng đá",
        "x": 0.53,
        "y": 0.58,
        "depth": 0.8
      },
      {
        "name": "Bóng tre",
        "x": 0.29,
        "y": 0.64,
        "depth": 1.4
      },
      {
        "name": "Vực nhỏ",
        "x": 0.76,
        "y": 0.56,
        "depth": 2.4
      }
    ]
  },
  {
    "id": "MT",
    "name": "Kênh Miền Tây",
    "caption": "Dừa nước, ghe gỗ và những mái nhà ven kênh",
    "price": 56000,
    "current": 0.12,
    "water": "Nước ngọt",
    "recommended": "bottom",
    "background": "./assets/maps/kenh-mien-tay.webp",
    "thumbnail": "./assets/maps/thumbs/kenh-mien-tay.webp",
    "maxDepth": 5.8,
    "spots": [
      {
        "name": "Gốc dừa",
        "x": 0.53,
        "y": 0.58,
        "depth": 1.6
      },
      {
        "name": "Bến ghe",
        "x": 0.29,
        "y": 0.64,
        "depth": 3.4
      },
      {
        "name": "Luồng giữa",
        "x": 0.76,
        "y": 0.56,
        "depth": 5.8
      }
    ]
  },
  {
    "id": "DICHVU",
    "name": "Hồ Dịch Vụ",
    "caption": "Chòi câu, dù vải và hồ thả cá",
    "price": 68000,
    "current": 0.01,
    "water": "Hồ thả cá",
    "recommended": "dai",
    "background": "./assets/maps/ho-dich-vu.webp",
    "thumbnail": "./assets/maps/thumbs/ho-dich-vu.webp",
    "maxDepth": 5.2,
    "spots": [
      {
        "name": "Bến dù",
        "x": 0.53,
        "y": 0.58,
        "depth": 1.8
      },
      {
        "name": "Bờ xa",
        "x": 0.29,
        "y": 0.64,
        "depth": 3.2
      },
      {
        "name": "Rãnh sâu",
        "x": 0.76,
        "y": 0.56,
        "depth": 5.2
      }
    ]
  },
  {
    "id": "DAP",
    "name": "Lòng Đập",
    "caption": "Vách đá, lòng hồ xanh thẳm",
    "price": 88000,
    "current": 0.07,
    "water": "Nước ngọt",
    "recommended": "bottom",
    "background": "./assets/maps/long-dap.webp",
    "thumbnail": "./assets/maps/thumbs/long-dap.webp",
    "maxDepth": 12,
    "spots": [
      {
        "name": "Bãi sỏi",
        "x": 0.53,
        "y": 0.58,
        "depth": 3.4
      },
      {
        "name": "Cây chìm",
        "x": 0.29,
        "y": 0.64,
        "depth": 7.8
      },
      {
        "name": "Chân vách",
        "x": 0.76,
        "y": 0.56,
        "depth": 12
      }
    ]
  },
  {
    "id": "CSONG",
    "name": "Cửa Sông",
    "caption": "Bãi triều, rừng đước và con nước lợ",
    "price": 110000,
    "current": 0.23,
    "water": "Nước lợ",
    "recommended": "iso",
    "background": "./assets/maps/cua-song.webp",
    "thumbnail": "./assets/maps/thumbs/cua-song.webp",
    "maxDepth": 5.4,
    "spots": [
      {
        "name": "Mép đước",
        "x": 0.53,
        "y": 0.58,
        "depth": 1.2
      },
      {
        "name": "Bãi triều",
        "x": 0.29,
        "y": 0.64,
        "depth": 2.6
      },
      {
        "name": "Luồng tàu",
        "x": 0.76,
        "y": 0.56,
        "depth": 5.4
      }
    ]
  },
  {
    "id": "GHE",
    "name": "Ghềnh Biển",
    "caption": "Đá granit, sóng xanh và vịnh biển",
    "price": 150000,
    "current": 0.3,
    "water": "Nước mặn",
    "recommended": "iso",
    "background": "./assets/maps/ghenh-bien.webp",
    "thumbnail": "./assets/maps/thumbs/ghenh-bien.webp",
    "maxDepth": 9.2,
    "spots": [
      {
        "name": "Vịnh kín",
        "x": 0.53,
        "y": 0.58,
        "depth": 2.4
      },
      {
        "name": "Mép ghềnh",
        "x": 0.29,
        "y": 0.64,
        "depth": 5.8
      },
      {
        "name": "Rạn ngoài",
        "x": 0.76,
        "y": 0.56,
        "depth": 9.2
      }
    ]
  }
];

export const FISH = [
  {
    "id": "fish_01",
    "name": "Cá chép",
    "maps": [
      "AO",
      "HO",
      "DICHVU",
      "MT"
    ],
    "baits": [
      "worm",
      "corn",
      "dough"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "bottom",
    "min": 0.15,
    "max": 2.8,
    "price": 22000,
    "color": "#B0804B",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_02",
    "name": "Cá diếc",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "worm",
      "dough"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "bottom",
    "min": 0.08,
    "max": 0.7,
    "price": 26000,
    "color": "#A4A479",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_03",
    "name": "Cá rô đồng",
    "maps": [
      "AO",
      "KENH",
      "MT"
    ],
    "baits": [
      "worm"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "mid",
    "min": 0.06,
    "max": 0.4,
    "price": 30000,
    "color": "#6F8056",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_04",
    "name": "Cá lóc",
    "maps": [
      "AO",
      "KENH",
      "HO",
      "DAP",
      "SUOI",
      "MT"
    ],
    "baits": [
      "lure"
    ],
    "tech": [
      "lure"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 2,
    "price": 48000,
    "color": "#6B7463",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_05",
    "name": "Cá trê vàng",
    "maps": [
      "AO",
      "KENH",
      "MT"
    ],
    "baits": [
      "worm"
    ],
    "tech": [
      "don"
    ],
    "depth": "bottom",
    "min": 0.15,
    "max": 1.2,
    "price": 35000,
    "color": "#8D854E",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_06",
    "name": "Cá rô phi vằn",
    "maps": [
      "AO",
      "KENH",
      "HO",
      "DICHVU",
      "MT"
    ],
    "baits": [
      "worm",
      "dough"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "mid",
    "min": 0.15,
    "max": 1,
    "price": 20000,
    "color": "#788E7B",
    "shape": "round",
    "pattern": "stripes"
  },
  {
    "id": "fish_07",
    "name": "Cá trắm cỏ",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "corn",
      "dough"
    ],
    "tech": [
      "dai"
    ],
    "depth": "bottom",
    "min": 0.4,
    "max": 3.2,
    "price": 24000,
    "color": "#6C8462",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_08",
    "name": "Cá mè trắng",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "cloudbait"
    ],
    "tech": [
      "dai"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 2.2,
    "price": 18000,
    "color": "#9FAEA6",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_09",
    "name": "Cá mè hoa",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "cloudbait"
    ],
    "tech": [
      "dai"
    ],
    "depth": "mid",
    "min": 0.4,
    "max": 2.6,
    "price": 19000,
    "color": "#888C7B",
    "shape": "carp",
    "pattern": "spots"
  },
  {
    "id": "fish_10",
    "name": "Cá trôi",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "dough",
      "corn"
    ],
    "tech": [
      "dai"
    ],
    "depth": "bottom",
    "min": 0.3,
    "max": 2.2,
    "price": 23000,
    "color": "#9E947B",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_11",
    "name": "Cá sặc rằn",
    "maps": [
      "KENH",
      "MT"
    ],
    "baits": [
      "worm",
      "dough"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "mid",
    "min": 0.05,
    "max": 0.3,
    "price": 28000,
    "color": "#8F9D7E",
    "shape": "round",
    "pattern": "stripes"
  },
  {
    "id": "fish_12",
    "name": "Cá sặc bướm",
    "maps": [
      "KENH"
    ],
    "baits": [
      "worm"
    ],
    "tech": [
      "don"
    ],
    "depth": "mid",
    "min": 0.04,
    "max": 0.2,
    "price": 26000,
    "color": "#9C9E7C",
    "shape": "round",
    "pattern": "stripes"
  },
  {
    "id": "fish_13",
    "name": "Cá trê đen",
    "maps": [
      "AO",
      "SONG"
    ],
    "baits": [
      "worm",
      "shrimp"
    ],
    "tech": [
      "don",
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.1,
    "max": 2,
    "price": 38000,
    "color": "#547d82",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_14",
    "name": "Cá trê phi",
    "maps": [
      "AO"
    ],
    "baits": [
      "worm",
      "livefish"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.3,
    "max": 12,
    "price": 42000,
    "color": "#897352",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_15",
    "name": "Cá tra",
    "maps": [
      "MT",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "dough",
      "shrimp",
      "pellet"
    ],
    "tech": [
      "bottom",
      "dai"
    ],
    "depth": "mid",
    "min": 0.5,
    "max": 20,
    "price": 46000,
    "color": "#8a6570",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_16",
    "name": "Cá basa",
    "maps": [
      "MT"
    ],
    "baits": [
      "shrimp",
      "dough",
      "pellet"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "mid",
    "min": 0.5,
    "max": 15,
    "price": 18000,
    "color": "#769c94",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_17",
    "name": "Cá lăng đuôi đỏ",
    "maps": [
      "SONG",
      "HO",
      "DAP"
    ],
    "baits": [
      "shrimp",
      "livefish"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.4,
    "max": 18,
    "price": 22000,
    "color": "#c4a269",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_18",
    "name": "Cá bỗng",
    "maps": [
      "SONG",
      "SUOI",
      "HO"
    ],
    "baits": [
      "worm",
      "cricket"
    ],
    "tech": [
      "don",
      "bottom"
    ],
    "depth": "mid",
    "min": 0.2,
    "max": 8,
    "price": 26000,
    "color": "#608577",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_19",
    "name": "Cá chiên",
    "maps": [
      "SONG",
      "DAP"
    ],
    "baits": [
      "livefish",
      "shrimp"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.8,
    "max": 25,
    "price": 30000,
    "color": "#a8b3ab",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_20",
    "name": "Cá ngạnh",
    "maps": [
      "SONG"
    ],
    "baits": [
      "worm",
      "shrimp"
    ],
    "tech": [
      "bottom",
      "don"
    ],
    "depth": "bottom",
    "min": 0.1,
    "max": 1.8,
    "price": 34000,
    "color": "#7683a0",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_21",
    "name": "Cá nheo",
    "maps": [
      "SONG",
      "HO",
      "DAP"
    ],
    "baits": [
      "livefish",
      "worm"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.2,
    "max": 4,
    "price": 38000,
    "color": "#b08b4c",
    "shape": "catfish",
    "pattern": "scales"
  },
  {
    "id": "fish_22",
    "name": "Cá lóc bông",
    "maps": [
      "MT",
      "HO",
      "DAP"
    ],
    "baits": [
      "popper",
      "crank"
    ],
    "tech": [
      "lure"
    ],
    "depth": "cover",
    "min": 0.5,
    "max": 12,
    "price": 42000,
    "color": "#899d86",
    "shape": "long",
    "pattern": "spots"
  },
  {
    "id": "fish_23",
    "name": "Cá thát lát",
    "maps": [
      "MT",
      "KENH"
    ],
    "baits": [
      "worm",
      "shrimp"
    ],
    "tech": [
      "don",
      "bottom"
    ],
    "depth": "mid",
    "min": 0.1,
    "max": 0.8,
    "price": 46000,
    "color": "#547d82",
    "shape": "knife",
    "pattern": "scales"
  },
  {
    "id": "fish_24",
    "name": "Cá thát lát cườm",
    "maps": [
      "MT",
      "HO"
    ],
    "baits": [
      "lure",
      "livefish"
    ],
    "tech": [
      "lure",
      "bottom"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 7,
    "price": 18000,
    "color": "#897352",
    "shape": "knife",
    "pattern": "spots"
  },
  {
    "id": "fish_25",
    "name": "Cá bống tượng",
    "maps": [
      "MT",
      "KENH"
    ],
    "baits": [
      "shrimp",
      "livefish"
    ],
    "tech": [
      "don",
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.1,
    "max": 2,
    "price": 22000,
    "color": "#8a6570",
    "shape": "grouper",
    "pattern": "spots"
  },
  {
    "id": "fish_26",
    "name": "Cá bống kèo",
    "maps": [
      "MT",
      "CSONG"
    ],
    "baits": [
      "worm"
    ],
    "tech": [
      "don"
    ],
    "depth": "bottom",
    "min": 0.015,
    "max": 0.06,
    "price": 26000,
    "color": "#769c94",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_27",
    "name": "Cá chạch bùn",
    "maps": [
      "AO",
      "KENH"
    ],
    "baits": [
      "worm"
    ],
    "tech": [
      "don"
    ],
    "depth": "bottom",
    "min": 0.015,
    "max": 0.1,
    "price": 30000,
    "color": "#c4a269",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_28",
    "name": "Cá chạch lấu",
    "maps": [
      "SONG",
      "MT"
    ],
    "baits": [
      "worm",
      "shrimp"
    ],
    "tech": [
      "bottom",
      "don"
    ],
    "depth": "bottom",
    "min": 0.15,
    "max": 1.8,
    "price": 34000,
    "color": "#608577",
    "shape": "long",
    "pattern": "spots"
  },
  {
    "id": "fish_29",
    "name": "Cá chày mắt đỏ",
    "maps": [
      "SONG",
      "SUOI"
    ],
    "baits": [
      "worm",
      "cricket"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "mid",
    "min": 0.1,
    "max": 2,
    "price": 38000,
    "color": "#a8b3ab",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_30",
    "name": "Cá mè vinh",
    "maps": [
      "MT",
      "KENH"
    ],
    "baits": [
      "dough",
      "worm"
    ],
    "tech": [
      "don",
      "dai"
    ],
    "depth": "mid",
    "min": 0.1,
    "max": 1.2,
    "price": 42000,
    "color": "#7683a0",
    "shape": "round",
    "pattern": "scales"
  },
  {
    "id": "fish_31",
    "name": "Cá trắm đen",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "snail",
      "shrimp"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.5,
    "max": 18,
    "price": 46000,
    "color": "#b08b4c",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_32",
    "name": "Cá trôi mrigal",
    "maps": [
      "AO",
      "HO",
      "DICHVU"
    ],
    "baits": [
      "dough"
    ],
    "tech": [
      "dai",
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.2,
    "max": 6,
    "price": 18000,
    "color": "#899d86",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_33",
    "name": "Cá mè trắng Việt Nam",
    "maps": [
      "SONG",
      "HO"
    ],
    "baits": [
      "cloudbait"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 8,
    "price": 22000,
    "color": "#547d82",
    "shape": "carp",
    "pattern": "scales"
  },
  {
    "id": "fish_34",
    "name": "Cá bống cát",
    "maps": [
      "KENH",
      "CSONG"
    ],
    "baits": [
      "shrimp",
      "worm"
    ],
    "tech": [
      "don"
    ],
    "depth": "bottom",
    "min": 0.025,
    "max": 0.3,
    "price": 26000,
    "color": "#897352",
    "shape": "grouper",
    "pattern": "scales"
  },
  {
    "id": "fish_35",
    "name": "Cá chẽm / vược",
    "maps": [
      "CSONG",
      "GHE",
      "MT"
    ],
    "baits": [
      "crank",
      "shrimp"
    ],
    "tech": [
      "lure",
      "iso",
      "bottom"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 15,
    "price": 30000,
    "color": "#8a6570",
    "shape": "grouper",
    "pattern": "scales"
  },
  {
    "id": "fish_36",
    "name": "Cá đối mục",
    "maps": [
      "CSONG",
      "GHE"
    ],
    "baits": [
      "dough"
    ],
    "tech": [
      "iso",
      "don"
    ],
    "depth": "mid",
    "min": 0.15,
    "max": 3,
    "price": 34000,
    "color": "#769c94",
    "shape": "round",
    "pattern": "scales"
  },
  {
    "id": "fish_37",
    "name": "Cá mú chấm cam",
    "maps": [
      "GHE",
      "CSONG"
    ],
    "baits": [
      "shrimp",
      "lure",
      "clam"
    ],
    "tech": [
      "iso",
      "bottom",
      "lure"
    ],
    "depth": "bottom",
    "min": 0.4,
    "max": 12,
    "price": 38000,
    "color": "#c4a269",
    "shape": "grouper",
    "pattern": "spots"
  },
  {
    "id": "fish_38",
    "name": "Cá mú mè",
    "maps": [
      "GHE"
    ],
    "baits": [
      "livefish",
      "shrimp"
    ],
    "tech": [
      "bottom",
      "iso"
    ],
    "depth": "bottom",
    "min": 0.5,
    "max": 20,
    "price": 42000,
    "color": "#608577",
    "shape": "grouper",
    "pattern": "spots"
  },
  {
    "id": "fish_39",
    "name": "Cá hồng bạc",
    "maps": [
      "CSONG",
      "GHE"
    ],
    "baits": [
      "shrimp",
      "crank"
    ],
    "tech": [
      "iso",
      "lure"
    ],
    "depth": "mid",
    "min": 0.2,
    "max": 7,
    "price": 46000,
    "color": "#a8b3ab",
    "shape": "grouper",
    "pattern": "scales"
  },
  {
    "id": "fish_40",
    "name": "Cá hồng chấm đen",
    "maps": [
      "GHE",
      "CSONG"
    ],
    "baits": [
      "shrimp"
    ],
    "tech": [
      "iso",
      "bottom"
    ],
    "depth": "mid",
    "min": 0.15,
    "max": 2,
    "price": 18000,
    "color": "#7683a0",
    "shape": "grouper",
    "pattern": "spots"
  },
  {
    "id": "fish_41",
    "name": "Cá dìa chấm",
    "maps": [
      "GHE",
      "CSONG"
    ],
    "baits": [
      "leaf",
      "dough"
    ],
    "tech": [
      "iso"
    ],
    "depth": "mid",
    "min": 0.1,
    "max": 1.5,
    "price": 22000,
    "color": "#b08b4c",
    "shape": "round",
    "pattern": "spots"
  },
  {
    "id": "fish_42",
    "name": "Cá dìa công",
    "maps": [
      "GHE"
    ],
    "baits": [
      "leaf",
      "dough"
    ],
    "tech": [
      "iso"
    ],
    "depth": "mid",
    "min": 0.1,
    "max": 2,
    "price": 26000,
    "color": "#899d86",
    "shape": "round",
    "pattern": "stripes"
  },
  {
    "id": "fish_43",
    "name": "Cá chim vây vàng",
    "maps": [
      "GHE"
    ],
    "baits": [
      "shrimp",
      "spoon"
    ],
    "tech": [
      "iso",
      "lure"
    ],
    "depth": "mid",
    "min": 0.2,
    "max": 5,
    "price": 30000,
    "color": "#547d82",
    "shape": "round",
    "pattern": "scales"
  },
  {
    "id": "fish_44",
    "name": "Cá tráp vây vàng",
    "maps": [
      "CSONG",
      "GHE"
    ],
    "baits": [
      "shrimp",
      "worm",
      "clam"
    ],
    "tech": [
      "iso",
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.15,
    "max": 2.5,
    "price": 34000,
    "color": "#897352",
    "shape": "round",
    "pattern": "scales"
  },
  {
    "id": "fish_45",
    "name": "Cá tráp đen",
    "maps": [
      "GHE"
    ],
    "baits": [
      "shrimp",
      "clam"
    ],
    "tech": [
      "iso",
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.2,
    "max": 4,
    "price": 38000,
    "color": "#8a6570",
    "shape": "round",
    "pattern": "stripes"
  },
  {
    "id": "fish_46",
    "name": "Cá nhồng vàng",
    "maps": [
      "GHE"
    ],
    "baits": [
      "crank",
      "spoon"
    ],
    "tech": [
      "lure"
    ],
    "depth": "mid",
    "min": 0.15,
    "max": 1.2,
    "price": 42000,
    "color": "#769c94",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_47",
    "name": "Cá cháo lớn",
    "maps": [
      "CSONG"
    ],
    "baits": [
      "lure"
    ],
    "tech": [
      "lure"
    ],
    "depth": "surface",
    "min": 0.2,
    "max": 3,
    "price": 46000,
    "color": "#c4a269",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_48",
    "name": "Cá măng sữa",
    "maps": [
      "CSONG"
    ],
    "baits": [
      "dough"
    ],
    "tech": [
      "iso"
    ],
    "depth": "mid",
    "min": 0.3,
    "max": 6,
    "price": 18000,
    "color": "#608577",
    "shape": "long",
    "pattern": "scales"
  },
  {
    "id": "fish_49",
    "name": "Cá đù bạc",
    "maps": [
      "GHE"
    ],
    "baits": [
      "shrimp",
      "worm"
    ],
    "tech": [
      "bottom"
    ],
    "depth": "bottom",
    "min": 0.1,
    "max": 1,
    "price": 22000,
    "color": "#a8b3ab",
    "shape": "grouper",
    "pattern": "scales"
  },
  {
    "id": "fish_50",
    "name": "Cá đục",
    "maps": [
      "CSONG",
      "GHE"
    ],
    "baits": [
      "worm",
      "shrimp"
    ],
    "tech": [
      "bottom",
      "don"
    ],
    "depth": "bottom",
    "min": 0.03,
    "max": 0.25,
    "price": 26000,
    "color": "#7683a0",
    "shape": "long",
    "pattern": "scales"
  }
];

export const RODS = [
  {
    "id": "bamboo",
    "name": "Cần tre ao",
    "tech": "don",
    "power": 1.2,
    "price": 0,
    "note": "Cần tay khởi đầu. Nhẹ, hợp cá nhỏ và giun ở bờ gần.",
    "label": "Câu đơn"
  },
  {
    "id": "dai",
    "name": "Cần Đài 3.6",
    "tech": "dai",
    "power": 2,
    "price": 45000,
    "note": "Câu phao với mồi bột, ngô, mồi mây. Hợp ao và hồ thả cá.",
    "label": "Câu Đài"
  },
  {
    "id": "spinning",
    "name": "Bộ lure nhập môn",
    "tech": "lure",
    "power": 2.7,
    "price": 60000,
    "note": "Có máy và mồi mềm. Bật thu mồi để dụ cá săn mồi.",
    "label": "Lure"
  },
  {
    "id": "fiber",
    "name": "Cần tay sợi thủy tinh",
    "tech": "don",
    "power": 2.4,
    "price": 24000,
    "note": "Bền hơn cần tre. Dẫn cá vừa ở kênh và suối.",
    "label": "Câu đơn"
  },
  {
    "id": "travel",
    "name": "Cần rút du ngoạn",
    "tech": "don",
    "power": 3.2,
    "price": 50000,
    "note": "Bộ câu tay linh hoạt cho những chuyến đi xa.",
    "label": "Câu đơn"
  },
  {
    "id": "dai45",
    "name": "Cần Đài carbon 4.5",
    "tech": "dai",
    "power": 4,
    "price": 82000,
    "note": "Cân phao tìm chép, trắm và mè ở hồ rộng.",
    "label": "Câu Đài"
  },
  {
    "id": "dai54",
    "name": "Cần Đài carbon 5.4",
    "tech": "dai",
    "power": 6.5,
    "price": 145000,
    "note": "Sức tải cao cho cá hồ lớn. Vẫn dùng phao và mồi tự nhiên.",
    "label": "Câu Đài"
  },
  {
    "id": "spinmedium",
    "name": "Spinning trung tải",
    "tech": "lure",
    "power": 6,
    "price": 110000,
    "note": "Thu mồi mềm, crankbait và popper ở hồ, kênh, cửa sông.",
    "label": "Lure"
  },
  {
    "id": "spinheavy",
    "name": "Spinning đại ngư",
    "tech": "lure",
    "power": 11,
    "price": 240000,
    "note": "Dành cho cá săn mồi lớn. Kết hợp máy và dây khỏe.",
    "label": "Lure"
  },
  {
    "id": "bottom36",
    "name": "Cần đáy 3.6",
    "tech": "bottom",
    "power": 7.5,
    "price": 95000,
    "note": "Đặt mồi sát đáy, đọc tín hiệu dây và đầu cần. Có máy, không dùng phao.",
    "label": "Câu đáy"
  },
  {
    "id": "bottom42",
    "name": "Cần đáy chịu tải 4.2",
    "tech": "bottom",
    "power": 15,
    "price": 265000,
    "note": "Đối đầu cá da trơn và cá đáy lớn ở lòng đập, sông, biển.",
    "label": "Câu đáy"
  },
  {
    "id": "iso53",
    "name": "Cần ISO bờ biển 5.3",
    "tech": "iso",
    "power": 9,
    "price": 180000,
    "note": "Câu phao với máy ở nước lợ và ghềnh biển. Hợp tôm, rong và mồi bột.",
    "label": "ISO biển"
  }
];

export const BAITS = [
  {
    "id": "worm",
    "name": "Giun",
    "mass": 0.08,
    "price": 1000,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Mồi nhập môn cho rô, diếc, trê và bống. Đào miễn phí ở bàn đồ."
  },
  {
    "id": "dough",
    "name": "Mồi bột",
    "mass": 0.12,
    "price": 1800,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Chép, diếc, rô phi, trôi; cũng tìm được cá đối và dìa với bộ hợp."
  },
  {
    "id": "corn",
    "name": "Ngô",
    "mass": 0.1,
    "price": 1600,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Tìm chép và trắm cỏ ở ao, hồ và hồ dịch vụ."
  },
  {
    "id": "cloudbait",
    "name": "Mồi mây",
    "mass": 0.1,
    "price": 2000,
    "amount": 12,
    "tech": [
      "dai",
      "bottom"
    ],
    "note": "Câu cá mè giữa nước bằng cần Đài hoặc cần đáy."
  },
  {
    "id": "lure",
    "name": "Mồi mềm",
    "mass": 0,
    "price": 0,
    "amount": 1,
    "tech": [
      "lure"
    ],
    "reusable": true,
    "note": "Đi kèm mọi cần lure. Dùng lại, dụ lóc, thát lát cườm, mú và cá cháo."
  },
  {
    "id": "shrimp",
    "name": "Tôm",
    "mass": 0.16,
    "price": 3200,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Bống tượng, cá lăng, mú, hồng và tráp. Chọn đúng tầng nước."
  },
  {
    "id": "livefish",
    "name": "Cá mồi",
    "mass": 0.24,
    "price": 4200,
    "amount": 8,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Mồi cho cá săn mồi lớn: trê phi, lăng, chiên, nheo và mú mè."
  },
  {
    "id": "cricket",
    "name": "Dế",
    "mass": 0.06,
    "price": 1800,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Tìm cá bỗng và chày mắt đỏ trong suối và sông."
  },
  {
    "id": "snail",
    "name": "Ốc",
    "mass": 0.2,
    "price": 3000,
    "amount": 10,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Mồi đặc trưng cho trắm đen khi câu đáy ở ao và hồ."
  },
  {
    "id": "leaf",
    "name": "Rong lá",
    "mass": 0.07,
    "price": 2200,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Dành cho cá dìa tại cửa sông và ghềnh biển, dùng bộ ISO."
  },
  {
    "id": "pellet",
    "name": "Cám viên",
    "mass": 0.13,
    "price": 2400,
    "amount": 12,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Mồi gọn cho cá tra, basa tại kênh Miền Tây và hồ dịch vụ."
  },
  {
    "id": "clam",
    "name": "Thịt nghêu",
    "mass": 0.18,
    "price": 3600,
    "amount": 10,
    "tech": [
      "don",
      "dai",
      "bottom",
      "iso"
    ],
    "note": "Tìm cá mú và tráp ở tầng đáy ghềnh biển, cửa sông."
  },
  {
    "id": "crank",
    "name": "Crankbait",
    "mass": 0,
    "price": 12000,
    "amount": 1,
    "tech": [
      "lure"
    ],
    "reusable": true,
    "note": "Mồi giả thân cứng, thu mồi để dụ lóc bông, chẽm, hồng và nhồng."
  },
  {
    "id": "spoon",
    "name": "Thìa kim loại",
    "mass": 0,
    "price": 9000,
    "amount": 1,
    "tech": [
      "lure"
    ],
    "reusable": true,
    "note": "Ánh kim thu hút cá chim vây vàng và nhồng ở ghềnh biển."
  },
  {
    "id": "popper",
    "name": "Popper nhái",
    "mass": 0,
    "price": 15000,
    "amount": 1,
    "tech": [
      "lure"
    ],
    "reusable": true,
    "note": "Mồi giả nổi dùng lại. Tìm lóc bông ở hồ và kênh Miền Tây."
  }
];

export const BAGS = [
  {id:'cloth',name:'Túi vải đơn giản',price:0,rods:1,baits:2,accessories:5,color:'#ab9470',note:'Gọn nhẹ cho một buổi câu gần nhà.'},
  {id:'canvas',name:'Bao cần vải dù',price:9000,rods:2,baits:3,accessories:8,color:'#6f8560',note:'Mang thêm cần dự phòng, mồi và vài bộ thẻo.'},
  {id:'waterproof',name:'Túi câu chống nước',price:24000,rods:3,baits:5,accessories:12,color:'#426c70',note:'Nhiều ngăn cho chuyến câu dài và nhiều kỹ thuật.'},
  {id:'expedition',name:'Bao đồ câu đại ngư',price:52000,rods:5,baits:8,accessories:18,color:'#866a4b',note:'Đủ chỗ cho nhiều bộ cần và phụ kiện thay thế.'}
];

export const ACCESSORY_SLOTS = {
  "line": "Dây & thẻo",
  "hook": "Lưỡi câu",
  "float": "Phao",
  "reel": "Máy câu",
  "net": "Vợt"
};

export const ACCESSORIES = [
  {
    "id": "line_basic",
    "slot": "line",
    "name": "Chỉ khâu của vợ",
    "price": 0,
    "diameter": 0.20,
    "power": 0,
    "grace": 0,
    "effect": "Chỉ may miễn phí, rất yếu; chỉ nên câu cá nhỏ.",
    "assetKey": "sewing-thread", "breakingStrengthKg": 0.5, "stretchScore": 12, "abrasionScore": 5
  },
  {
    "id": "leader12", "slot": "line", "name": "Bộ thẻo mảnh 0,12 mm", "price": 3500,
    "diameter": 0.12, "approach": 1.18, "power": -0.15, "grace": -0.10,
    "effect": "Thẻo 0,12 mm · Cá thăm mồi nhanh hơn 18%; sức tải và thời gian chịu lực đỏ giảm nhẹ."
  },
  {
    "id": "leader16", "slot": "line", "name": "Bộ thẻo mềm 0,16 mm", "price": 5000,
    "diameter": 0.16, "approach": 1.10, "power": -0.08, "grace": -0.05,
    "effect": "Thẻo 0,16 mm · Cá thăm mồi nhanh hơn 10%; sức tải và thời gian chịu lực đỏ giảm nhẹ."
  },
  {
    "id": "line18",
    "slot": "line",
    "name": "Cước Nylon Monofilament 100m", "assetKey": "nylon", "breakingStrengthKg": 3.5, "stretchScore": 75, "abrasionScore": 60,
    "price": 6000,
    "diameter": 0.18,
    "power": 0.4,
    "grace": 0.05,
    "effect": "+0,4 sức tải · +0,05 giây chịu lực đỏ."
  },
  {
    "id": "fluoro",
    "slot": "line",
    "name": "Dây fluorocarbon",
    "price": 16000,
    "diameter": 0.18,
    "power": 0.9,
    "grace": 0.12,
    "effect": "+0,9 sức tải · +0,12 giây chịu lực đỏ."
  },
  {
    "id": "braid",
    "slot": "line",
    "name": "Cước SW PE 100m", "assetKey": "pe", "breakingStrengthKg": 7.5, "stretchScore": 10, "abrasionScore": 45,
    "price": 38000,
    "diameter": 0.28,
    "power": 1.8,
    "grace": 0.25,
    "effect": "+1,8 sức tải · +0,25 giây chịu lực đỏ."
  },
  {
    "id": "line_copolymer",
    "slot": "line",
    "name": "Cước Co-polymer 100m",
    "price": 12000,
    "power": 0.7,
    "grace": 0.1,
    "effect": "Cước cân bằng, chịu mài mòn khá; +0,7 sức tải · +0,1 giây chịu lực đỏ.",
    "assetKey": "copolymer", "breakingStrengthKg": 4.2, "stretchScore": 55, "abrasionScore": 75
  },
  {
    "id": "hook_basic",
    "slot": "hook",
    "name": "Lưỡi đơn cơ bản",
    "price": 0,
    "bite": 0,
    "slack": 0,
    "effect": "Nhịp giật cơ bản 2,8 giây."
  },
  {
    "id": "hook_barb",
    "slot": "hook",
    "name": "Lưỡi giữ mồi",
    "price": 4500,
    "bite": 0.2,
    "slack": 0.15,
    "effect": "+0,2 giây giật · +0,15 giây chống tuột."
  },
  {
    "id": "hook_wide",
    "slot": "hook",
    "name": "Lưỡi bụng rộng",
    "price": 11000,
    "bite": 0.4,
    "slack": 0.3,
    "effect": "+0,4 giây giật · +0,3 giây chống tuột."
  },
  {
    "id": "hook_pro",
    "slot": "hook",
    "name": "Lưỡi đại ngư",
    "price": 26000,
    "bite": 0.6,
    "slack": 0.5,
    "effect": "+0,6 giây giật · +0,5 giây chống tuột."
  },
  {
    "id": "float_basic",
    "slot": "float",
    "name": "Phao lau ao làng",
    "price": 0,
    "capacity": 1.4,
    "stability": 0,
    "effect": "Sức nổi 1,4 g · Cân về 4 vạch."
  },
  {
    "id": "float_canal",
    "slot": "float",
    "name": "Phao kênh ổn định",
    "price": 7000,
    "capacity": 1.6,
    "stability": 0.4,
    "effect": "Sức nổi 1,6 g · Giảm 40% lực nước khi dẫn cá."
  },
  {
    "id": "float_slender",
    "slot": "float",
    "name": "Phao Đài thanh",
    "price": 17000,
    "capacity": 1.9,
    "stability": 0.7,
    "effect": "Sức nổi 1,9 g · Giảm 70% lực nước khi dẫn cá."
  },
  {
    "id": "float_sea",
    "slot": "float",
    "name": "Phao ISO sóng biển",
    "price": 32000,
    "capacity": 2.4,
    "stability": 0.85,
    "effect": "Sức nổi 2,4 g · Giảm 85% lực nước khi dẫn cá."
  },
  {
    "id": "reel_basic",
    "slot": "reel",
    "name": "Máy nhập môn",
    "price": 0,
    "power": 0,
    "speed": 0,
    "effect": "Đi kèm cần có máy. Cần tay không dùng máy."
  },
  {
    "id": "reel2000",
    "slot": "reel",
    "name": "Máy quay 2000",
    "price": 18000,
    "power": 0.8,
    "speed": 0.08,
    "effect": "+0,8 sức tải · Dẫn cá nhanh hơn 8% khi dùng máy."
  },
  {
    "id": "reel4000",
    "slot": "reel",
    "name": "Máy quay 4000",
    "price": 42000,
    "power": 1.8,
    "speed": 0.16,
    "effect": "+1,8 sức tải · Dẫn cá nhanh hơn 16% khi dùng máy."
  },
  {
    "id": "reel6000",
    "slot": "reel",
    "name": "Máy biển 6000",
    "price": 82000,
    "power": 3.2,
    "speed": 0.25,
    "effect": "+3,2 sức tải · Dẫn cá nhanh hơn 25% khi dùng máy."
  },
  {
    "id": "net_basic",
    "slot": "net",
    "name": "Vợt tre cơ bản",
    "price": 0,
    "land": 0,
    "effect": "Đưa cá lên bờ khi sức cá về 0%."
  },
  {
    "id": "net_fold",
    "slot": "net",
    "name": "Vợt gấp",
    "price": 9000,
    "land": 6,
    "effect": "Vớt sớm khi sức cá còn 6%."
  },
  {
    "id": "net_long",
    "slot": "net",
    "name": "Vợt cán dài",
    "price": 24000,
    "land": 10,
    "effect": "Vớt sớm khi sức cá còn 10%."
  },
  {
    "id": "net_pro",
    "slot": "net",
    "name": "Vợt đại ngư",
    "price": 48000,
    "land": 15,
    "effect": "Vớt sớm khi sức cá còn 15%."
  }
];

export const LESSONS = [
  {
    "id": "signal",
    "name": "Đọc phao",
    "question": "Phao chỉ rung nhẹ rồi trở lại. Bạn làm gì?",
    "options": [
      "Chờ tín hiệu rõ hơn",
      "Giật cần ngay",
      "Thu hết dây"
    ],
    "answer": 0,
    "explain": "Rung có thể là gió hoặc cá thăm mồi. Trong bản game này, giật khi phao chìm rõ sẽ đóng lưỡi."
  },
  {
    "id": "tension",
    "name": "Dẫn cá",
    "question": "Lực căng đã vượt vùng đỏ. Bạn làm gì?",
    "options": [
      "Kéo mạnh hơn",
      "Nới lực, chờ cá dịu",
      "Bỏ cần"
    ],
    "answer": 1,
    "explain": "Nới lực giúp giảm tải. Khi lực trở lại vùng xanh, tiếp tục dẫn cá; thả quá chùng cũng dễ mất cá."
  },
  {
    "id": "depth",
    "name": "Chọn tầng nước",
    "question": "Muốn tìm cá ăn đáy tại điểm sâu 1,8 m, chọn mồi ở đâu?",
    "options": [
      "Sát mặt nước",
      "Gần đáy 1,8 m",
      "Cố định 3,2 m ở mọi điểm"
    ],
    "answer": 1,
    "explain": "Trong mô hình game, cá ăn đáy tiếp cận mồi gần độ sâu của điểm câu. Cá giữa nước cần tầng nông hơn."
  }
];

export const getMap = id => MAPS.find(x=>x.id===id) || MAPS[0];
export const getRod = id => RODS.find(x=>x.id===id) || RODS[0];
export const getBait = id => BAITS.find(x=>x.id===id) || BAITS[0];
export const getFish = id => FISH.find(x=>x.id===id);
export const getAccessory = id => ACCESSORIES.find(x=>x.id===id);
export const getBag = id => BAGS.find(x=>x.id===id) || BAGS[0];
export const usesFloat = rod => !!TECHNIQUES[rod.tech]?.float;
export const usesReel = rod => !!TECHNIQUES[rod.tech]?.reel;
export const acceptsBait = (rod,bait) => bait.tech.includes(rod.tech);
export const slotItem = (player,slot) => ACCESSORIES.find(a=>a.id===player.equipment?.[slot]&&a.slot===slot) || ACCESSORIES.find(a=>a.slot===slot&&a.price===0);
export function loadoutStats(player){
 const rod=getRod(player.rod),line=slotItem(player,'line'),hook=slotItem(player,'hook'),float=slotItem(player,'float'),reel=usesReel(rod)?slotItem(player,'reel'):null,net=slotItem(player,'net');
 return {power:rod.power+line.power+(reel?.power||0),biteWindow:2.8+hook.bite,breakGrace:.75+line.grace,slackGrace:2+hook.slack,drain:1+(reel?.speed||0),landAt:net.land,capacity:float.capacity,stability:usesFloat(rod)?float.stability:0,leaderDiameter:line.diameter||.20,baitApproach:line.approach||1};
}
