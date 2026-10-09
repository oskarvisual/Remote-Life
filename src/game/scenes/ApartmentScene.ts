import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import type { GameSession } from '../GameSession';

interface InteractiveZone {
  name: string;
  x: number;
  width: number;
  actionText: string;
  onInteract: () => void;
}

export class ApartmentScene extends Phaser.Scene {
  private session!: GameSession;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;

  private player!: Phaser.GameObjects.Rectangle;
  private playerLabel!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private cryText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private zones: InteractiveZone[] = [];

  constructor() {
    super('Apartment');
  }

  create(): void {
    this.session = this.game.registry.get('session') as GameSession;
    if (!this.session) {
      throw new Error('GameSession not found in Phaser registry');
    }

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    this.drawApartment();
    this.createPlayer();
    this.setupZones();
    this.setupEventListeners();
  }

  private drawApartment(): void {
    this.cameras.main.setBackgroundColor('#573d42');
    const g = this.add.graphics();

    // Wall & floor
    g.fillStyle(0xd89c64).fillRect(0, 0, 480, 270);
    g.fillStyle(0x8b5f4a).fillRect(0, 230, 480, 40);
    g.fillStyle(0xf1c97c).fillRect(0, 224, 480, 6);

    // Window
    g.fillStyle(0x4b6770).fillRect(8, 28, 70, 100);
    g.fillStyle(0x9bb7bf).fillRect(12, 33, 62, 90);

    // Bed (x: 20..80)
    g.fillStyle(0x634039).fillRect(20, 181, 75, 38);
    g.fillStyle(0xd78b72).fillRect(25, 177, 65, 13);
    this.add.text(35, 198, 'BED', { fontFamily: 'monospace', fontSize: '9px', color: '#ffe8bb' });

    // Fridge / Kitchen (x: 105..145)
    g.fillStyle(0xd5dbdb).fillRect(105, 150, 38, 74);
    g.lineStyle(2, 0x7f8c8d).strokeRect(105, 150, 38, 74);
    g.fillStyle(0x95a5a6).fillRect(109, 178, 6, 12);
    this.add.text(109, 210, 'FRIDGE', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#2c3e50',
    });

    // Computer desk (x: 185..260)
    g.fillStyle(0x55362e).fillRect(185, 170, 76, 53);
    g.fillStyle(0x26333c).fillRect(198, 139, 38, 30);
    g.fillStyle(0x79b5ba).fillRect(202, 143, 30, 20);
    this.add.text(194, 231, 'DESK', { fontFamily: 'monospace', fontSize: '8px', color: '#3b2422' });

    // Baby crib (x: 295..365)
    g.fillStyle(0x794a37).fillRect(295, 177, 72, 46);
    g.lineStyle(3, 0x43291f).strokeRect(295, 177, 72, 46);
    this.add.text(304, 195, 'BABY CRIB', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffe8bb',
    });

    // Crying indicator
    this.cryText = this.add
      .text(308, 150, 'WAHH!\n  ♫', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f3315c',
        align: 'center',
      })
      .setVisible(false);

    // Door
    g.fillStyle(0x647c5b).fillRect(425, 133, 42, 91);
    this.add.text(430, 228, 'DOOR', { fontFamily: 'monospace', fontSize: '8px', color: '#3b2422' });
  }

  private createPlayer(): void {
    this.player = this.add.rectangle(150, 207, 13, 24, 0xf5b971).setOrigin(0.5, 1);
    this.player.setStrokeStyle(2, 0x36221d);

    this.playerLabel = this.add.text(138, 169, 'YOU', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#fff4d4',
    });

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#151820',
        backgroundColor: '#ffe1a0',
        padding: { x: 4, y: 2 },
      })
      .setDepth(3)
      .setVisible(false);

    this.statusText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        padding: { x: 3, y: 1 },
      })
      .setDepth(3)
      .setVisible(false);
  }

  private setupZones(): void {
    this.zones = [
      {
        name: 'bed',
        x: 55,
        width: 40,
        actionText: '[E] REST / NAP',
        onInteract: () => this.session.activities.start('nap'),
      },
      {
        name: 'fridge',
        x: 124,
        width: 30,
        actionText: '[E] EAT MEAL',
        onInteract: () => this.session.activities.start('eat'),
      },
      {
        name: 'desk',
        x: 220,
        width: 35,
        actionText: '[E] OPEN COMPUTER',
        onInteract: () => this.session.events.emit('computer:open'),
      },
      {
        name: 'crib',
        x: 330,
        width: 40,
        actionText: '[E] CARE FOR BABY',
        onInteract: () => this.session.activities.start('care'),
      },
    ];
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

  override update(_time: number, delta: number): void {
    // 1. Advance game simulation session
    this.session.update(delta);

    // 2. Handle player input and movement
    const isPlayerIdle = this.session.state.player.isIdle;
    let dx = 0;

    if (isPlayerIdle) {
      if (this.cursors.left?.isDown || this.keyA?.isDown) dx = -1;
      if (this.cursors.right?.isDown || this.keyD?.isDown) dx = 1;
    }

    if (dx !== 0) {
      const speed = BALANCE.player.walkSpeed;
      this.player.x = Phaser.Math.Clamp(this.player.x + (dx * speed * delta) / 1000, 18, 465);
      this.player.setFillStyle(0xffcf78); // walking tint
    } else {
      this.player.setFillStyle(0xf5b971); // base idle tint
    }

    this.playerLabel.setPosition(this.player.x - 10, 169);

    // 3. Check proximity to zones
    let activeZone: InteractiveZone | null = null;
    if (isPlayerIdle) {
      for (const zone of this.zones) {
        if (Math.abs(this.player.x - zone.x) <= zone.width) {
          activeZone = zone;
          break;
        }
      }
    }

    // 4. Update prompt text
    if (activeZone && isPlayerIdle) {
      this.promptText
        .setText(activeZone.actionText)
        .setPosition(this.player.x - 35, 135)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        activeZone.onInteract();
      }
    } else {
      this.promptText.setVisible(false);
    }

    // 5. Show status badge when performing activity
    const mode = this.session.state.player.mode;
    if (!isPlayerIdle && mode !== 'computer') {
      const label = mode.toUpperCase() + '...';
      this.statusText
        .setText(label)
        .setPosition(this.player.x - 25, 135)
        .setVisible(true);
    } else {
      this.statusText.setVisible(false);
    }
  }
}
