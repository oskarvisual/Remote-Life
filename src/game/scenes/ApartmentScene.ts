import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import type { DifficultyId } from '../config/difficulties';
import type { GameSession } from '../GameSession';

interface InteractiveZone {
  name: string;
  x: number;
  width: number;
  actionText: string;
  onInteract: () => void;
}

interface MissingPlaceholder {
  x: number;
  width: number;
  height: number;
  label: string;
  fillColor: number;
  borderColor: number;
}

type MischiefTarget = 'kitchen' | 'modem' | 'desk' | 'table';

interface LevelLayout {
  bgKey: string;
  bedKey: string;
  cribKey: string;
  deskKey: string;
  chairKey: string;
  chairScale: number;
  worldWidth: number;
  floorY: number;
  wallFloorY: number;
  minWalkX: number;
  maxWalkX: number;
  startX: number;
  bedX: number;
  deskX: number;
  fridgeX: number;
  cribX: number;
  toiletX: number;
  showerX: number;
  modemX: number;
  kitchenX: number;
  tableX: number;
  diningChairX?: number;
  missingPlaceholders: MissingPlaceholder[];
}

const SPRITE_SCALE = 1.8;
const DESK_SCALE = 1.85;
const BABY_SCALE = 0.85;
const BABY_CARRIED_SCALE = 0.78;

const LEVEL_LAYOUTS: Readonly<Record<DifficultyId, LevelLayout>> = {
  // Level 1 (Hard): Cramped studio and bathroom
  hard: {
    bgKey: 'bg-hard',
    bedKey: 'bed-hard',
    cribKey: 'crib-hard',
    deskKey: 'desk-hard',
    chairKey: 'chair-hard',
    chairScale: 0.85,
    worldWidth: 750,
    floorY: 248,
    wallFloorY: 234,
    minWalkX: 55,
    maxWalkX: 715,
    startX: 290,
    bedX: 105,
    tableX: 172,
    cribX: 235,
    kitchenX: 295,
    fridgeX: 348,
    modemX: 405,
    deskX: 468,
    toiletX: 576,
    showerX: 688,
    missingPlaceholders: [
      {
        x: 172,
        width: 42,
        height: 34,
        label: 'MISSING:\nTABLE',
        fillColor: 0x6d4c3d,
        borderColor: 0xf4a261,
      },
      {
        x: 295,
        width: 44,
        height: 44,
        label: 'MISSING:\nSTOVE',
        fillColor: 0x4a5759,
        borderColor: 0xa8dadc,
      },
      {
        x: 348,
        width: 40,
        height: 74,
        label: 'MISSING:\nFRIDGE',
        fillColor: 0x5c768d,
        borderColor: 0x91d6d2,
      },
      {
        x: 405,
        width: 34,
        height: 32,
        label: 'MISSING:\nWIFI MODEM',
        fillColor: 0x2b3a4a,
        borderColor: 0x56cfe1,
      },
    ],
  },

  // Level 2 (Medium): 2 bedrooms, bathroom, kitchen, living & dining room
  medium: {
    bgKey: 'bg-medium',
    bedKey: 'bed-medium',
    cribKey: 'crib-medium',
    deskKey: 'desk-medium',
    chairKey: 'chair-medium',
    chairScale: 1.3,
    worldWidth: 1281,
    floorY: 246,
    wallFloorY: 232,
    minWalkX: 50,
    maxWalkX: 1240,
    startX: 810,
    bedX: 145,
    cribX: 415,
    toiletX: 608,
    showerX: 730,
    modemX: 802,
    deskX: 865,
    diningChairX: 965,
    tableX: 1005,
    kitchenX: 1115,
    fridgeX: 1200,
    missingPlaceholders: [
      {
        x: 802,
        width: 38,
        height: 34,
        label: 'MISSING:\nWIFI MODEM',
        fillColor: 0x2b3a4a,
        borderColor: 0x56cfe1,
      },
      {
        x: 1005,
        width: 58,
        height: 38,
        label: 'MISSING:\nDINING TABLE',
        fillColor: 0x6d4c3d,
        borderColor: 0xf4a261,
      },
      {
        x: 1115,
        width: 66,
        height: 46,
        label: 'MISSING:\nSTOVE',
        fillColor: 0x4a5759,
        borderColor: 0xa8dadc,
      },
      {
        x: 1200,
        width: 42,
        height: 76,
        label: 'MISSING:\nFRIDGE',
        fillColor: 0x5c768d,
        borderColor: 0x91d6d2,
      },
    ],
  },

  // Level 3 (Easy): Multi-room penthouse with balcony
  easy: {
    bgKey: 'bg-easy',
    bedKey: 'bed-easy',
    cribKey: 'crib-easy',
    deskKey: 'desk-easy',
    chairKey: 'chair-easy',
    chairScale: 1.3,
    worldWidth: 1621,
    floorY: 246,
    wallFloorY: 232,
    minWalkX: 50,
    maxWalkX: 1590,
    startX: 760,
    bedX: 135,
    cribX: 375,
    toiletX: 545,
    showerX: 655,
    modemX: 745,
    deskX: 810,
    kitchenX: 1005,
    fridgeX: 1090,
    diningChairX: 1210,
    tableX: 1250,
    missingPlaceholders: [
      {
        x: 745,
        width: 38,
        height: 34,
        label: 'MISSING:\nWIFI MODEM',
        fillColor: 0x2b3a4a,
        borderColor: 0x56cfe1,
      },
      {
        x: 1005,
        width: 68,
        height: 46,
        label: 'MISSING:\nSTOVE',
        fillColor: 0x4a5759,
        borderColor: 0xa8dadc,
      },
      {
        x: 1090,
        width: 42,
        height: 76,
        label: 'MISSING:\nFRIDGE',
        fillColor: 0x5c768d,
        borderColor: 0x91d6d2,
      },
      {
        x: 1250,
        width: 58,
        height: 38,
        label: 'MISSING:\nDINING TABLE',
        fillColor: 0x6d4c3d,
        borderColor: 0xf4a261,
      },
      {
        x: 1390,
        width: 84,
        height: 42,
        label: 'MISSING:\nSOFA / LOUNGE',
        fillColor: 0x5f4bb6,
        borderColor: 0xcbd5e1,
      },
    ],
  },
};

export class ApartmentScene extends Phaser.Scene {
  private session!: GameSession;
  private layout!: LevelLayout;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyB!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;

  private player!: Phaser.GameObjects.Sprite;
  private babySprite!: Phaser.GameObjects.Sprite;
  private babyLabel!: Phaser.GameObjects.Text;
  private effectsGraphics!: Phaser.GameObjects.Graphics;
  private hazardGraphics!: Phaser.GameObjects.Graphics;
  private ambientOverlay!: Phaser.GameObjects.Rectangle;
  private playerLabel!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private secondaryPromptText!: Phaser.GameObjects.Text;
  private cryText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private urgencyText!: Phaser.GameObjects.Text;

