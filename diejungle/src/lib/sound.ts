// sound.ts — DIE JUNGLE audio system (placeholders — wire real files when assets arrive)
// Each SFX key has a description of the expected ambiance/feel.

export type SoundKey =
  // Background music — one per biome
  | 'bgm_jungle'    // Zone 1: jungle ambient, slow tribal percussion, mysterious
  | 'bgm_ruins'     // Zone 2: more intense, tribal drums, ancient energy
  | 'bgm_temple'    // Zone 3: maximum tension, dark drones, eerie
  | 'bgm_abyss'     // Zone 4: full darkness, low bass pulses, void
  | 'bgm_boss'      // Boss theme: epic, threatening, fast-paced
  // SFX — combat
  | 'sfx_dice_roll'    // Dice tumbling on stone — satisfying rattle
  | 'sfx_dice_place'   // Soft thunk of die placement
  | 'sfx_resolve'      // Whoosh + impact — turn resolving
  | 'sfx_attack'       // Sharp blade impact
  | 'sfx_heal'         // Soft, warm healing tone
  | 'sfx_shield'       // Metal clink — shield activated
  | 'sfx_kill'         // Satisfying crunch — normal enemy kill
  | 'sfx_kill_elite'   // More intense version — elite kill
  | 'sfx_kill_boss'    // Epic long explosion — boss kill
  | 'sfx_surge'        // Electric crackle — SURGE triggered
  | 'sfx_player_hit'   // Grunt + impact — player takes damage
  | 'sfx_gameover'     // Dark, heavy thud — player dies
  // SFX — UI
  | 'sfx_artifact'     // Magical chime — new artifact
  | 'sfx_levelup'      // Triumphant short sting — zone advance
  | 'sfx_reroll'       // Light mechanical click — reroll
  | 'sfx_button_tap'   // Soft tap — generic UI
  | 'sfx_shop_open'    // Jungle market ambience sting
  | 'sfx_purchase'     // Coin drop — buy item
  | 'sfx_timer_tick'   // Soft tick — countdown timer each second
  | 'sfx_timer_urgent' // Faster tick — under 3 seconds remaining;

export interface SoundSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;  // 0–100
  sfxVolume: number;  // 0–100
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 60,
  sfxVolume: 80,
};

// ─── Sound URLs ────────────────────────────────────────────────────────────────
// Replace '' with actual CDN/local file paths when audio assets are ready
const SOUND_URLS: Record<SoundKey, string> = {
  bgm_jungle: '',
  bgm_ruins: '',
  bgm_temple: '',
  bgm_abyss: '',
  bgm_boss: '',
  sfx_dice_roll: '',
  sfx_dice_place: '',
  sfx_resolve: '',
  sfx_attack: '',
  sfx_heal: '',
  sfx_shield: '',
  sfx_kill: '',
  sfx_kill_elite: '',
  sfx_kill_boss: '',
  sfx_surge: '',
  sfx_player_hit: '',
  sfx_gameover: '',
  sfx_artifact: '',
  sfx_levelup: '',
  sfx_reroll: '',
  sfx_button_tap: '',
  sfx_shop_open: '',
  sfx_purchase: '',
  sfx_timer_tick: '',
  sfx_timer_urgent: '',
};

// ─── Audio instances ───────────────────────────────────────────────────────────
let currentBgm: HTMLAudioElement | null = null;
let settings: SoundSettings = { ...DEFAULT_SOUND_SETTINGS };

export function setSoundSettings(s: SoundSettings) {
  settings = s;
  if (currentBgm) {
    currentBgm.volume = settings.bgmVolume / 100;
    if (!settings.bgmEnabled) currentBgm.pause();
  }
}

export function playBgm(key: SoundKey) {
  const url = SOUND_URLS[key];
  if (!url || !settings.bgmEnabled) return;
  if (currentBgm) { currentBgm.pause(); currentBgm = null; }
  try {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = settings.bgmVolume / 100;
    audio.play().catch(() => {});
    currentBgm = audio;
  } catch { /* placeholder — no-op until assets exist */ }
}

export function stopBgm() {
  if (currentBgm) { currentBgm.pause(); currentBgm = null; }
}

export function playSfx(key: SoundKey) {
  const url = SOUND_URLS[key];
  if (!url || !settings.sfxEnabled) return;
  try {
    const audio = new Audio(url);
    audio.volume = settings.sfxVolume / 100;
    audio.play().catch(() => {});
  } catch { /* placeholder — no-op until assets exist */ }
}

// ─── BGM per biome ─────────────────────────────────────────────────────────────
export function bgmKeyForBiome(biomeId: string): SoundKey {
  if (biomeId === 'ruins')  return 'bgm_ruins';
  if (biomeId === 'temple') return 'bgm_temple';
  if (biomeId === 'abyss')  return 'bgm_abyss';
  return 'bgm_jungle';
}
