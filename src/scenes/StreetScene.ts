import Phaser from 'phaser';
import { GAME_W, GAME_H, WORLD_W, FLOOR_Y, PLAYER, DEPTH, IS_TOUCH } from '../config';
import { PAL } from '../art/palette';
import { MARUJA_X } from '../art/street';
import { animKey } from '../art/sprites';
import { Controls } from '../input/Controls';
import { touch } from '../input/TouchPad';
import { Player } from '../entities/Player';
import { Cartel } from '../entities/Cartel';
import { blinkOut, createFx, floatText, hitStop, shake, snap, type Fx } from '../fx/juice';
import { aimBubble, label, speechBubble } from '../ui/text';
import { addStreetBackdrop } from './backdrop';

const BARKS = [
  'Pablo, hijo, antes esto era un barrio.',
  'Ahora todo es «experiencia». ¡Experiencia!',
  'A Manolo le vienen a medir el bar. A medir, Pablo.',
  '¿Tú comes bien? Estás muy delgado.',
];

const CARTEL_XS = [262, 690, 812, 1110];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type PackageImage = Phaser.Physics.Arcade.Image & { body: Phaser.Physics.Arcade.Body };

/** Calle de los Francos Viejos: hito 1, moverse, saltar y lanzar paquetes. */
export class StreetScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;
  private fx!: Fx;
  private packages!: Phaser.Physics.Arcade.Group;
  private maruja!: Phaser.GameObjects.Sprite;
  private bubble?: Phaser.GameObjects.Container;
  private hints?: Phaser.GameObjects.Container;
  private camX = 0;
  private lookX = 0;
  private nextBarkAt = 0;
  private barkIndex = 0;
  private usedJump = false;
  private usedThrow = false;

  constructor() {
    super('street');
  }

  create() {
    this.bubble = undefined;
    this.usedJump = this.usedThrow = false;
    this.controls = new Controls(this);
    touch.setVisible(true);
    addStreetBackdrop(this);

    this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);
    const ground = this.add.zone(WORLD_W / 2, FLOOR_Y + 8, WORLD_W, 16);
    this.physics.add.existing(ground, true);

    this.maruja = this.add.sprite(MARUJA_X, FLOOR_Y - 5, 'maruja').setOrigin(0.5, 1).setDepth(DEPTH.npc);
    this.maruja.play(animKey(this, 'maruja', 'idle'));

    const carteles = this.physics.add.staticGroup();
    for (const x of CARTEL_XS) carteles.add(new Cartel(this, x, FLOOR_Y - 3));

    this.player = new Player(this, 60, FLOOR_Y);
    this.player.setDepth(DEPTH.player);
    this.physics.add.collider(this.player, ground);

    this.packages = this.physics.add.group();
    this.physics.add.collider(this.packages, ground, (pkg) => this.onPackageGround(pkg as PackageImage));
    this.physics.add.overlap(this.packages, carteles, (pkg, cartel) => this.onPackageHit(pkg as PackageImage, cartel as Cartel));

    this.fx = createFx(this, DEPTH.fx);
    this.player.canThrow = () => this.packages.countActive(true) < PLAYER.maxPackages;
    this.player.on('throw', (x: number, y: number, dir: 1 | -1) => this.spawnPackage(x, y, dir));
    this.player.on('jump', (x: number, y: number) => {
      this.fx.dust(x, y, 5);
      this.usedJump = true;
    });
    this.player.on('land', (x: number, y: number) => this.fx.dust(x, y, 6));
    this.player.on('step', (x: number, y: number, dir: 1 | -1) => this.fx.dust(x, y, 2, dir));

    this.camX = clamp(this.player.x - GAME_W / 2, 0, WORLD_W - GAME_W);
    this.cameras.main.scrollX = Math.round(this.camX);
    this.cameras.main.fadeIn(400, 14, 11, 13);

    this.showStreetPlate();
    // En móvil los botones ya dicen lo que hacen
    if (IS_TOUCH) return;
    this.hints = label(this, GAME_W / 2, GAME_H - 3, '← → andar    Z saltar    X lanzar paquete', 'papel', {
      origin: [0.5, 1],
      scroll: 0,
      depth: DEPTH.hud,
    });
    this.time.delayedCall(12000, () => this.hideHints());
  }

  update(time: number, delta: number) {
    this.controls.update();
    this.player.tick(this.controls, time, delta);
    this.updatePackages(delta);
    this.updateCamera(delta);
    this.updateMaruja(time);
    if (this.usedJump && this.usedThrow) this.hideHints();
  }

  private spawnPackage(x: number, y: number, dir: 1 | -1) {
    const pkg = this.packages.create(x, y, 'paquete') as PackageImage;
    pkg.setDepth(DEPTH.packages);
    pkg.body.setGravityY(-500);
    pkg.body.setVelocity(dir * 230 + this.player.body.velocity.x * 0.3, -70);
    pkg.body.setBounce(0.35, 0.35);
    pkg.setData({ dir, spin: 0, hits: 0, born: this.time.now });
    this.usedThrow = true;
  }

  private updatePackages(delta: number) {
    const left = this.cameras.main.scrollX - 24;
    const right = left + GAME_W + 48;
    for (const obj of [...this.packages.getChildren()] as PackageImage[]) {
      if (!obj.active) continue;
      // Giro a saltos de 90°: se ve nítido a esta resolución
      const spin = obj.getData('spin') + delta;
      if (spin >= 60) {
        obj.angle += 90 * obj.getData('dir');
        obj.setData('spin', 0);
      } else obj.setData('spin', spin);
      if (this.time.now - obj.getData('born') > 1600 || obj.x < left || obj.x > right) obj.destroy();
    }
  }

  private onPackageGround(pkg: PackageImage) {
    const hits = pkg.getData('hits') + 1;
    pkg.setData('hits', hits);
    pkg.body.velocity.x *= 0.6;
    if (hits === 1) this.fx.dust(pkg.x, FLOOR_Y, 3);
    if (hits >= 3) {
      this.fx.dust(pkg.x, FLOOR_Y, 4);
      pkg.destroy();
    }
  }

  private onPackageHit(pkg: PackageImage, cartel: Cartel) {
    if (cartel.broken || !pkg.active) return;
    const { x, y } = pkg;
    pkg.destroy();
    this.fx.paper(x, y, 6);
    if (cartel.hit() === 'broken') {
      this.fx.paper(cartel.x, cartel.y - 26, 24);
      shake(this, 110, 0.015);
      hitStop(this, 70);
      floatText(this, cartel.x, cartel.y - 36, '-1 autenticidad', PAL.alarma, DEPTH.bubble);
    } else {
      hitStop(this, 30);
    }
  }

  private updateCamera(delta: number) {
    const dt = delta / 1000;
    // Mira un poco hacia donde camina Pablo
    this.lookX += (this.player.facing * 28 - this.lookX) * (1 - Math.exp(-dt * 2.5));
    const target = clamp(this.player.x + this.lookX - GAME_W / 2, 0, WORLD_W - GAME_W);
    this.camX += (target - this.camX) * (1 - Math.exp(-dt * 7));
    this.cameras.main.scrollX = Math.round(this.camX);
  }

  private updateMaruja(time: number) {
    const dx = this.player.x - this.maruja.x;
    this.maruja.setFlipX(dx < 0);
    if (this.bubble) aimBubble(this.bubble, this.maruja.x);
    if (Math.abs(dx) < 64 && time >= this.nextBarkAt && !this.bubble) {
      const text = BARKS[this.barkIndex++ % BARKS.length];
      this.maruja.play(animKey(this, 'maruja', 'talk'));
      const bubble = speechBubble(this, this.maruja.x, this.maruja.y - 36, text).setDepth(DEPTH.bubble);
      this.tweens.add({ targets: bubble, y: { from: bubble.y + 3, to: bubble.y }, duration: 140, ease: 'Back.easeOut', onUpdate: () => snap(bubble) });
      this.bubble = bubble;
      this.time.delayedCall(1200 + text.length * 45, () => {
        this.maruja.play(animKey(this, 'maruja', 'idle'));
        bubble.destroy();
        this.bubble = undefined;
      });
      this.nextBarkAt = time + 7000;
    }
  }

  private showStreetPlate() {
    const plate = this.add.image(8, -40, 'placa-calle').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.hud);
    this.tweens.chain({
      targets: plate,
      tweens: [
        { y: 8, duration: 420, ease: 'Back.easeOut', delay: 450, onUpdate: () => snap(plate) },
        { y: -40, duration: 360, ease: 'Cubic.easeIn', delay: 3200, onUpdate: () => snap(plate) },
      ],
    });
  }

  private hideHints() {
    const hints = this.hints;
    if (!hints) return;
    this.hints = undefined;
    blinkOut(this, [hints]);
  }
}