  private facing: 'east' | 'west' = 'east';
  private walkAnimTimer = 0;
  private walkStep = 0;

  // Baby movement, needs, and mischief state
  private babyX = 0;
  private babyY = 0;
  private babyFacing: 'east' | 'west' = 'east';
  private babyCrawlTimer = 0;
  private babyCrawlStep = 0;
  private babyCribPoseTimer = 0;
  private babyCarryTimer = 0;
  private babyExerciseTimer = 0;
  private babyEscapeTimer = 0;
  private mischiefTarget: MischiefTarget = 'kitchen';
  private mischiefTimer = 0;
  private babyHurtTimer = 0;

  private zones: InteractiveZone[] = [];

  constructor() {
    super('Apartment');
  }

  preload(): void {
    // 3 level backgrounds
    this.load.image('bg-hard', '/assets/bg-level01.png');
    this.load.image('bg-medium', '/assets/bg-level02.png');
    this.load.image('bg-easy', '/assets/bg-level03.png');

    // Main character rotations and poses
    this.load.image('char-idle-east', '/assets/character-main/Idle/rotations/east.png');
    this.load.image('char-idle-west', '/assets/character-main/Idle/rotations/west.png');
    this.load.image('char-walk-east', '/assets/character-main/walking/rotations/east.png');
    this.load.image('char-walk-west', '/assets/character-main/walking/rotations/west.png');
    this.load.image(
      'char-walk2-east',
      '/assets/character-main/walking_using_the_le/rotations/east.png',
    );
    this.load.image(
      'char-walk2-west',
      '/assets/character-main/walking_using_the_le/rotations/west.png',
    );
    this.load.image(
      'char-typing-east',
      '/assets/character-main/seated_and_typingju/rotations/east.png',
    );
    this.load.image(
      'char-typing-north',
      '/assets/character-main/seated_and_typingju/rotations/north.png',
    );
    this.load.image(
      'char-eat-east',
      '/assets/character-main/eating_instant_soup/rotations/east.png',
    );
    this.load.image(
      'char-drink-east',
      '/assets/character-main/drinking_water_while/rotations/east.png',
    );

    // Sitting, shower, and sleeping poses
    this.load.image(
      'char-sitting-south',
      '/assets/character-main-sitting/sitting/rotations/south.png',
    );
    this.load.image(
      'char-shower-south',
      '/assets/character-main_shower/Taking_a_shower_but/rotations/south.png',
    );
    this.load.image(
      'char-sleep-west',
      '/assets/character-main-sleeping/sleeping/rotations/west.png',
    );

    // Baby sprites (sitting, sleeping, crying, drinking bottle, crawling)
    this.load.image('baby-sit-south', '/assets/baby/Idle/rotations/south.png');
    this.load.image('baby-sit-east', '/assets/baby/Idle/rotations/east.png');
    this.load.image('baby-sit-west', '/assets/baby/Idle/rotations/west.png');
    this.load.image('baby-sleep-south', '/assets/baby/16-bit_pixel_art_sle/rotations/south.png');
    this.load.image('baby-cry-south', '/assets/baby/16-bit_pixel_art_cry/rotations/south.png');
    this.load.image('baby-bottle-south', '/assets/baby/6-bit_pixel_art_baby/rotations/south.png');
    this.load.image('baby-crawl1-east', '/assets/baby/16-bit_pixel_art_cra/rotations/east.png');
    this.load.image('baby-crawl1-west', '/assets/baby/16-bit_pixel_art_cra/rotations/west.png');
    this.load.image('baby-crawl2-east', '/assets/baby/16-bit_pixel_art_bab/rotations/east.png');
    this.load.image('baby-crawl2-west', '/assets/baby/16-bit_pixel_art_bab/rotations/west.png');

    // Beds (3 levels)
    this.load.image('bed-hard', '/assets/bed-level01/bed/rotations/bed.png');
    this.load.image('bed-medium', '/assets/bed-level02/bed/rotations/bed.png');
    this.load.image('bed-easy', '/assets/bed-level03/bed/rotations/bed.png');

    // Empty baby cribs (3 levels)
    this.load.image(
      'crib-hard',
      '/assets/empty_baby_crib-level01/empty_baby_crib/rotations/empty_baby_crib.png',
    );
    this.load.image(
      'crib-medium',
      '/assets/empty_baby_crib-level02/empty_baby_crib/rotations/empty_baby_crib.png',
    );
    this.load.image(
      'crib-easy',
      '/assets/empty_baby_crib-level03/empty_baby_crib/rotations/empty_baby_crib.png',
    );

    // Computer desks (3 levels)
    this.load.image(
      'desk-hard',
      '/assets/setup-computer-level01/Pixel_art_computer_desk_setup/rotations/Pixel_art_computer_desk_setup.png',
    );
    this.load.image(
      'desk-medium',
      '/assets/setup-computer-level02/Pixel_art_modern_desk_setup_f/rotations/Pixel_art_modern_desk_setup_f.png',
    );
    this.load.image(
      'desk-easy',
      '/assets/setup-computer-level03/Pixel_art_ultimate_professiona/rotations/Pixel_art_ultimate_professiona.png',
    );

    // Desk chairs (3 levels) + dining chair
    this.load.image(
      'chair-hard',
      '/assets/setup-chair-level01/shipping_box_of_amazon/rotations/shipping_box_of_amazon.png',
    );
    this.load.image(
      'chair-medium',
      '/assets/setup-chair-level02/Pixel_art_office_chair_rear_v/rotations/Pixel_art_office_chair_rear_v.png',
    );
    this.load.image(
      'chair-easy',
      '/assets/setup-chair-level03/Pixel_art_gaming_chair_rear_v/rotations/Pixel_art_gaming_chair_rear_v.png',
    );
    this.load.image('dining-chair', '/assets/dining_chair/dining_chair/rotations/south.png');
  }

  create(): void {
    this.session = this.game.registry.get('session') as GameSession;
    if (!this.session) {
      throw new Error('GameSession not found in Phaser registry');
    }

    this.layout = LEVEL_LAYOUTS[this.session.state.difficulty.id];
    this.babyX = this.layout.cribX;
    this.babyY = this.layout.wallFloorY - 12;

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    this.drawApartment();
    this.createBabyAndPlayer();
    this.setupZones();
    this.setupCamera();
    this.setupEventListeners();
  }

