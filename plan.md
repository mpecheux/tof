# Plan de développement — Jeu 2D de bagarre façon Streets of Rage

## 1. Choix techniques et contraintes

- **Stack retenue** : Phaser 4 + JavaScript (pas de TypeScript) + Vite comme bundler/dev-server, déploiement sur **GitHub Pages**.
- **Pourquoi ce choix** :
  - Phaser est un moteur 2D mature, orienté arcade/plateforme/beat-them-all, avec gestion native des sprites, animations, physiques (Arcade Physics), collisions, caméra, scènes.
  - La version installée est **Phaser 4.2.x** (et non Phaser 3 comme envisagé initialement) : l'API cœur utilisée dans ce plan (scènes, `Phaser.AUTO`, `Phaser.Scale.FIT`, Arcade Physics, groupes, animations) reste compatible.
  - Vite offre un dev-server rapide (HMR quasi instantané) et un build de production optimisé, sans configuration lourde.
  - JavaScript pur réduit la friction de démarrage (pas de configuration TS) ; on pourra migrer vers TS plus tard si besoin.
  - GitHub Pages est gratuit, simple à automatiser via GitHub Actions, et suffisant pour un jeu 100% client (pas de backend).
- **Contraintes à garder en tête tout au long du projet** :
  - Le canvas doit être **responsive** : s'adapter à toutes les tailles d'écran (desktop large, tablette, mobile portrait/paysage) sans déformer le rendu.
  - Les **contrôles tactiles** (joystick virtuel + boutons d'action) doivent être superposés au canvas en HTML/CSS ou en objets Phaser fixés à la caméra, activés uniquement sur les appareils tactiles.
  - La **performance mobile** doit être surveillée dès la V2 (nombre de sprites, particules, taille des textures, résolution).
  - L'**audio sur iOS/Safari** ne démarre qu'après une interaction utilisateur explicite (tap/clic) : prévoir un écran/bouton de démarrage qui débloque le contexte audio.
  - **Spécificités Phaser 4** à surveiller : le rendu est orienté WebGL en priorité (repli Canvas plus limité qu'en v3), et l'écosystème de plugins tiers conçus pour Phaser 3 (ex. `phaser3-rex-plugins`) n'est pas garanti compatible — prévoir une solution maison pour le joystick virtuel (voir section 8).
  - Toujours garder le jeu jouable **au clavier** (desktop) **et au tactile** (mobile) en parallèle, sans régression de l'un quand on ajoute l'autre.

---

## 2. Initialisation du projet

> **Statut : étapes 1 à 4 et 7 réalisées.** Le template Vite vanilla est généré, Phaser 4.2.1 est installé, l'arborescence cible et `vite.config.js` sont en place, `.gitignore` est correct. Restent les étapes 5, 6, 8 et 9.

### Prérequis

- Node.js LTS installé (vérifier avec `node -v`, viser une version 18+).
- Le dépôt git est déjà initialisé (dossier courant).

### Étapes

1. ✅ Créer le projet Vite en mode "vanilla" à la racine du dépôt :

```bash
npm create vite@latest . -- --template vanilla
```

2. ✅ Installer Phaser :

```bash
npm install phaser
```

3. ✅ Créer la structure de dossiers cible :

```
/
├── public/                       # servi en statique par Vite, copié tel quel au build
│   ├── favicon.svg
│   └── assets/                    # tous les assets chargés au runtime par Phaser
│       ├── characters/             # spritesheets joueur
│       ├── enemies/                # spritesheets ennemis/boss
│       ├── backgrounds/            # décors, parallax
│       ├── effects/                # particules, impacts
│       └── sounds/                 # musiques + bruitages
├── src/
│   ├── main.js                    # point d'entrée, config Phaser + lancement du jeu
│   ├── config/                     # constantes globales (résolution, physique, touches…)
│   ├── scenes/                     # Boot, Preload, Menu, Game, Pause, GameOver…
│   ├── entities/                   # Player, Enemy, Boss, Item… (classes)
│   ├── systems/                    # HealthSystem, InputSystem, VirtualJoystick, AudioManager…
│   └── ui/                         # HUD, barres de vie, menus (si séparé de scenes)
├── tests/                         # tests éventuels (unitaires sur la logique pure)
├── vite.config.js
├── .gitignore
└── package.json
```

> **Important** : les assets chargés dynamiquement par Phaser (`this.load.image(...)`, `this.load.audio(...)`) doivent vivre dans `public/assets/` pour être servis en statique et copiés à l'identique dans `dist/` au build. On les référence via un chemin absolu tenant compte du `base` Vite, par exemple `` `${import.meta.env.BASE_URL}assets/characters/hero.png` ``. Le dossier `src/assets/` reste réservé aux ressources importées par le bundler (icônes du template, CSS…).

4. ✅ Configurer `vite.config.js` pour un déploiement sous un sous-chemin GitHub Pages (remplacer `tof` par le nom réel du dépôt GitHub) :

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tof/',
  server: {
    host: true, // expose le dev-server sur le réseau local (test sur téléphone)
  },
});
```

5. Créer une scène Phaser minimale de validation dans `src/main.js` :

```js
import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  create() {
    this.add.text(20, 20, 'Hello Phaser!', { color: '#ffffff' });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#222222',
  scene: [BootScene],
};

