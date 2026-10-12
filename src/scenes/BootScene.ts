import Phaser from 'phaser';
import { registerFont } from '../art/font';
import { userSprites, createAnimsFromAseprite, createStaticAnim } from '../art/sprites';
import { buildPlaceholders } from '../art/placeholders';
import { buildStreet } from '../art/street';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const s of userSprites) {
      if (s.json) this.load.atlas(s.key, s.png, s.json);
      else this.load.image(s.key, s.png);
    }
  }

  create() {
    registerFont(this);

    const provided = new Set<string>();
    for (const s of userSprites) {
      if (!this.textures.exists(s.key)) continue;
      provided.add(s.key);
      if (s.json) createAnimsFromAseprite(this, s.key, s.json);
      else createStaticAnim(this, s.key);
    }
    if (provided.size) console.info(`Arte hecho a mano: ${[...provided].join(', ')}`);

    buildPlaceholders(this, provided);
    buildStreet(this);

    // ?calle salta la portada (útil mientras se itera)
    this.scene.start(new URLSearchParams(location.search).has('calle') ? 'street' : 'title');
  }
}