  private drawApartment(): void {
    this.cameras.main.setBackgroundColor('#171722');
    const {
      bgKey,
      bedKey,
      cribKey,
      deskKey,
      chairKey,
      chairScale,
      worldWidth,
      floorY,
      wallFloorY,
      bedX,
      deskX,
      cribX,
      toiletX,
      showerX,
      diningChairX,
      missingPlaceholders,
    } = this.layout;

    // 1. Apartment background scaled to canvas height (270px)
    const bg = this.add.image(0, 0, bgKey).setOrigin(0, 0);
    bg.setDisplaySize(worldWidth, 270);

    // 2. Bed against the wall
    this.add
      .image(bedX, wallFloorY + 6, bedKey)
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(2);
    this.add
      .text(bedX, floorY + 2, 'BED', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 2b. Baby crib per level:
    // Mattress backing at depth 2, baby at depth 3, and crib bars in front at depth 4
    const cribBack = this.add.graphics().setDepth(2);
    cribBack.fillStyle(0x2b211b, 0.85).fillRect(cribX - 24, wallFloorY - 40, 48, 28);
    cribBack.fillStyle(0xf5ebe0, 0.95).fillRect(cribX - 23, wallFloorY - 18, 46, 8);

    this.add
      .image(cribX, wallFloorY + 6, cribKey)
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(4);

    this.add
      .text(cribX, floorY + 2, 'BABY CRIB', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3. Desk Setup layers: Wall -> Desk Setup (depth 2) -> Seated Player (depth 3) -> Chair (depth 4)
    this.add
      .image(deskX, wallFloorY + 4, deskKey)
      .setOrigin(0.5, 1)
      .setScale(DESK_SCALE)
      .setDepth(2);

    this.add
      .image(deskX, floorY + 2, chairKey)
      .setOrigin(0.5, 1)
      .setScale(chairScale)
      .setDepth(4);

    this.add
      .text(deskX, floorY + 2, 'DESK SETUP', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 4. Bathroom labels (Toilet and Shower built into the background)
    this.add
      .text(toiletX, floorY + 2, 'TOILET', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.add
      .text(showerX, floorY + 2, 'SHOWER', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 5. Dining chair if present in this level
    if (diningChairX !== undefined) {
      this.add
        .image(diningChairX, wallFloorY + 8, 'dining-chair')
        .setOrigin(0.5, 1)
        .setScale(1.5)
        .setDepth(2);
    }

    // 6. Placeholder rectangles for missing furniture assets (WIFI MODEM, STOVE, TABLE, FRIDGE)
    const g = this.add.graphics().setDepth(2);
    for (const item of missingPlaceholders) {
      const bottomY = wallFloorY + 6;
      const topY = bottomY - item.height;
      const leftX = item.x - item.width / 2;

      g.fillStyle(item.fillColor, 0.72).fillRect(leftX, topY, item.width, item.height);
      g.lineStyle(2, item.borderColor, 1).strokeRect(leftX, topY, item.width, item.height);

      this.add
        .text(item.x, topY + item.height / 2, item.label, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#fff4d4',
          align: 'center',
          backgroundColor: '#151820bb',
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(3);
    }

    // 7. Baby crying indicator
    this.cryText = this.add
      .text(cribX, wallFloorY - 68, 'WAHH!\n  ♫', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f3315c',
        align: 'center',
        backgroundColor: '#1a1118dd',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(13)
      .setVisible(false);
  }

  private createBabyAndPlayer(): void {
    const { startX, floorY, cribX, wallFloorY } = this.layout;

    // Baby sprite: inside crib at depth 3 (behind crib bars at depth 4)
    this.babySprite = this.add
      .sprite(cribX, wallFloorY - 12, 'baby-sit-south')
      .setOrigin(0.5, 1)
      .setScale(BABY_SCALE)
      .setDepth(3);

    this.babyLabel = this.add
      .text(cribX, wallFloorY - 58, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#8e243d',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(14)
      .setVisible(false);

    this.player = this.add
      .sprite(startX, floorY, 'char-idle-east')
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(10);

    // Graphics layer for kitchen fire, modem sparks, and unplugged PC cord
    this.hazardGraphics = this.add.graphics().setDepth(9);

    // Graphics layer for stink waves (Level 2), flies (Level 3), and shower drops
    this.effectsGraphics = this.add.graphics().setDepth(11);

    // Day / Afternoon / Night ambient overlay (fixed to apartment camera, never affects popup modals)
    this.ambientOverlay = this.add
      .rectangle(0, 0, 480, 270, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(11);

    this.playerLabel = this.add
      .text(startX, floorY - 76, 'YOU', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#181824cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12);

    this.urgencyText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe6e6',
        backgroundColor: '#c0392b',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(14)
      .setVisible(false);

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#151820',
        backgroundColor: '#ffe1a0',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);

    this.secondaryPromptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#2b3a4aee',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);

    this.statusText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);
  }

  private setupZones(): void {
    const { bedX, fridgeX, deskX, cribX, toiletX, showerX, kitchenX, modemX } = this.layout;

    this.zones = [
      {
        name: 'bed',
        x: bedX,
        width: 44,
        actionText: '[E] REST / NAP',
        onInteract: () => {
          const baby = this.session.state.baby;
          if (baby.location === 'bed' && baby.demand === 'feed') {
            this.session.activities.start('care');
            return;
          }
          if (baby.location === 'bed' && baby.demand === 'crawl') {
            this.releaseBabyLoose(this.layout.bedX + 24);
            return;
          }
          if (baby.location === 'bed' && baby.demand === 'sleep') {
            this.pickUpBaby();
            return;
          }
          this.session.activities.start('nap');
        },
      },
      {
        name: 'fridge',
        x: fridgeX,
        width: 38,
        actionText: '[E] EAT MEAL · [R] 💧 DRINK WATER',
        onInteract: () => this.session.activities.start('eat'),
      },
      {
        name: 'kitchen',
        x: kitchenX,
        width: 38,
        actionText: '[E] 🔥 EXTINGUISH FIRE',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 Put the baby in the crib or bed before extinguishing the fire!',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.kitchenFire) {
            this.session.state.baby.kitchenFire = false;
            this.session.events.emit('notify', {
              text: '🧯 You extinguished the kitchen fire in time!',
              kind: 'success',
            });
            this.session.events.emit('state:changed');
          }
        },
      },
      {
        name: 'modem',
        x: modemX,
        width: 34,
        actionText: '[E] 📡 RECONNECT WIFI',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 Put the baby in the crib or bed before reconnecting the modem!',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.modemUnplugged) {
            this.session.state.baby.modemUnplugged = false;
            this.session.events.emit('internet:restored');
            this.session.events.emit('notify', {
              text: '📡 Wi-Fi modem reconnected. Internet restored!',
              kind: 'success',
            });
            this.session.events.emit('state:changed');
          }
        },
      },
      {
        name: 'desk',
        x: deskX,
        width: 44,
        actionText: '[E] OPEN COMPUTER',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 You cannot use the PC while holding the baby! Put the baby in the crib or bed (or sleep together).',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.pcUnplugged) {
            this.session.state.baby.pcUnplugged = false;
            this.session.events.emit('notify', {
              text: '🔌 Plugged the PC power cable back in.',
              kind: 'success',
            });
            this.session.events.emit('state:changed');
            return;
          }
          this.session.events.emit('computer:open');
        },
      },
      {
        name: 'crib',
        x: cribX,
        width: 44,
        actionText: '[E] CARE FOR BABY',
        onInteract: () => {
          const baby = this.session.state.baby;
          if (baby.location === 'carried') {
            this.putBabyToSleepIn('crib');
          } else if (baby.location === 'crib') {
            if (baby.demand === 'crawl') {
              this.releaseBabyLoose(this.layout.cribX + 22);
            } else if (baby.demand === 'sleep') {
              this.pickUpBaby();
            } else {
              this.session.activities.start('care');
            }
          }
        },
      },
      {
        name: 'toilet',
        x: toiletX,
        width: 38,
        actionText: '[E] USE TOILET',
        onInteract: () => this.session.activities.start('toilet'),
      },
      {
        name: 'shower',
        x: showerX,
        width: 40,
        actionText: '[E] TAKE SHOWER',
        onInteract: () => this.session.activities.start('shower'),
      },
    ];
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, this.layout.worldWidth, 270);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private setupEventListeners(): void {
    this.session.events.on('baby:crying', () => {
      this.cryText.setVisible(true);
      this.cryText.setColor('#f3315c');
    });

    this.session.events.on('baby:critical', () => {
      this.cryText.setVisible(true);
      this.cryText.setColor('#ff0033');
      this.cryText.setText('CRITICAL!\nWAHH!!');
    });

    this.session.events.on('baby:attended', () => {
      this.cryText.setVisible(false);
      this.cryText.setText('WAHH!\n  ♫');
    });
  }

  private pickUpBaby(): void {
    const baby = this.session.state.baby;
    baby.location = 'carried';
    baby.carriedAsleep = false;
    baby.crying = false;
    baby.critical = false;
    this.babyCarryTimer = 0;
    this.babyHurtTimer = 0;
    this.mischiefTimer = 0;
    this.cryText.setVisible(false);

    if (baby.demand === 'crawl') {
      this.session.events.emit('notify', {
        text: '🏃 The baby wants to crawl around! Put the baby down on the floor with [F].',
        kind: 'info',
      });
    } else {
      this.session.events.emit('notify', {
        text: '👶 Picked up the baby. Walk around for a moment until the baby falls asleep on you, then place in crib or bed.',
        kind: 'info',
      });
    }
    this.session.events.emit('state:changed');
  }

  private putBabyToSleepIn(place: 'crib' | 'bed'): void {
    const baby = this.session.state.baby;
    if (baby.demand === 'sleep' && !baby.carriedAsleep) {
      this.session.events.emit('notify', {
        text: '⏳ Hold the baby for a few seconds until they fall asleep in your arms!',
        kind: 'warn',
      });
      return;
    }

    baby.location = place;
    baby.cribSleeping = baby.carriedAsleep || baby.demand === 'sleep' || Math.random() < 0.6;
    baby.carriedAsleep = false;
    baby.demand = 'none';
    this.babyX = place === 'crib' ? this.layout.cribX : this.layout.bedX + 8;
    this.babyY = place === 'crib' ? this.layout.wallFloorY - 12 : this.layout.wallFloorY - 8;
    this.babyEscapeTimer = 0;
    this.mischiefTimer = 0;
    this.session.baby.soothe(40);
    this.session.events.emit('notify', {
      text:
        place === 'crib'
          ? '🛏️ Placed the sleeping baby safely inside the crib. Your hands are free!'
          : '🛏️ Placed the sleeping baby on the bed. Your hands are free!',
      kind: 'success',
    });
  }

  private releaseBabyLoose(startX: number): void {
    const baby = this.session.state.baby;
    if (baby.carriedAsleep) {
      this.session.events.emit('notify', {
        text: '🛏️ The baby is asleep in your arms! Put the baby in the CRIB or BED (not on the floor).',
        kind: 'warn',
      });
      return;
    }

    baby.location = 'loose';
    baby.carriedAsleep = false;
    this.babyX = Phaser.Math.Clamp(startX, this.layout.minWalkX + 10, this.layout.maxWalkX - 10);
    this.babyY = this.layout.floorY;
    this.mischiefTimer = 0;
    this.babyHurtTimer = 0;
    this.babyExerciseTimer = 0;
    this.chooseNextMischiefTarget();
    this.session.events.emit('notify', {
      text:
        baby.demand === 'crawl'
          ? '🏃 Put the baby down to crawl around. Keep an eye out for mischief!'
          : '⚠️ The baby is loose! Put the baby in the crib or they will cause dangerous mischief.',
      kind: 'warn',
    });
    this.session.events.emit('state:changed');
  }

  private chooseNextMischiefTarget(): void {
    const targets: MischiefTarget[] = ['kitchen', 'modem', 'desk', 'table'];
    const currentIdx = targets.indexOf(this.mischiefTarget);
    this.mischiefTarget =
      targets[(currentIdx + 1 + Math.floor(Math.random() * 3)) % targets.length];
    this.mischiefTimer = 0;
  }

  private getTargetX(target: MischiefTarget): number {
    switch (target) {
      case 'kitchen':
        return this.layout.kitchenX;
      case 'modem':
        return this.layout.modemX;
      case 'desk':
        return this.layout.deskX;
      case 'table':
        return this.layout.tableX;
    }
  }

  private triggerMischiefDisaster(target: MischiefTarget): void {
    const { baby, player } = this.session.state;

    if (target === 'kitchen') {
      baby.kitchenFire = true;
      this.session.events.emit('notify', {
        text: '🔥 THE BABY CLIMBED THE STOVE AND STARTED A FIRE! Run to the stove and press [E].',
        kind: 'danger',
      });
    } else if (target === 'modem') {
      baby.modemUnplugged = true;
      this.session.events.emit('notify', {
        text: '📡 The baby unplugged the Wi-Fi MODEM! Reconnect it at the modem with [E].',
        kind: 'danger',
      });
    } else if (target === 'desk') {
      baby.pcUnplugged = true;
      if (player.mode === 'computer') {
        this.session.events.emit('computer:close');
      }
      this.session.events.emit('notify', {
        text: '🔌 The baby unplugged your PC! Reconnect the power cord at the desk with [E].',
        kind: 'danger',
      });
    } else if (target === 'table') {
      this.babyHurtTimer = 5500;
      baby.needs = Math.max(0, baby.needs - 35);
      baby.crying = true;
      player.adjust('stress', 22);
      player.money = Math.max(0, player.money - 50);
      this.session.events.emit('notify', {
        text: '🚑 The baby climbed the table and fell off! (-$50 medical care, +22 Stress). Pick them up!',
        kind: 'danger',
      });
    }

    this.session.events.emit('state:changed');
    this.chooseNextMischiefTarget();
  }

  private getDemandTag(): string {
    const { demand } = this.session.state.baby;
    if (demand === 'feed') return '🍼 NEEDS: MILK BOTTLE [E]';
    if (demand === 'crawl') return '🏃 NEEDS: LET DOWN TO CRAWL [F]';
    if (demand === 'sleep') return '😴 NEEDS: CARRY TO SLEEP [F]';
    return '';
  }

  private updateBabyBehavior(time: number, delta: number): void {
    const { baby, player } = this.session.state;
    const hour = this.session.state.secondsOfDay / 3600;

    // 1. Baby inside crib (depth 3 behind crib bars at depth 4) or on bed
    if (baby.location === 'crib' || baby.location === 'bed') {
      const inCrib = baby.location === 'crib';
      this.babyX = inCrib ? this.layout.cribX : this.layout.bedX + 8;
      this.babyY = inCrib ? this.layout.wallFloorY - 12 : this.layout.wallFloorY - 8;
      this.babySprite
        .setPosition(this.babyX, this.babyY)
        .setScale(BABY_SCALE)
        .setDepth(inCrib ? 3 : 7);

      const demandTag = this.getDemandTag();
      if (demandTag && player.mode !== 'caring') {
        this.babyLabel
          .setText(demandTag)
          .setPosition(this.babyX, this.babyY - 38)
          .setVisible(true);
      } else {
        this.babyLabel.setVisible(false);
      }
      this.cryText.setPosition(this.babyX, this.layout.wallFloorY - 68);

      // Alternate between sitting and sleeping when calm in the crib
      this.babyCribPoseTimer += delta;
      if (this.babyCribPoseTimer >= 12000) {
        this.babyCribPoseTimer = 0;
        const isNight = hour >= 20 || hour < 7;
        baby.cribSleeping = isNight ? true : !baby.cribSleeping;
      }

      if (player.mode === 'caring') {
        this.babySprite.setTexture('baby-bottle-south');
      } else if (baby.crying || baby.demand !== 'none') {
        this.babySprite.setTexture(baby.crying ? 'baby-cry-south' : 'baby-sit-south');
        if (baby.critical && inCrib) {
          this.babyEscapeTimer += delta;
          if (this.babyEscapeTimer >= 15000) {
            this.babyEscapeTimer = 0;
            this.releaseBabyLoose(this.layout.cribX + 20);
          }
        }
      } else if (baby.cribSleeping || !inCrib) {
        this.babySprite.setTexture('baby-sleep-south');
      } else {
        this.babySprite.setTexture('baby-sit-south');
      }
      return;
    }

    // 2. Baby carried in player's arms:
    // Starts sitting and falls asleep on top of the player after ~3.5 seconds (baby-sleep-south)
    if (baby.location === 'carried') {
      if (!baby.carriedAsleep && baby.demand !== 'crawl') {
        this.babyCarryTimer += delta;
        if (this.babyCarryTimer >= 3500) {
          baby.carriedAsleep = true;
          this.session.events.emit('notify', {
            text: '😴 The baby fell asleep on you! Put the baby in the CRIB or BED with [F] (or sleep in bed yourself).',
            kind: 'success',
          });
          this.session.events.emit('state:changed');
        }
      }

      const offsetX = this.facing === 'east' ? 6 : -6;
      this.babyX = this.player.x + offsetX;
      this.babyY = player.mode === 'napping' ? this.player.y - 10 : this.player.y - 24;
      this.babySprite
        .setPosition(this.babyX, this.babyY)
        .setScale(BABY_CARRIED_SCALE)
        .setDepth(this.player.depth + 1)
        .setTexture(
          baby.carriedAsleep || player.mode === 'napping' ? 'baby-sleep-south' : 'baby-sit-south',
        );

      if (baby.carriedAsleep) {
        this.babyLabel
          .setText('👶💤 ASLEEP -> PUT IN CRIB OR BED [F]')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      } else if (baby.demand === 'crawl') {
        this.babyLabel
          .setText('🏃 WANTS TO CRAWL -> PUT ON FLOOR [F]')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      } else {
        this.babyLabel
          .setText('⏳ FALLING ASLEEP IN YOUR ARMS...')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      }
      this.cryText.setVisible(false);
      return;
    }

    // 3. Baby loose on floor ('loose'): crawls around and causes mischief if unwatched
    this.babySprite.setScale(BABY_SCALE).setDepth(9);

    // If baby wanted to crawl ('crawl'), after ~7s of crawling they get sleepy ('sleep')
    if (baby.demand === 'crawl') {
      this.babyExerciseTimer += delta;
      if (this.babyExerciseTimer >= 7000) {
        this.babyExerciseTimer = 0;
        baby.demand = 'sleep';
        this.session.events.emit('notify', {
          text: '😴 The baby finished crawling around and is sleepy now! Pick them up with [F] to rock to sleep.',
          kind: 'info',
        });
        this.session.events.emit('state:changed');
      }
    }

    if (this.babyHurtTimer > 0) {
      this.babyHurtTimer = Math.max(0, this.babyHurtTimer - delta);
      this.babyY = this.layout.floorY;
      this.babySprite.setPosition(this.babyX, this.babyY).setTexture('baby-cry-south');
      this.cryText
        .setText('😭 OUCH!\nWAHH!!')
        .setPosition(this.babyX, this.babyY - 46)
        .setVisible(true);
      this.babyLabel
        .setText('🚑 FELL OFF TABLE! [F] PICK UP')
        .setPosition(this.babyX, this.babyY - 30)
        .setVisible(true);
      return;
    }

    const targetX = this.getTargetX(this.mischiefTarget);
    const dist = targetX - this.babyX;

    if (Math.abs(dist) > 8) {
      // Crawling across the floor toward mischief target
      const crawlSpeed = 42;
      const step = Math.sign(dist) * ((crawlSpeed * delta) / 1000);
      this.babyX += step;
      this.babyY = this.layout.floorY;
      this.babyFacing = dist > 0 ? 'east' : 'west';

      this.babyCrawlTimer += delta;
      if (this.babyCrawlTimer >= 165) {
        this.babyCrawlTimer = 0;
        this.babyCrawlStep = (this.babyCrawlStep + 1) % 2;
      }

      const crawlTex =
        this.babyCrawlStep === 0
          ? `baby-crawl1-${this.babyFacing}`
          : `baby-crawl2-${this.babyFacing}`;
      this.babySprite.setPosition(this.babyX, this.babyY).setTexture(crawlTex);

      const targetNames: Record<MischiefTarget, string> = {
        kitchen: '🔥 STOVE',
        modem: '📡 WIFI MODEM',
        desk: '🔌 YOUR PC',
        table: '🪑 TABLE',
      };
      const prefix = baby.demand === 'sleep' ? '😴 SLEEPY (CARRY ME) · ' : '';
      this.babyLabel
        .setText(`${prefix}👶 -> ${targetNames[this.mischiefTarget]}`)
        .setPosition(this.babyX, this.babyY - 32)
        .setVisible(true);
    } else {
      // Reached furniture: climbs/tampers for 3.5 seconds before triggering disaster
      this.mischiefTimer += delta;
      const climbY =
        this.mischiefTarget === 'kitchen' || this.mischiefTarget === 'table'
          ? this.layout.wallFloorY - 26
          : this.layout.floorY - 4;
      this.babyY = climbY;

      const wobble = Math.sin(time * 0.02) * 2;
      this.babySprite.setPosition(this.babyX + wobble, this.babyY).setTexture('baby-sit-south');

      const actionNames: Record<MischiefTarget, string> = {
        kitchen: '⚠️ CLIMBING ON THE STOVE!',
        modem: '⚠️ PULLING MODEM CABLES!',
        desk: '⚠️ UNPLUGGING YOUR PC!',
        table: '⚠️ CLIMBING ON THE TABLE!',
      };
      this.babyLabel
        .setText(actionNames[this.mischiefTarget])
        .setPosition(this.babyX, this.babyY - 34)
        .setVisible(true);

      if (this.mischiefTimer >= 3500) {
        this.mischiefTimer = 0;
        this.triggerMischiefDisaster(this.mischiefTarget);
      }
    }
  }

  /**
   * Renders visual effects for baby-caused disasters:
   * - Flames and smoke when the stove is on fire.
   * - Blinking red/amber warning on unplugged Wi-Fi modem.
   * - Unplugged indicator on the PC desk.
   */
  private renderHazardEffects(time: number): void {
    this.hazardGraphics.clear();
    const { baby } = this.session.state;
    const { kitchenX, modemX, deskX, wallFloorY } = this.layout;

    // 1. Kitchen stove fire
    if (baby.kitchenFire) {
      for (let i = 0; i < 7; i++) {
        const flicker = Math.sin(time * 0.02 + i * 1.3) * 6;
        const fx = kitchenX - 18 + i * 6;
        const fy = wallFloorY - 28 + (i % 2) * 4;
        this.hazardGraphics.fillStyle(0xff4d00, 0.9);
        this.hazardGraphics.fillRect(fx, fy - 14 - flicker, 6, 16 + flicker);
        this.hazardGraphics.fillStyle(0xffbe0b, 0.95);
        this.hazardGraphics.fillRect(fx + 1, fy - 8 - flicker * 0.5, 4, 9);
      }
      this.hazardGraphics.fillStyle(0x2b2d42, 0.65);
      for (let s = 0; s < 4; s++) {
        const rise = (time * 0.04 + s * 14) % 45;
        const sx = kitchenX - 10 + s * 7 + Math.sin(time * 0.008 + s) * 4;
        const sy = wallFloorY - 44 - rise;
        this.hazardGraphics.fillRect(sx, sy, 7, 7);
      }
    }

    // 2. Unplugged Wi-Fi modem
    if (baby.modemUnplugged) {
      const blink = Math.sin(time * 0.015) > 0;
      this.hazardGraphics.fillStyle(blink ? 0xff0033 : 0xffbe0b, 0.95);
      this.hazardGraphics.fillRect(modemX - 6, wallFloorY - 24, 12, 6);
    }

    // 3. Unplugged PC
    if (baby.pcUnplugged) {
      const blink = Math.sin(time * 0.015) > 0;
      this.hazardGraphics.fillStyle(blink ? 0xff0033 : 0x151820, 0.95);
      this.hazardGraphics.fillRect(deskX - 14, wallFloorY - 28, 28, 8);
    }
  }

  /**
   * Renders visual effects on the character and baby:
   * - Zzz when the baby is sleeping in crib, bed, or player's arms.
   * - Falling water droplets while showering.
   * - Dirt Level 2 (dirt >= 40): rising green stink waves.
   * - Dirt Level 3 (dirt >= 75): flies orbiting around the player.
   */
  private renderCharacterEffects(time: number): void {
    this.effectsGraphics.clear();
    const { player, baby } = this.session.state;
    const mode = player.mode;
    const px = this.player.x;
    const py = this.player.y;

    // 0. Soft Zzz if the baby is sleeping (in crib, bed, or carried in arms)
    const babySleepingNow =
      (baby.location === 'crib' && baby.cribSleeping && !baby.crying) ||
      (baby.location === 'bed' && !baby.crying) ||
      (baby.location === 'carried' && baby.carriedAsleep);

    if (babySleepingNow) {
      this.effectsGraphics.fillStyle(0xa8dadc, 0.9);
      for (let i = 0; i < 2; i++) {
        const floatOffset = (time * 0.02 + i * 11) % 20;
        const zx = this.babyX + 6 + i * 4;
        const zy = this.babyY - 22 - floatOffset;
        this.effectsGraphics.fillRect(zx, zy, 3, 1.5);
      }
    }

    // 1. Water droplets while showering
    if (mode === 'showering') {
      this.effectsGraphics.fillStyle(0x72efdd, 0.85);
      for (let i = 0; i < 12; i++) {
        const dropOffset = (time * 0.14 + i * 19) % 62;
        const dropX = px - 14 + ((i * 7) % 28);
        const dropY = py - 74 + dropOffset;
        this.effectsGraphics.fillRect(dropX, dropY, 2, 5);
      }
      return;
    }

    // 1b. Sleep Zzz while napping in bed
    if (mode === 'napping') {
      this.effectsGraphics.fillStyle(0xffe8bb, 0.85);
      for (let i = 0; i < 3; i++) {
        const floatOffset = (time * 0.025 + i * 10) % 26;
        const zx = px - 18 - i * 4 + Math.sin(time * 0.005 + i) * 3;
        const zy = py - 46 - floatOffset;
        const size = 2 + i * 0.8;
        this.effectsGraphics.fillRect(zx, zy, size * 2, 1.5);
        this.effectsGraphics.fillRect(zx + size * 0.6, zy + size, size, 1.5);
        this.effectsGraphics.fillRect(zx, zy + size * 2, size * 2, 1.5);
      }
    }

    // 2. Dirt Level 2 & 3: Stink waves rising from player
    const dirtLevel = player.dirtLevel;
    if (dirtLevel >= 2) {
      const waveCount = dirtLevel === 3 ? 4 : 3;
      const stinkColor = dirtLevel === 3 ? 0x80b918 : 0xaacc00;
      this.effectsGraphics.lineStyle(1.5, stinkColor, 0.78);

      for (let w = 0; w < waveCount; w++) {
        const baseX = px - 14 + w * (28 / (waveCount - 1));
        const rise = (time * 0.03 + w * 12) % 26;
        const startY = py - 36 - rise;

        this.effectsGraphics.beginPath();
        for (let s = 0; s <= 14; s += 2) {
          const sway = Math.sin(time * 0.008 + s * 0.45 + w * 1.7) * 3.5;
          const vx = baseX + sway;
          const vy = startY - s;
          if (s === 0) {
            this.effectsGraphics.moveTo(vx, vy);
          } else {
            this.effectsGraphics.lineTo(vx, vy);
          }
        }
        this.effectsGraphics.strokePath();
      }
    }

    // 3. Dirt Level 3: Flies orbiting around player
    if (dirtLevel === 3) {
      const flyCount = 5;
      for (let f = 0; f < flyCount; f++) {
        const angle = time * (0.005 + f * 0.0012) + f * 1.25;
        const radiusX = 16 + (f % 2) * 7;
        const radiusY = 10 + (f % 3) * 5;
        const centerY = py - 42 - (f % 3) * 10;

        const fx = px + Math.cos(angle) * radiusX;
        const fy = centerY + Math.sin(angle * 1.7) * radiusY;

        this.effectsGraphics.fillStyle(0x14151b, 1);
        this.effectsGraphics.fillRect(fx, fy, 2.5, 2.5);

        const wingOffset = Math.sin(time * 0.06 + f) > 0 ? -1.5 : 0;
        this.effectsGraphics.fillStyle(0xffffff, 0.85);
        this.effectsGraphics.fillRect(fx - 1, fy + wingOffset, 1.5, 1.5);
        this.effectsGraphics.fillRect(fx + 2, fy + wingOffset, 1.5, 1.5);
      }
    }
  }

  /**
   * Updates the Day / Afternoon / Night ambient overlay and canvas filter.
   * Scoped strictly to the Phaser canvas (#game), so popup modals (#computer, etc.) are never affected.
   */
  private updateAmbientOverlay(): void {
    const hour = this.session.state.secondsOfDay / 3600;
    const sunsetColor = { r: 217, g: 107, b: 39 }; // Warm sunset amber (0xd96b27)
    const nightColor = { r: 10, g: 17, b: 40 }; // Deep night indigo (0x0a1128)

    let r = 0;
    let g = 0;
    let b = 0;
    let alpha = 0;
    let canvasFilter = 'none';

    if (hour >= 7 && hour < 16.5) {
      alpha = 0;
      canvasFilter = 'none';
    } else if (hour >= 16.5 && hour < 19.5) {
      const t = (hour - 16.5) / 3;
      r = sunsetColor.r;
      g = sunsetColor.g;
      b = sunsetColor.b;
      alpha = Phaser.Math.Linear(0, 0.28, t);
      const sepia = (0.2 * t).toFixed(2);
      const sat = (1 + 0.22 * t).toFixed(2);
      const bright = (1 - 0.06 * t).toFixed(2);
      canvasFilter = `sepia(${sepia}) saturate(${sat}) brightness(${bright})`;
    } else if (hour >= 19.5 && hour < 21) {
      const t = (hour - 19.5) / 1.5;
      r = Math.round(Phaser.Math.Linear(sunsetColor.r, nightColor.r, t));
      g = Math.round(Phaser.Math.Linear(sunsetColor.g, nightColor.g, t));
      b = Math.round(Phaser.Math.Linear(sunsetColor.b, nightColor.b, t));
      alpha = Phaser.Math.Linear(0.28, 0.48, t);
      const bright = Phaser.Math.Linear(0.94, 0.78, t).toFixed(2);
      const sat = Phaser.Math.Linear(1.22, 0.82, t).toFixed(2);
      canvasFilter = `brightness(${bright}) contrast(1.06) saturate(${sat})`;
    } else if (hour >= 21 || hour < 5.5) {
      r = nightColor.r;
      g = nightColor.g;
      b = nightColor.b;
      alpha = 0.48;
      canvasFilter = 'brightness(0.78) contrast(1.08) saturate(0.82)';
    } else {
      const t = (hour - 5.5) / 1.5;
      r = nightColor.r;
      g = nightColor.g;
      b = nightColor.b;
      alpha = Phaser.Math.Linear(0.48, 0, t);
      const bright = Phaser.Math.Linear(0.78, 1, t).toFixed(2);
      canvasFilter = `brightness(${bright})`;
    }

    const hexColor = Phaser.Display.Color.GetColor(r, g, b);
    this.ambientOverlay.setFillStyle(hexColor, alpha);
    if (this.game.canvas && this.game.canvas.style.filter !== canvasFilter) {
      this.game.canvas.style.filter = canvasFilter;
    }
  }

  override update(time: number, delta: number): void {
    // 1. Advance game simulation session
    this.session.update(delta);

    const { player: playerState, baby } = this.session.state;
    const mode = playerState.mode;
    const isPlayerIdle = playerState.isIdle;

    // Debug/testing hotkeys:
    // [B] +Bladder, [N] +Dirt, [T] +2h Day/Dusk/Night, [M] cycle baby demand (Feed -> Crawl -> Sleep)
    if (Phaser.Input.Keyboard.JustDown(this.keyB)) {
      playerState.adjust('bladder', 35);
      this.session.events.emit('state:changed');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      const currentLevel = playerState.dirtLevel;
      const nextDirt = currentLevel === 1 ? 50 : currentLevel === 2 ? 85 : 0;
      const diff = nextDirt - playerState.get('dirt');
      playerState.adjust('dirt', diff);
      this.session.events.emit('state:changed');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.session.state.secondsOfDay = (this.session.state.secondsOfDay + 2 * 3600) % 86400;
      this.session.events.emit('clock:tick', {
        day: this.session.state.day,
        secondsOfDay: this.session.state.secondsOfDay,
      });
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const order: ('feed' | 'crawl' | 'sleep')[] = ['feed', 'crawl', 'sleep'];
      const nextIdx = baby.demand === 'none' ? 0 : (order.indexOf(baby.demand) + 1) % order.length;
      baby.demand = order[nextIdx];
      baby.needs = 40;
      baby.crying = true;
      this.session.events.emit('state:changed');
    }

    // [R] at the refrigerator to DRINK WATER (uses the water bottle animation)
    if (
      Phaser.Input.Keyboard.JustDown(this.keyR) &&
      isPlayerIdle &&
      Math.abs(this.player.x - this.layout.fridgeX) <= 42
    ) {
      this.session.activities.start('drink');
    }

    // [F] to Carry baby / Put sleeping baby in Crib or Bed / Let baby down to crawl
    if (Phaser.Input.Keyboard.JustDown(this.keyF) && isPlayerIdle) {
      const nearCrib = Math.abs(this.player.x - this.layout.cribX) <= 48;
      const nearBed = Math.abs(this.player.x - this.layout.bedX) <= 48;
      const nearLooseBaby = baby.location === 'loose' && Math.abs(this.player.x - this.babyX) <= 48;

      if (baby.location === 'carried') {
        if (nearCrib) {
          this.putBabyToSleepIn('crib');
        } else if (nearBed) {
          this.putBabyToSleepIn('bed');
        } else {
          this.releaseBabyLoose(this.player.x + (this.facing === 'east' ? 18 : -18));
        }
      } else if (baby.location === 'crib' && nearCrib) {
        if (baby.demand === 'crawl') {
          this.releaseBabyLoose(this.layout.cribX + 22);
        } else {
          this.pickUpBaby();
        }
      } else if (baby.location === 'bed' && nearBed) {
        if (baby.demand === 'crawl') {
          this.releaseBabyLoose(this.layout.bedX + 22);
        } else {
          this.pickUpBaby();
        }
      } else if (nearLooseBaby) {
        this.pickUpBaby();
      }
    }

    // Update Day / Afternoon / Night ambient overlay
    this.updateAmbientOverlay();

    // 2. Handle player input, movement, and 4-step walk cycle
    let dx = 0;

    if (isPlayerIdle) {
      if (this.cursors.left?.isDown || this.keyA?.isDown) dx = -1;
      if (this.cursors.right?.isDown || this.keyD?.isDown) dx = 1;
    }

    if (dx !== 0) {
      const speed = BALANCE.player.walkSpeed * 1.45;
      this.player.x = Phaser.Math.Clamp(
        this.player.x + (dx * speed * delta) / 1000,
        this.layout.minWalkX,
        this.layout.maxWalkX,
      );
      this.player.y = this.layout.floorY;
      this.player.setDepth(10);
      this.facing = dx > 0 ? 'east' : 'west';

      // 4-step walk cycle: walk1 -> idle -> walk2 -> idle
      this.walkAnimTimer += delta;
      if (this.walkAnimTimer >= 115) {
        this.walkAnimTimer = 0;
        this.walkStep = (this.walkStep + 1) % 4;
      }

      const cycleFrames = [
        `char-walk-${this.facing}`,
        `char-idle-${this.facing}`,
        `char-walk2-${this.facing}`,
        `char-idle-${this.facing}`,
      ];
      this.player.setTexture(cycleFrames[this.walkStep]);
    } else {
      this.walkAnimTimer = 0;
      this.walkStep = 0;

      if (mode === 'computer') {
        this.player.x = this.layout.deskX;
        this.player.y = this.layout.wallFloorY + 10;
        this.player.setDepth(3);
        this.player.setTexture('char-typing-north');
      } else if (mode === 'toilet') {
        this.player.x = this.layout.toiletX;
        this.player.y = this.layout.wallFloorY + 8;
        this.player.setDepth(6);
        this.player.setTexture('char-sitting-south');
      } else if (mode === 'showering') {
        this.player.x = this.layout.showerX;
        this.player.y = this.layout.wallFloorY + 8;
        this.player.setDepth(6);
        this.player.setTexture('char-shower-south');
      } else if (mode === 'napping') {
        this.player.x = this.layout.bedX + 2;
        this.player.y = this.layout.wallFloorY + 4;
        this.player.setDepth(6);
        this.player.setTexture('char-sleep-west');
      } else {
        this.player.y = this.layout.floorY;
        this.player.setDepth(10);

        if (mode === 'eating') {
          this.player.setTexture('char-eat-east');
        } else if (mode === 'drinking') {
          // Uses the water bottle animation exclusively for hydrating at the fridge
          this.player.setTexture('char-drink-east');
        } else {
          // When feeding the baby (mode === 'caring') or idle, stands facing the baby without water bottle
          this.player.setTexture(`char-idle-${this.facing}`);
        }
      }
    }

    // 3. Update baby behavior and visual effects
    this.updateBabyBehavior(time, delta);
    this.renderHazardEffects(time);
    this.renderCharacterEffects(time);

    const headY = this.player.y - 76;
    this.playerLabel.setPosition(this.player.x, headY);

    // 4. Show urgency alert for bathroom emergency or kitchen fire
    if (baby.kitchenFire && isPlayerIdle) {
      this.urgencyText
        .setText('🔥 KITCHEN FIRE!')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (playerState.bladderLevel === 3 && isPlayerIdle) {
      this.urgencyText
        .setText('🚽 BATHROOM EMERGENCY!')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (playerState.bladderLevel === 2 && isPlayerIdle) {
      this.urgencyText
        .setText('🚽 NEED TOILET')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else {
      this.urgencyText.setVisible(false);
    }

    // 5. Check proximity to interactive zones
    let activeZone: InteractiveZone | null = null;
    if (isPlayerIdle) {
      for (const zone of this.zones) {
        if (zone.name === 'kitchen' && !baby.kitchenFire) continue;
        if (zone.name === 'modem' && !baby.modemUnplugged) continue;
        if (Math.abs(this.player.x - zone.x) <= zone.width) {
          activeZone = zone;
          break;
        }
      }
    }

    // 6. Update prompt text & baby carry prompt
    const nearLooseBaby = baby.location === 'loose' && Math.abs(this.player.x - this.babyX) <= 46;

    if (nearLooseBaby && isPlayerIdle) {
      this.promptText
        .setText('[F] / [E] 👶 PICK UP BABY')
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);
      this.secondaryPromptText.setVisible(false);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.pickUpBaby();
      }
    } else if (activeZone && isPlayerIdle) {
      let promptLabel = activeZone.actionText;
      if (activeZone.name === 'desk' && baby.pcUnplugged) {
        promptLabel = '[E] 🔌 PLUG IN PC CABLE';
      } else if (activeZone.name === 'bed') {
        if (baby.location === 'carried') {
          promptLabel = '[F] PUT BABY IN BED · [E] SLEEP TOGETHER';
        } else if (baby.location === 'bed') {
          if (baby.demand === 'crawl') {
            promptLabel = '[E] / [F] 🏃 LET BABY CRAWL';
          } else if (baby.demand === 'sleep') {
            promptLabel = '[E] / [F] 😴 CARRY TO SLEEP';
          } else if (baby.demand === 'feed') {
            promptLabel = '[E] 🍼 FEED BOTTLE · [F] CARRY';
          } else {
            promptLabel = '[E] REST / NAP · [F] CARRY BABY';
          }
        }
      } else if (activeZone.name === 'crib') {
        if (baby.location === 'carried') {
          promptLabel = '[E] / [F] 🛏️ PUT BABY IN CRIB';
        } else if (baby.location === 'crib') {
          if (baby.demand === 'crawl') {
            promptLabel = '[E] / [F] 🏃 LET BABY CRAWL';
          } else if (baby.demand === 'sleep') {
            promptLabel = '[E] / [F] 😴 CARRY TO SLEEP';
          } else {
            promptLabel = '[E] 🍼 FEED BOTTLE · [F] CARRY BABY';
          }
        }
      }

      this.promptText
        .setText(promptLabel)
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        activeZone.onInteract();
      }
    } else {
      this.promptText.setVisible(false);
    }

    // Secondary prompt when holding baby away from crib and bed
    const nearCribOrBed =
      Math.abs(this.player.x - this.layout.cribX) <= 48 ||
      Math.abs(this.player.x - this.layout.bedX) <= 48;

    if (baby.location === 'carried' && isPlayerIdle && !nearCribOrBed) {
      this.secondaryPromptText
        .setText(baby.carriedAsleep ? '🛏️ TAKE TO CRIB OR BED [F]' : '[F] PUT BABY ON FLOOR')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else {
      this.secondaryPromptText.setVisible(false);
    }

    // 7. Show status badge when performing activity
    if (!isPlayerIdle && mode !== 'computer') {
      const label = mode.toUpperCase() + '...';
      this.statusText
        .setText(label)
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);
    } else {
      this.statusText.setVisible(false);
    }
  }
}