new Phaser.Game(config);
```

6. Adapter `index.html` pour pointer vers `src/main.js` et avoir un `<div id="app">` (ou laisser Phaser créer son propre canvas dans `document.body`). Supprimer les fichiers de démo du template (`src/counter.js`, contenu par défaut de `src/style.css`).

7. ✅ Vérifier que `.gitignore` exclut au minimum `node_modules/` et `dist/`.

8. Lancer le serveur de dev et vérifier l'affichage :

```bash
npm run dev
```

9. Premier commit :

```bash
git add .
git commit -m "chore: initialisation du projet Phaser 4 + Vite"
```

**Critères de "fait"** :
- `npm run dev` lance un serveur local et affiche "Hello Phaser!" sur fond gris dans le navigateur.
- La structure de dossiers ci-dessus existe (même si certains dossiers sont vides avec un `.gitkeep`).
- `.gitignore` est en place, le premier commit est effectué.

---

## 3. Version 0 — Prototype technique

Objectif : valider la boucle de base (mouvement, gravité, attaque, collision, victoire/défaite) avec des formes géométriques simples (rectangles colorés), sans assets graphiques définitifs.

### Étapes

1. Créer `src/config/constants.js` avec les constantes de base : vitesse du joueur, gravité, largeur/hauteur de la zone de jeu.
2. Créer une scène `GameScene` (`src/scenes/GameScene.js`) qui :
   - Active Arcade Physics (`physics: { default: 'arcade', arcade: { gravity: { y: 600 } } }`).
   - Crée un sol (rectangle statique) et un joueur (rectangle dynamique).
3. Déplacer le joueur au clavier :
   - Flèches gauche/droite ou `Q`/`D` (AZERTY) pour se déplacer horizontalement.
   - Touche `espace`/`Z` pour sauter (uniquement si `body.touching.down`).
4. Ajouter une attaque simple :
   - Touche dédiée (ex. `Ctrl` ou `Entrée`) qui crée une zone de collision temporaire (rectangle invisible) devant le joueur pendant quelques frames.
5. Ajouter un ennemi basique (rectangle statique ou immobile) avec une vie (ex. 3 points).
6. Détecter la collision entre la zone d'attaque et l'ennemi (`this.physics.add.overlap`) : décrémenter la vie de l'ennemi, le faire disparaître à 0 PV.
7. Ajouter une condition de victoire (tous les ennemis éliminés → texte "Victoire") et une condition de défaite simple (ex. le joueur touche l'ennemi trop de fois → texte "Défaite").

**Critères de "fait"** :
- Le joueur se déplace et saute avec le clavier, avec une gravité crédible.
- Une pression sur la touche d'attaque fait disparaître l'ennemi après collision.
- Un message "Victoire" ou "Défaite" s'affiche selon l'issue du combat.
- Aucun crash dans la console du navigateur.

---

## 4. Version 1 — Première boucle de jeu

Objectif : transformer le prototype en un mini beat-them-all jouable avec plusieurs ennemis, une IA simple, une barre de vie et un cycle complet victoire/défaite/redémarrage.

### Étapes

1. Passer le déplacement du joueur en **2 axes** (haut/bas/gauche/droite), typique du genre beat-them-all (vue 2.5D à plat, pas de vraie gravité verticale sur l'axe Y de déplacement, ou alors garder le saut vertical séparé — à trancher selon le style visé, ex. déplacement style "brawler" sur un plan XY avec une pseudo-profondeur).
2. Créer une classe `Player` (`src/entities/Player.js`) encapsulant sprite, vie, état (idle/marche/attaque/dégât), et méthodes `move()`, `attack()`, `takeDamage()`.
3. Créer une classe `Enemy` (`src/entities/Enemy.js`) avec une IA simple : se déplacer en direction du joueur (`Phaser.Math.Angle.Between` + vecteur de vitesse), attaquer au contact.
4. Instancier plusieurs ennemis (3 à 5) dans `GameScene`, gérés via un groupe Phaser (`this.physics.add.group`).
5. Délimiter une **zone de combat** (ex. bloquer la caméra/les bords de l'écran tant que des ennemis sont vivants, façon "arène").
6. Ajouter un **système de vie** (`src/systems/HealthSystem.js` ou logique intégrée aux entités) pour le joueur et les ennemis, avec un affichage barre de vie du joueur en HUD (rectangle qui se réduit).
7. Gérer les dégâts dans les deux sens (joueur → ennemi via attaque, ennemi → joueur via contact) avec un court délai d'invincibilité après un coup reçu.
8. Ajouter les conditions de victoire (tous les ennemis vaincus) et de défaite (vie du joueur à 0), chacune affichant un écran simple avec un bouton/texte "Rejouer".
9. Implémenter le redémarrage de la scène (`this.scene.restart()`) au clic/tap sur "Rejouer".

**Critères de "fait"** :
- Le joueur peut se déplacer librement dans la zone de combat et attaquer plusieurs ennemis qui le poursuivent.
- La barre de vie du joueur diminue visiblement lors des dégâts reçus.
- La partie se termine par un écran clair de victoire ou de défaite, avec possibilité de relancer sans recharger la page.

---

## 5. Version 2 — Vertical slice

Objectif : remplacer les rectangles par de vrais assets et obtenir une tranche de jeu représentative (un niveau complet jouable avec animations, ennemis variés et un mini-boss).

### Étapes

1. Récupérer/créer des assets (spritesheets personnage, ennemis, décor, musique, bruitages) — libres de droits ou créés pour le projet — et les placer dans `public/assets/` (sous-dossiers `characters/`, `enemies/`, `backgrounds/`, `effects/`, `sounds/`).
2. Charger les assets dans une scène `PreloadScene` (`src/scenes/PreloadScene.js`) avec une barre de progression de chargement, en préfixant les chemins par `import.meta.env.BASE_URL` pour rester valide une fois déployé sous `/tof/` :

```js
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const base = import.meta.env.BASE_URL;

    this.load.spritesheet('hero', `${base}assets/characters/hero.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image('city', `${base}assets/backgrounds/city.png`);
    this.load.audio('theme', `${base}assets/sounds/theme.mp3`);

    this.load.on('progress', (value) => {
      // mettre à jour la barre de progression
    });
  }

  create() {
    this.scene.start('Game');
  }
}
```

3. Déclarer les animations Phaser (`this.anims.create(...)`) pour chaque état du joueur : `idle`, `walk`, `attack`, `hurt`, `death`.
4. Relier les animations aux états logiques de `Player` (ex. `this.play('walk')` quand la vitesse != 0, `this.play('attack')` pendant l'attaque, etc.), avec gestion des transitions (ne pas interrompre une animation d'attaque en cours).
5. Créer 2 à 3 types d'ennemis distincts (`src/entities/EnemyGrunt.js`, `EnemyRunner.js`, etc.) avec des comportements et sprites différents.
6. Ajouter un **décor** de fond (parallax simple à 2-3 couches) pour donner de la profondeur.
7. Concevoir **une vague complète** d'ennemis (spawn progressif) suivie d'un **mini-boss** (plus de vie, attaque plus forte, sprite distinct).
8. Ajouter un **écran de fin de niveau** ("Niveau terminé") affiché après la défaite du mini-boss.

**Critères de "fait"** :
- Le joueur et les ennemis utilisent de vrais sprites animés cohérents avec leurs actions.
- Une vague d'ennemis puis un mini-boss s'enchaînent sans bug de collision ni de superposition d'animations.
- Un écran de fin de niveau apparaît après la victoire sur le mini-boss.

---

## 6. Version 3 — Contenu jouable

Objectif : étoffer le jeu avec plusieurs niveaux, de la progression et du contenu additionnel pour obtenir une expérience complète.

### Étapes

1. Créer plusieurs niveaux (`src/scenes/Level1Scene.js`, `Level2Scene.js`, …), ou une scène `GameScene` générique paramétrée par un fichier de configuration de niveau (`src/config/levels.js` listant décor, vagues d'ennemis, boss).
2. Ajouter des **variantes de personnage jouable** (skins et/ou stats différentes) sélectionnables depuis un écran de choix de personnage.
3. Mettre en place une **progression de difficulté** (plus d'ennemis, plus rapides, plus de vie, au fil des niveaux).
4. Ajouter un **boss final** distinct des mini-boss (pattern d'attaques plus élaboré, plusieurs phases).
5. Ajouter un **système de score** (points par ennemi vaincu, bonus de combo/temps), affiché en HUD et sur l'écran de fin.
6. Ajouter des **objets/bonus** à ramasser (soin, arme temporaire, points bonus) apparaissant sur le terrain.
7. Étoffer les **effets visuels** (particules d'impact, flash à la prise de dégâts, tremblement de caméra) et **effets sonores** (coup, saut, ramassage d'objet, musique par niveau).

**Critères de "fait"** :
- Il est possible d'enchaîner au moins 2-3 niveaux avec une difficulté croissante perceptible.
- Le score s'affiche et se met à jour correctement pendant la partie.
- Au moins un objet bonus et un boss final sont fonctionnels avec effets visuels/sonores associés.

---

## 7. Version 4 — Finition

Objectif : transformer le prototype avancé en jeu "fini" avec menus complets, options, sauvegarde et supports d'entrée multiples.

### Étapes

1. Créer les scènes de menu : `TitleScene` (écran titre), `PauseScene` (overlay pause), `GameOverScene`, `VictoryScene`, reliées entre elles par des transitions propres (`this.scene.start(...)`, `this.scene.launch(...)` pour les overlays).
2. Ajouter des **réglages audio** (volume musique/bruitages, mute) persistés (voir sauvegarde ci-dessous).
3. Implémenter la **sauvegarde locale** via `localStorage` (progression, meilleur score, réglages) dans un module dédié `src/systems/SaveManager.js`.
4. Ajouter le support **manette** via la Gamepad API de Phaser en complément du clavier, avec détection automatique du type d'entrée actif.
5. Revoir et corriger les **collisions** (hitbox trop grandes/petites, chevauchements bizarres) et **équilibrer** les statistiques (vie, dégâts, vitesse) via des sessions de test.
6. Effectuer des **tests multi-navigateurs** (Chrome, Firefox, Safari desktop) pour vérifier l'absence de régressions visuelles ou de performance.

**Critères de "fait"** :
- Navigation complète entre écran titre → jeu → pause → game over/victoire → retour au menu, sans blocage.
- Les réglages audio et la meilleure progression sont conservés après un rechargement de page.
- Le jeu est jouable au clavier et à la manette indifféremment.
- Aucun bug de collision bloquant identifié lors des tests croisés navigateurs.

---

## 8. Support mobile et tactile

Objectif : garantir une expérience fluide et jouable sur smartphone/tablette, en plus du clavier desktop.

### Étapes

1. Détecter le type d'appareil/entrée au démarrage (`'ontouchstart' in window` ou `navigator.maxTouchPoints > 0`) pour activer conditionnellement l'interface tactile.
2. Ajouter un **joystick virtuel** et des **boutons d'action** (attaque, saut) superposés au canvas :
   - ⚠️ Le plugin `phaser3-rex-plugins` (`rexvirtualjoystickplugin`), souvent recommandé, cible **Phaser 3** et n'est pas garanti compatible avec Phaser 4 : à tester avant de s'y engager, sinon partir directement sur une solution maison.
   - **Solution maison (recommandée ici)** : un module `src/systems/VirtualJoystick.js` qui expose un vecteur de direction normalisé, alimenté soit par des zones tactiles Phaser (`this.add.zone(...).setInteractive()` fixées à la caméra via `setScrollFactor(0)`), soit par des éléments HTML/CSS en overlay (`position: fixed`) qui publient leurs événements vers la scène via un `EventEmitter` partagé.
   - Faire converger clavier, manette et tactile vers une **même abstraction d'entrée** (`src/systems/InputSystem.js` renvoyant `{ x, y, attack, jump }`), pour que la logique de jeu ne dépende jamais du périphérique utilisé.
3. Configurer le **mode d'échelle Phaser** pour un rendu responsive, avec une résolution de référence fixe (ex. 960x540) :

```js
const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  // ...
};
```

   - `Phaser.Scale.FIT` conserve le ratio et ajoute des bandes noires si besoin (simple, recommandé pour débuter).
   - `Phaser.Scale.RESIZE` adapte dynamiquement la zone de jeu visible (plus complexe à gérer pour le placement des éléments HUD/joystick).
4. Gérer le **déblocage audio sur iOS/Safari** : afficher un écran/bouton "Toucher pour commencer" et n'enchaîner sur le jeu qu'une fois le contexte audio débloqué. Phaser expose `this.sound.locked` et l'événement `unlocked` :

```js
if (this.sound.locked) {
  this.sound.once('unlocked', () => this.startGame());
} else {
  this.startGame();
}
```

   En complément, `this.sound.context.resume()` peut être appelé dans le handler du premier tap si le `AudioContext` reste suspendu.
5. Optimiser les **performances mobile** :
   - Limiter le nombre de sprites/particules simultanés.
   - Réduire la taille des textures (atlas de sprites compressés, `texturepacker` ou équivalent).
   - Désactiver les effets coûteux (ombres, post-processing) sur les appareils bas de gamme si nécessaire.
6. Établir une **checklist de test Android/iOS** :
   - Le joystick virtuel répond sans latence perceptible.
   - Les boutons d'action ne se chevauchent pas avec le joystick ni avec la zone de jeu visible.
   - L'orientation (portrait/paysage) est gérée ou verrouillée volontairement (à documenter dans le README si verrouillée).
   - L'audio démarre bien après le premier tap sur Safari iOS.
   - Le framerate reste stable sur un appareil d'entrée de gamme (viser 30-60 fps).

**Critères de "fait"** :
- Sur un appareil tactile réel, le joystick et les boutons d'action permettent de jouer entièrement sans clavier.
- Le canvas s'adapte proprement à différentes tailles d'écran sans déformation ni éléments coupés.
- L'audio se déclenche correctement après interaction sur Safari iOS (testé sur un vrai appareil ou simulateur).

---

## 9. Déploiement sur GitHub Pages

Objectif : publier le jeu sur une URL GitHub Pages accessible depuis desktop et mobile.

### Étapes

1. Vérifier/finaliser la configuration `vite.config.js` avec le bon `base` (nom exact du dépôt GitHub, ex. `/tof/`) :

```js
export default defineConfig({
  base: '/tof/',
});
```

2. Générer le build de production pour valider localement qu'il fonctionne :

```bash
npm run build
npm run preview
```

3. Choisir une des deux approches de déploiement :

   **Approche A (recommandée) — GitHub Actions**, via `actions/upload-pages-artifact` + `actions/deploy-pages`. Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]  # adapter au nom réel de la branche principale du dépôt

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

   **Approche B (alternative simple) — package `gh-pages`** :

```bash
npm install --save-dev gh-pages
```

   Ajouter dans `package.json` :

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

   Puis déployer avec :

```bash
npm run deploy
```

4. Ajouter le remote GitHub distant (si ce n'est pas déjà fait) et pousser le dépôt :

```bash
git remote add origin https://github.com/<utilisateur>/tof.git
git push -u origin master
```

5. Activer GitHub Pages dans les paramètres du dépôt distant (**Settings → Pages**) :
   - Approche A : sélectionner la source "GitHub Actions".
   - Approche B : sélectionner la branche `gh-pages` comme source.
6. **Vérification finale** : ouvrir l'URL GitHub Pages générée (ex. `https://<utilisateur>.github.io/tof/`) et tester :
   - Sur desktop (clavier, redimensionnement de fenêtre).
   - Sur mobile (tactile réel, orientation portrait/paysage).
7. **Tester en local sur un vrai téléphone avant déploiement** (recommandé avant chaque mise en ligne majeure) :
   - `server.host: true` est déjà activé dans `vite.config.js`, donc un simple `npm run dev` expose le serveur sur le réseau local. Sinon, forcer explicitement :

```bash
npm run dev -- --host
```

   - Récupérer l'IP locale de la machine (ex. `192.168.1.42`) et ouvrir `http://192.168.1.42:5173` depuis le téléphone connecté au même Wi-Fi.
   - Alternative si le téléphone n'est pas sur le même réseau : utiliser ngrok pour exposer temporairement le serveur local :

```bash
ngrok http 5173
```

**Critères de "fait"** :
- Le workflow de déploiement (Actions ou `gh-pages`) se termine sans erreur.
- L'URL GitHub Pages affiche le jeu fonctionnel, testé sur au moins un navigateur desktop et un appareil mobile réel.
- Le test local via IP/ngrok a été effectué avant la mise en ligne d'une version majeure.

---

*Ce plan sera suivi étape par étape avec l'aide de l'assistant Copilot.*
