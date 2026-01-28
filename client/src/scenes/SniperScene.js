import Phaser from 'phaser';

export default class SniperScene extends Phaser.Scene {
  constructor() {
    super('SniperScene');
    this.birdGroup = null;
    this.ammo = 20;
    this.wind = { x: 0 };
    this.gameId = null;
    this.isGameOver = false;
    this.socket = null; // Will be set in init or registry
  }

  init(data) {
    // Data passed from React component or previous scene
    this.socket = data.socket;
    this.gameId = data.gameId;
    this.wind = data.wind || { x: 0 };
    this.birdData = data.birds || [];
    this.birds = []; // Important: Clear/Initialize local birds array
    this.weapon = data.weapon || { type: 'bow', name: 'Wooden Bow' };
    
    // Callbacks if local, but we prefer socket events
    this.onShotResult = data.onShotResult; 
    this.onGameOver = data.onGameOver;
    
    this.ammo = 20;
    this.isGameOver = false;
  }

  preload() {
    // UI & Environment Assets
    this.load.image('crosshair', 'assets/ui/crosshair.png');
    this.load.image('arrow', 'assets/projectiles/arrow.png');
    this.load.image('pellet', 'assets/projectiles/pellet.png');
    this.load.image('sky', 'assets/environment/sky_day.png');
    this.load.image('trees', 'assets/environment/trees.png');
    this.load.image('ground', 'assets/environment/ground.png');
    this.load.image('feather', 'assets/effects/feather.png');
    this.load.image('spark', 'assets/effects/spark.png');
    
    // Bird Assets - Spritesheets for animations
    const birdTypes = ['eagle', 'pigeon', 'sparrow', 'rare', 'crow', 'phoenix'];
    birdTypes.forEach(type => {
        if (type === 'eagle') {
            // Eagle: 64x192 total -> 64x32 per frame, 6 frames
            this.load.spritesheet(`${type}_fly`, `assets/birds/${type}/fly.png`, { frameWidth: 64, frameHeight: 32 });
        } else {
            // Others: 192x64 total -> 64x64 per frame, 3 frames
            this.load.spritesheet(`${type}_fly`, `assets/birds/${type}/fly.png`, { frameWidth: 64, frameHeight: 64 });
        }
    });

    this.birdColors = {
      sparrow: 0x8B4513,
      pigeon: 0x808080,
      crow: 0x222222,
      eagle: 0xD2691E,
      phoenix: 0xFFD700,
      rare: 0xFF00FF
    };
  }

  create() {
    const { width, height } = this.scale;

    // 1. Parallax Backgrounds
    this.sky = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0).setScrollFactor(0);
    this.trees = this.add.tileSprite(0, height - 200, width, 200, 'trees').setOrigin(0).setScrollFactor(0.2);
    this.ground = this.add.tileSprite(0, height - 50, width, 50, 'ground').setOrigin(0).setScrollFactor(1);
    
    // Create Animations
    ['eagle', 'pigeon', 'sparrow', 'rare', 'crow', 'phoenix'].forEach(type => {
        if (this.textures.exists(`${type}_fly`)) {
            const endFrame = (type === 'eagle') ? 5 : 2;
            this.anims.create({
                key: `${type}_fly_anim`,
                frames: this.anims.generateFrameNumbers(`${type}_fly`, { start: 0, end: endFrame }),
                frameRate: (type === 'eagle') ? 12 : 8, // Eagle flies faster?
                repeat: -1
            });
        }
    });

    // 2. Entity Groups
    this.birdGroup = this.physics.add.group();
    this.projectileGroup = this.physics.add.group();

