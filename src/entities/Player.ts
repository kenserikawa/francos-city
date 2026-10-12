import Phaser from 'phaser';
import { PLAYER } from '../config';
import { animKey } from '../art/sprites';
import type { Controls } from '../input/Controls';

const BODY_W = 12;
const BODY_H = 34;

/** Pablo. Movimiento con aceleración, coyote time, buffer de salto y salto variable. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  facing: 1 | -1 = 1;
  canThrow: () => boolean = () => true;

  private lastGroundedAt = -Infinity;
  private jumpPressedAt = -Infinity;
  private jumpCutAvailable = false;
  private throwingUntil = 0;
  private nextThrowAt = 0;
  private wasGrounded = true;
  private nextStepAt = 0;
  private idleSince = -1;
  private boredUntil = 0;
  private nextBoredAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pablo');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    // El cuerpo se calcula sobre el tamaño de frame real: sirve igual para el placeholder que para tu arte.
    const fw = this.frame.realWidth, fh = this.frame.realHeight;
    this.body.setSize(BODY_W, BODY_H, false);
    this.body.setOffset((fw - BODY_W) / 2, fh - BODY_H);
    this.body.maxVelocity.set(1000, PLAYER.maxFall);
    this.setCollideWorldBounds(true);
    this.play(animKey(scene, 'pablo', 'idle'));
  }

  tick(controls: Controls, time: number, delta: number) {
    const dt = delta / 1000;
    const body = this.body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) {
      this.lastGroundedAt = time;
      if (!this.wasGrounded) this.emit('land', this.x, this.y);
    }
    this.wasGrounded = grounded;

    // Horizontal: acelerar hacia la velocidad objetivo
    const dir = controls.axisX();
    if (dir) this.facing = dir;
    const target = dir * PLAYER.runSpeed;
    const accel = !grounded ? PLAYER.accelAir : dir ? PLAYER.accelGround : PLAYER.decelGround;
    body.setVelocityX(approach(body.velocity.x, target, accel * dt));

    // Salto con buffer y coyote time
    if (controls.justPressed('jump')) this.jumpPressedAt = time;
    const buffered = time - this.jumpPressedAt <= PLAYER.jumpBufferMs;
    const coyote = time - this.lastGroundedAt <= PLAYER.coyoteMs;
    if (buffered && coyote) {
      body.setVelocityY(-PLAYER.jumpVelocity);
      this.jumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
      this.jumpCutAvailable = true;
      this.emit('jump', this.x, this.y);
    }
    if (this.jumpCutAvailable && !controls.isDown('jump') && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.jumpCut);
      this.jumpCutAvailable = false;
    }
    if (body.velocity.y >= 0) this.jumpCutAvailable = false;

    // Lanzar paquete
    if (controls.justPressed('throw') && time >= this.nextThrowAt && this.canThrow()) {
      this.nextThrowAt = time + PLAYER.throwCooldownMs;
      this.throwingUntil = time + 220;
      this.play(animKey(this.scene, 'pablo', 'throw'));
      // El paquete sale en el frame en que el brazo se estira
      this.scene.time.delayedCall(40, () => this.emit('throw', this.x + this.facing * 12, this.y - 11, this.facing));
    }

    // Polvo al correr
    if (grounded && Math.abs(body.velocity.x) > PLAYER.runSpeed * 0.8 && time >= this.nextStepAt) {
      this.nextStepAt = time + 240;
      this.emit('step', this.x - this.facing * 4, this.y, this.facing);
    }

    this.setFlipX(this.facing === -1);
    this.updateAnim(time, grounded);
  }

  private updateAnim(time: number, grounded: boolean) {
    if (time < this.throwingUntil) return;
    let name = 'idle';
    if (!grounded) name = this.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.body.velocity.x) > 10) name = 'run';

    if (name !== 'idle') {
      this.idleSince = -1;
      this.boredUntil = 0;
    } else {
      if (this.idleSince < 0) this.idleSince = time;
      if (time < this.boredUntil) return;
      // Quieto un rato: saca el móvil
      const bored = this.scene.anims.get('pablo:aburrido');
      if (bored && time - this.idleSince > 4500 && time >= this.nextBoredAt) {
        this.play(bored);
        this.boredUntil = time + bored.frames.reduce((ms, f) => ms + (f.duration || bored.msPerFrame), 0);
        this.nextBoredAt = time + 9000;
        return;
      }
    }
    this.play(animKey(this.scene, 'pablo', name), true);
  }
}

function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
