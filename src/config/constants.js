/**
 * Constantes globales du jeu.
 * Centralise les valeurs d'équilibrage pour éviter les "nombres magiques"
 * dispersés dans les scènes et les entités.
 */

// --- Résolution de référence ---
// Toute la logique de jeu raisonne dans ce repère ; Phaser met ensuite
// le canvas à l'échelle de l'écran réel (voir la config `scale` dans main.js).
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// --- Physique ---
export const GRAVITY_Y = 900;

// Passer à true pour afficher les hitboxes Arcade Physics.
export const DEBUG_PHYSICS = false;

// --- Sol ---
export const GROUND_HEIGHT = 60;
export const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT / 2;

// --- Zone de déplacement brawler ---
// La zone laisse 100 px sous son bord et 140 px au-dessus dans la fenêtre.
export const ARENA = {
  TOP: GAME_HEIGHT - 300,
  BOTTOM: GAME_HEIGHT - 100,
};

// --- Joueur ---
export const PLAYER = {
  WIDTH: 44,
  HEIGHT: 72,
  MAX_HEALTH: 100,
  SPEED: 260,
  JUMP_VELOCITY: -540,
  BOTTOM_MARGIN_RATIO: 0.15,
  SPAWN_X: 180,
  SPAWN_Y: GAME_HEIGHT - GROUND_HEIGHT - 120,
};

// --- Ennemi (V0 : cible immobile) ---
export const ENEMY = {
  WIDTH: 44,
  HEIGHT: 72,
  MAX_HEALTH: 3,
  SPAWN_X: 700,
  SPAWN_Y: GAME_HEIGHT - GROUND_HEIGHT - 120
};

// --- Attaque ---
export const ATTACK = {
  WIDTH: 46,
  HEIGHT: 48,
  // Décalage horizontal de la hitbox par rapport au centre du joueur.
  OFFSET_X: 40,
  // Durée d'activité de la hitbox, en millisecondes.
  DURATION: 120,
  // Délai minimal entre deux attaques, en millisecondes.
  COOLDOWN: 320,
  DAMAGE: 1,
};

// --- Couleurs des placeholders (V0, avant les vrais sprites) ---
export const COLORS = {
  BACKGROUND: 0x1d1f27,
  ARENA: 0x292d3a,
  GROUND: 0x3c4256,
  PLAYER: 0x4ea8de,
  ENEMY: 0xd7263d,
  ENEMY_HIT: 0xffffff,
  ATTACK: 0xffd166,
};