    // 3. Spawning Birds
    this.birdData.forEach(data => {
      // Logic: server sends { x: 0-100, y: 0-100 }. We map to screen pixels.
      const screenX = data.x * (width / 100);
      const screenY = data.y * (height / 100);
      
      let bird;
      if (this.textures.exists(`${data.type}_fly`)) {
          bird = this.physics.add.sprite(screenX, screenY, `${data.type}_fly`);
          bird.play(`${data.type}_fly_anim`);
      } else {
          // Fallback to geometric bird
          bird = this.add.container(screenX, screenY);
          const body = this.add.triangle(0, 0, 0, -15, 15, 15, -15, 15, this.birdColors[data.type] || 0xffffff);
          bird.add(body);
          this.physics.add.existing(bird);
      }
      
      // Random velocity based on type speed
      bird.body.setVelocity(Phaser.Math.Between(-50, 50) * data.speed, Phaser.Math.Between(-20, 20) * data.speed);
      
      bird.setData('id', data.id);
      bird.setData('type', data.type);
      this.birdGroup.add(bird);
    });

    // 4. Weapon Mechanics
    const isAirgun = this.weapon?.type === 'airgun';
    if (!isAirgun) {
        this.bow = this.add.sprite(width / 2, height - 50, 'bow' in this.textures.list ? 'bow' : null);
        if (!this.bow.texture.key) {
             // Fallback graphic
             this.bow = this.add.rectangle(width / 2, height - 50, 60, 10, 0x3bc117).setOrigin(0.5, 1);
        }
        // If texture, set origin
        if(this.bow.setOrigin) this.bow.setOrigin(0.5, 1);
        
        this.bowString = this.add.graphics().setDepth(99);
    } else {
        this.gun = this.add.rectangle(width / 2, height - 20, 20, 80, 0x555555).setOrigin(0.5, 1);
    }

