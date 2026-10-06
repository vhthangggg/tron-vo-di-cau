-- Offline persistence contract v0.1. Enable PRAGMA for each SQLite connection.
-- Static JSON content is the primary design source; this DDL is a normalized alternative.
PRAGMA foreign_keys = ON;
CREATE TABLE content_version (version TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE species (
  species_id TEXT PRIMARY KEY, name_vi TEXT NOT NULL,
  scientific_name_candidate TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK(review_status IN ('draft','pending','approved','deprecated')),
  content_json TEXT NOT NULL
);
CREATE TABLE species_alias (
  species_id TEXT NOT NULL REFERENCES species(species_id), region TEXT NOT NULL,
  alias_vi TEXT NOT NULL, source_url TEXT, approved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(species_id,region,alias_vi)
);
CREATE TABLE map_definition (map_id TEXT PRIMARY KEY, name_vi TEXT NOT NULL, content_json TEXT NOT NULL);
CREATE TABLE map_population (
  map_id TEXT NOT NULL REFERENCES map_definition(map_id),
  species_id TEXT NOT NULL REFERENCES species(species_id), approved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(map_id,species_id)
);
CREATE TABLE spot (spot_id TEXT PRIMARY KEY, map_id TEXT NOT NULL REFERENCES map_definition(map_id), content_json TEXT NOT NULL);
CREATE TABLE item_definition (
  item_id TEXT PRIMARY KEY, name_vi TEXT NOT NULL, category TEXT NOT NULL,
  price_xu INTEGER NOT NULL CHECK(price_xu>=0), is_fictional INTEGER NOT NULL DEFAULT 1,
  stats_json TEXT NOT NULL, content_json TEXT NOT NULL
);
CREATE TABLE profile (profile_id TEXT PRIMARY KEY, wallet_xu INTEGER NOT NULL CHECK(wallet_xu>=0), reputation INTEGER NOT NULL DEFAULT 0);
CREATE TABLE item_instance (
  instance_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  item_id TEXT NOT NULL REFERENCES item_definition(item_id),
  quantity INTEGER NOT NULL CHECK(quantity>=0), durability REAL CHECK(durability BETWEEN 0 AND 1)
);
CREATE TABLE rig_preset (rig_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(profile_id), name TEXT NOT NULL, technique TEXT NOT NULL, config_json TEXT NOT NULL);
CREATE TABLE rig_component (
  rig_id TEXT NOT NULL REFERENCES rig_preset(rig_id), slot TEXT NOT NULL,
  instance_id TEXT NOT NULL REFERENCES item_instance(instance_id), knot_json TEXT,
  PRIMARY KEY(rig_id,slot)
);
CREATE TABLE session (
  session_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  map_id TEXT NOT NULL REFERENCES map_definition(map_id), mode TEXT NOT NULL,
  started_clock REAL NOT NULL, state_json TEXT NOT NULL
);
CREATE TABLE world_fish (
  fish_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  species_id TEXT NOT NULL REFERENCES species(species_id), map_id TEXT NOT NULL REFERENCES map_definition(map_id),
  weight_kg REAL NOT NULL CHECK(weight_kg>0),
  status TEXT NOT NULL CHECK(status IN ('free','hooked','landed','pending','kept','released','removed')),
  state_json TEXT NOT NULL
);
CREATE TABLE wallet_transaction (
  transaction_id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL REFERENCES profile(profile_id), delta_xu INTEGER NOT NULL,
  reason TEXT NOT NULL, result_json TEXT NOT NULL, game_clock REAL NOT NULL
);
CREATE TABLE catch_event (
  event_id TEXT PRIMARY KEY, fish_id TEXT NOT NULL REFERENCES world_fish(fish_id),
  session_id TEXT NOT NULL REFERENCES session(session_id),
  measured_weight_kg REAL NOT NULL CHECK(measured_weight_kg>0),
  state TEXT NOT NULL CHECK(state IN ('pending','kept','released','sold','delivered')),
  decision_request_id TEXT UNIQUE,
  transaction_id TEXT REFERENCES wallet_transaction(transaction_id),
  game_clock REAL NOT NULL
);
-- Prevent multiple active catch decisions for one fish. Historical release records remain valid.
CREATE UNIQUE INDEX one_active_catch_per_fish ON catch_event(fish_id) WHERE state IN ('pending','kept');
CREATE TABLE lesson_definition (lesson_id TEXT PRIMARY KEY, content_json TEXT NOT NULL);
CREATE TABLE lesson_evidence (
  evidence_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  lesson_id TEXT NOT NULL REFERENCES lesson_definition(lesson_id), passed INTEGER NOT NULL,
  assist_json TEXT NOT NULL, evidence_json TEXT NOT NULL
);
CREATE TABLE certificate (
  profile_id TEXT NOT NULL REFERENCES profile(profile_id), certificate_id TEXT NOT NULL,
  earned_clock REAL NOT NULL, PRIMARY KEY(profile_id,certificate_id)
);
CREATE TABLE discovery (
  profile_id TEXT NOT NULL REFERENCES profile(profile_id), species_id TEXT NOT NULL REFERENCES species(species_id),
  discovery_key TEXT NOT NULL, source_kind TEXT NOT NULL CHECK(source_kind IN ('observation','approved_knowledge','game_hint')),
  evidence_json TEXT NOT NULL, PRIMARY KEY(profile_id,species_id,discovery_key,source_kind)
);
CREATE TABLE product_reference (
  product_id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES item_definition(item_id),
  model_name TEXT NOT NULL, shop_name TEXT NOT NULL, url TEXT,
  real_price_vnd INTEGER CHECK(real_price_vnd IS NULL OR real_price_vnd>=0), checked_at TEXT,
  affiliate_disclosure TEXT, active INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE save_metadata (
  profile_id TEXT PRIMARY KEY REFERENCES profile(profile_id), schema_version INTEGER NOT NULL,
  content_version TEXT NOT NULL, rng_state TEXT NOT NULL, game_clock REAL NOT NULL
);
-- Catch decisions must use BEGIN IMMEDIATE, check prior request_id, then verify pending fish/event,
-- update world_fish and catch_event, insert transaction, and adjust wallet in a single COMMIT.
-- The DDL enforces identifiers; the application must also enforce valid state transitions.