    // 5. Particle Systems
    this.featherEmitter = this.add.particles(0, 0, 'feather', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        gravityY: 100,
        emitting: false
    });

    this.sparkEmitter = this.add.particles(0, 0, 'spark', {
        speed: { min: 100, max: 300 },
        scale: { start: 0.2, end: 0 },
        lifespan: 300,
        emitting: false
    });

    // UI Elements
    this.crosshair = this.add.sprite(width / 2, height / 2, 'crosshair').setScale(0.6).setDepth(101);
    this.windLabel = this.add.text(20, 20, `WIND: ${this.wind.x.toFixed(2)}`, { font: 'bold 12px monospace', fill: '#3bc117' });
    this.ammoLabel = this.add.text(20, 40, `AMMO: ${this.ammo}`, { font: 'bold 12px monospace', fill: '#ffffff' });

    // Input Handling
    this.input.on('pointermove', (pointer) => {
      this.crosshair.setPosition(pointer.x, pointer.y);
      const angle = Phaser.Math.Angle.Between(width/2, height, pointer.x, pointer.y);
      if (this.bow) {
          this.bow.setRotation(angle + Math.PI / 2);
          if (this.bowString) this.drawBowString(0);
      } else if (this.gun) {
          this.gun.setRotation(angle + Math.PI / 2);
      }
    });

    this.input.on('pointerdown', (pointer) => this.handleShoot(pointer));

    // Socket Listeners for Results
    if (this.socket) {
        this.socket.on('bird_shoot:shot_result', (result) => {
            this.handleServerShotResult(result);
        });
        
        this.socket.on('bird_shoot:game_over', (result) => {
            if (this.onGameOver) this.onGameOver(result);
        });
    }
  }

  handleShoot(pointer) {
    if (this.ammo <= 0 || this.isGameOver) return;
    this.ammo--;
    this.ammoLabel.setText(`AMMO: ${this.ammo}`);
    
    const isAirgun = this.weapon?.type === 'airgun';

    if (isAirgun) {
        const flash = this.add.circle(this.gun.x, this.gun.y - 60, 20, 0xffff00, 0.8);
        this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 50, onComplete: () => flash.destroy() });
        this.fireProjectile(pointer, 'pellet', 2000);
    } else {
        // Bow Stretch Animation
        this.tweens.addCounter({
            from: 0, to: 30, duration: 100,
            onUpdate: (tween) => this.drawBowString(tween.getValue()),
            onComplete: () => {
                this.drawBowString(0);
                this.fireProjectile(pointer, 'arrow', 1000);
            }
        });
    }
    this.cameras.main.shake(100, isAirgun ? 0.01 : 0.005);
  }

  fireProjectile(pointer, texture, speed) {
    const startX = this.scale.width / 2;
    const startY = this.scale.height - 50;
    const angle = Phaser.Math.Angle.Between(startX, startY, pointer.x, pointer.y);
    const proj = this.add.sprite(startX, startY, texture).setScale(0.5);
    proj.setRotation(angle + Math.PI / 2);
    this.physics.add.existing(proj);
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.projectileGroup.add(proj);
    
    // Store data on projectile to match with result
    proj.setData('firedAt', Date.now());

    const shotData = { 
        x: (pointer.x / this.scale.width) * 100, 
        y: (pointer.y / this.scale.height) * 100, 
        angle, 
        power: 1.0 
    };

    // Emit to server
    if (this.socket && this.gameId) {
        this.socket.emit('bird_shoot:shoot', { gameId: this.gameId, shotData });
    }
    
    // Check end game locally
    if (this.ammo === 0) { 
        this.isGameOver = true; 
        this.time.delayedCall(2000, () => {
            if (this.socket && this.gameId) {
                this.socket.emit('bird_shoot:end', { gameId: this.gameId });
            }
        }); 
    }
  }

  handleServerShotResult(result) {
      if (!result) return;
      // We could match projectile here, but for now we just process the hit
      
      if (result.hit) {
          // Find which projectile caused this? 
          // Simplification: We assume the last fired projectile hit or we just show effect at bird location
          
          // Find bird
          const bird = this.birdGroup.getChildren().find(b => b.getData('id') === result.birdId);
          if (bird) {
               this.triggerKillEffect(bird, result.alive, result.combo);
          }
      }
  }

  triggerKillEffect(bird, stillAlive, combo) {
    const x = bird.x;
    const y = bird.y;

    this.featherEmitter.emitParticleAt(x, y, 10);
    this.sparkEmitter.emitParticleAt(x, y, 5);
    
    // Floating Combo Text
    if (combo > 1) {
        const comboText = this.add.text(x, y - 40, `X${combo}`, { font: 'bold 20px monospace', fill: '#3bc117' });
        this.tweens.add({ targets: comboText, y: y - 100, alpha: 0, duration: 800, onComplete: () => comboText.destroy() });
    }

    if (!stillAlive) {
        // Kill animation
        this.tweens.add({
            targets: bird,
            y: bird.y + 100,
            alpha: 0,
            angle: 180,
            duration: 500,
            onComplete: () => bird.destroy()
        });
    } else {
        // Damage flash
        bird.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (bird.active) bird.clearTint();
        });
    }
  }

  drawBowString(stretch) {
    if (!this.bowString) return;
    this.bowString.clear();
    this.bowString.lineStyle(2, 0xffffff, 0.5);
    const angle = this.bow.rotation - Math.PI / 2;
    const leftX = this.bow.x + Math.cos(angle - 0.5) * 30;
    const leftY = this.bow.y + Math.sin(angle - 0.5) * 30;
    const rightX = this.bow.x + Math.cos(angle + 0.5) * 30;
    const rightY = this.bow.y + Math.sin(angle + 0.5) * 30;
    const midX = this.bow.x + Math.cos(angle + Math.PI) * stretch;
    const midY = this.bow.y + Math.sin(angle + Math.PI) * stretch;
    this.bowString.beginPath().moveTo(leftX, leftY).lineTo(midX, midY).lineTo(rightX, rightY).strokePath();
  }

  update(time, delta) {
    // Parallax
    this.sky.tilePositionX += this.wind.x * 0.1;
    
    // Bird Movement and Bounds
    const { width, height } = this.scale;
    this.birdGroup.getChildren().forEach(bird => {
        // Simple bounds wrap
        if (bird.x > width + 50) bird.x = -50;
        if (bird.x < -50) bird.x = width + 50;
        if (bird.y > height + 50) bird.y = -50;
        if (bird.y < -50) bird.y = height + 50;
    });
  }
}