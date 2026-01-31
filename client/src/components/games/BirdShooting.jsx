import React, { useState, useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Trophy, Zap, Gamepad2, AlertCircle, ShieldCheck, Home, ShoppingBag, User as UserIcon, Coins, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { updateWallet, setUserData, updateInventory } from '../../redux/slices/userSlice';
import { shopAPI } from '../../services/api';

import Arrow from '../../entities/Arrow';

// --- Environment Themes ---
const ENVIRONMENT_THEMES = {
  1: { sky: 'skybgg.jpg', ground: 'ground.png', groundColor: 0x3a5f0b, fog: 0x87CEEB },
  2: { sky: 'hill background.jpg', ground: 'ground2.png', groundColor: 0x5d4037, fog: 0x90a4ae },
  3: { sky: 'night_background.png', ground: 'ground.png', groundColor: 0x1a2c38, fog: 0x0f212e },
  4: { sky: 'rainbow_background.png', ground: 'ground2.png', groundColor: 0x4a148c, fog: 0x6a1b9a }
};

class HapticSystem {
  constructor() {
    this.enabled = 'vibrate' in navigator;
  }

  trigger(type) {
    if (!this.enabled) return;

    switch (type) {
      case 'draw_start':
        navigator.vibrate(20);
        break;
      case 'draw_tension':
        navigator.vibrate([10, 30, 10]);
        break;
      case 'shoot':
        navigator.vibrate([50, 20]);
        break;
      case 'hit':
        navigator.vibrate([20, 50, 20, 50]);
        break;
      case 'scope_enter':
        navigator.vibrate(10);
        break;
      default:
        break;
    }
  }
}

class SoundSystem {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.audioContext = THREE.AudioContext.getContext();
    this.sounds = {};
  }

  load() {
    console.log("SoundSystem: Initialized with Synthesized Audio Fallback");
  }

  play(name) {
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    switch(name) {
        case 'draw': this.synthDraw(); break;
        case 'shoot': this.synthShoot(); break;
        case 'hit': this.synthHit(); break;
        case 'scope': this.synthScope(); break;
    }
  }

  synthDraw() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(40, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.audioContext.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.5);
  }

  synthShoot() {
    const noise = this.audioContext.createBufferSource();
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    noise.start();
  }

  synthHit() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  synthScope() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }
}

class BirdSystem3D {
  constructor(game, serverBirds) {
    this.game = game;
    this.birds = [];
    this.birdConfigs = {
      sparrow: { speed: 1.5, size: 0.4, color: 0x8B4513, points: 10 },
      pigeon: { speed: 1.2, size: 0.5, color: 0x808080, points: 15 },
      crow: { speed: 2.0, size: 0.6, color: 0x212121, points: 25 },
      eagle: { speed: 3.0, size: 1.2, color: 0xD2691E, points: 50 },
      phoenix: { speed: 4.5, size: 1.5, color: 0xff3d00, points: 150 }
    };
    
    this.initFromData(serverBirds);
  }

  initFromData(serverBirds) {
    if (!serverBirds) return;
    
    serverBirds.forEach((data) => {
      const config = this.birdConfigs[data.type] || this.birdConfigs.sparrow;
      const bird = this.createBird(data, config);
      
      // Map server 0-100 coordinates to world -50 to 50
      bird.mesh.position.set(
        (data.x - 50),
        data.y + 10, // Elevation
        -40 - (Math.random() * 40) // Depth layers
      );
      
      bird.velocity = new THREE.Vector3(config.speed * 2, 0, 0);
      bird.active = true;
      bird.serverId = data.id;
      this.birds.push(bird);
      this.game.scene.add(bird.mesh);
    });
  }

  createBird(data, config) {
    const birdGroup = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(config.size, 8, 8),
        new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.8 })
    );
    body.scale.set(1, 0.6, 1.2);
    body.castShadow = true;
    body.receiveShadow = true;
    birdGroup.add(body);
    
    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: config.color, side: THREE.DoubleSide });
    const wingLeft = new THREE.Mesh(new THREE.PlaneGeometry(config.size * 2, config.size), wingMat);
    wingLeft.position.set(-config.size, 0, 0);
    wingLeft.rotation.y = Math.PI / 2;
    birdGroup.add(wingLeft);
    birdGroup.wingLeft = wingLeft;

    const wingRight = new THREE.Mesh(new THREE.PlaneGeometry(config.size * 2, config.size), wingMat);
    wingRight.position.set(config.size, 0, 0);
    wingRight.rotation.y = -Math.PI / 2;
    birdGroup.add(wingRight);
    birdGroup.wingRight = wingRight;
    
    return {
      mesh: birdGroup,
      type: config,
      wingFlapSpeed: 5 + Math.random() * 5,
      wingFlapPhase: Math.random() * Math.PI,
      serverId: data.id
    };
  }

  updateFlock(deltaTime) {
    this.birds.forEach((bird) => {
      if (!bird.active || bird.isDying) return;
      
      bird.mesh.position.x += bird.velocity.x * deltaTime;
      if (bird.mesh.position.x > 60) bird.mesh.position.x = -60;
      
      const time = Date.now() * 0.001;
      const flap = Math.sin(time * bird.wingFlapSpeed + bird.wingFlapPhase) * 0.8;
      bird.mesh.wingLeft.rotation.z = flap;
      bird.mesh.wingRight.rotation.z = -flap;
    });
  }

  createFeatherExplosion(position) {
    const featherCount = 12;
    const loader = new THREE.TextureLoader();
    const basename = window.location.hostname.includes('github.io') ? '/game' : '';
    const texture = loader.load(`${basename}/assets/effects/feather.png`);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

    for (let i = 0; i < featherCount; i++) {
        const sprite = new THREE.Sprite(material.clone());
        sprite.position.copy(position);
        sprite.scale.set(0.4, 0.4, 0.4);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8 + 2,
            (Math.random() - 0.5) * 8
        );
        
        this.game.scene.add(sprite);
        this.game.particles.push({ mesh: sprite, velocity, life: 1.2 });
    }
  }

  createFloatingScore(position, points) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3bc117';
    
    // Draw Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 100px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`+${points}`, 128, 90);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.copy(position);
    sprite.position.y += 1.5;
    sprite.scale.set(4, 2, 1);
    
    this.game.scene.add(sprite);
    this.game.particles.push({ 
        mesh: sprite, 
        velocity: new THREE.Vector3(0, 3, 0), 
        life: 2.0 
    });
  }
}

class BowSystem3D {
  constructor(game) {
    this.game = game;
    this.bow = null;
    this.isDrawn = false;
    this.isScoped = false;
    this.isNocked = false;
    this.isTracking = false; 
    this.drawPower = 0;
    this.drawStartTime = 0;
    this.maxDrawTime = 2000;
    
    // Zoom System (Discrete Steps)
    this.zoomSteps = [2, 4, 6, 8];
    this.zoomIndex = 0; // Starts at 2x
    this.targetZoom = 1;
    this.currentZoom = 1;
    
    this.arrows = [];
    this.loadedArrow = null;
    
    // Default Crosshair (+) on Bow/Target Point
    this.defaultCrosshair = this.createDefaultCrosshair();
    this.game.camera.add(this.defaultCrosshair);
    this.defaultCrosshair.position.set(0, 0, -2); // Closer than scope
    this.defaultCrosshair.visible = true;

    // Scope Reticle
    this.scopeCrosshair = this.createScopeCrosshair();
    this.game.camera.add(this.scopeCrosshair); 
    this.scopeCrosshair.position.set(0, 0, -5); 
    this.scopeCrosshair.visible = false;

    this.initBow();
    this.setupInputs();
  }

  createDefaultCrosshair() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3bc117';
    ctx.lineWidth = 2;
    // Draw small (+)
    ctx.beginPath();
    ctx.moveTo(32, 22); ctx.lineTo(32, 42); 
    ctx.moveTo(22, 32); ctx.lineTo(42, 32); 
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, sizeAttenuation: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.015, 0.015, 1);
    return sprite;
  }

  createScopeCrosshair() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3bc117';
    ctx.lineWidth = 4;
    // Main Cross
    ctx.beginPath();
    ctx.moveTo(128, 20); ctx.lineTo(128, 236); 
    ctx.moveTo(20, 128); ctx.lineTo(236, 128); 
    ctx.stroke();
    // Circle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, sizeAttenuation: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.08, 0.08, 1);
    return sprite;
  }

  triggerHitMarker() {
      const originalColor = new THREE.Color(0xffffff);
      [this.scopeCrosshair, this.defaultCrosshair].forEach(c => {
          if (c) {
              c.material.color.setHex(0xff0000); 
              setTimeout(() => {
                  if (c) c.material.color.copy(originalColor);
              }, 150);
          }
      });
  }

  initBow() {
    this.bow = new THREE.Group();
    
    const riserGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.04);
    const riserMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7
    });
    const riser = new THREE.Mesh(riserGeometry, riserMaterial);
    this.bow.add(riser);
    
    const armMat = new THREE.MeshStandardMaterial({ color: 0xdbac98, roughness: 0.8 });
    const rightArmGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.0, 8);
    rightArmGeo.rotateX(Math.PI / 2);
    const rightArm = new THREE.Mesh(rightArmGeo, armMat);
    rightArm.position.set(0.1, -0.2, 0.4);
    this.bow.add(rightArm);

    const leftArmGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.0, 8);
    leftArmGeo.rotateX(Math.PI / 2);
    this.leftArm = new THREE.Mesh(leftArmGeo, armMat);
    this.leftArm.position.set(-0.4, -0.3, 0.6);
    this.bow.add(this.leftArm);

    const limbCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0, 0),
        new THREE.Vector3(-0.3, 0.1, 0),
        new THREE.Vector3(0, 0.15, 0),
        new THREE.Vector3(0.3, 0.1, 0),
        new THREE.Vector3(0.4, 0, 0)
    ]);
    const limbGeometry = new THREE.TubeGeometry(limbCurve, 20, 0.02, 8, false);
    const limbMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const limbs = new THREE.Mesh(limbGeometry, limbMaterial);
    limbs.position.y = 0.15;
    this.bow.add(limbs);
    
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    const stringPoints = [
        new THREE.Vector3(-0.35, 0.15, 0),
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(0.35, 0.15, 0)
    ];
    this.bowString = new THREE.Line(new THREE.BufferGeometry().setFromPoints(stringPoints), stringMaterial);
    this.bow.add(this.bowString);

    this.bow.position.set(0.3, -0.4, -0.6);
    this.game.camera.add(this.bow);
  }

  updateBowString(drawAmount = 0) {
    if (!this.bowString || !this.bowString.geometry) return;
    const positions = this.bowString.geometry.attributes.position.array;
    const pullDistance = drawAmount * 0.3;
    positions[3] = -pullDistance; 
    positions[4] = 0.1 - (pullDistance * 0.3); 
    this.bowString.geometry.attributes.position.needsUpdate = true;
  }

  setupInputs() {
    const element = this.game.container;
    
    this._onMouseDown = (e) => {
        if (e.target.closest('button')) return;
        this.handleMouseDown(e);
    };
    this._onMouseUp = (e) => this.handleMouseUp(e);
    this._onMouseMove = (e) => this.handleMouseMove(e);
    this._onWheel = (e) => {
        if (!this.isScoped) return;
        if (e.deltaY < 0) this.cycleZoom(1);
        else this.cycleZoom(-1);
    };

    element.addEventListener('mousedown', this._onMouseDown, { passive: false });
    element.addEventListener('mouseup', this._onMouseUp, { passive: false });
    element.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('mousemove', this._onMouseMove);

    // Touch Support
    this.lastTouch = new THREE.Vector2();
    this._onTouchStart = (e) => {
        if (e.target.closest('button')) return;
        const touch = e.touches[0];
        this.lastTouch.set(touch.clientX, touch.clientY);
        this.handleMouseDown(e);
    };
    this._onTouchEnd = (e) => this.handleMouseUp(e);
    this._onTouchMove = (e) => {
        if (this.isScoped && !this.isTracking) {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.lastTouch.x;
            const deltaY = touch.clientY - this.lastTouch.y;
            this.lastTouch.set(touch.clientX, touch.clientY);

            this.game.camera.rotation.y -= deltaX * 0.004;
            this.game.camera.rotation.x -= deltaY * 0.004;
            this.game.camera.rotation.x = Math.max(-1.4, Math.min(1.4, this.game.camera.rotation.x));
            this.game.camera.rotation.order = 'YXZ';
        }
    };

    element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    element.addEventListener('touchend', this._onTouchEnd, { passive: false });
    element.addEventListener('touchmove', this._onTouchMove, { passive: false });

    // Keyboard
    this.keys = {};
    this._onKeyDown = (e) => {
        this.keys[e.code] = true;
        if (e.repeat) return;
        if (e.code === 'KeyR') this.nock();
        if (e.code === 'Space') {
            e.preventDefault();
            if (!this.isScoped && !this.isDrawn && !this.isTracking) this.handleMouseDown(e);
            else if (this.isScoped) this.shoot();
        }
        if (e.code === 'Escape' && (this.isDrawn || this.isScoped)) this.cancel();
    };
    this._onKeyUp = (e) => {
        this.keys[e.code] = false;
        if (e.code === 'Space') {
            if (this.isDrawn && !this.isScoped) this.handleMouseUp(e);
        }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  cycleZoom(dir) {
      this.zoomIndex = THREE.MathUtils.clamp(this.zoomIndex + dir, 0, this.zoomSteps.length - 1);
      this.targetZoom = this.zoomSteps[this.zoomIndex];
  }

  setZoomIndex(idx) {
      this.zoomIndex = THREE.MathUtils.clamp(idx, 0, this.zoomSteps.length - 1);
      this.targetZoom = this.zoomSteps[this.zoomIndex];
  }

  applyZoom() {
      const multiplier = (this.isScoped || this.isTracking) ? this.currentZoom : 1;
      const targetFOV = 75 / multiplier;
      this.game.camera.fov = targetFOV;
      this.game.camera.updateProjectionMatrix();
      if (this.game.onZoomChange) this.game.onZoomChange(multiplier);
  }

  toggleScope() {
      if (this.isTracking) return;
      this.isScoped = !this.isScoped;
      
      if (this.isScoped) {
          this.game.audio.play('scope');
          this.game.haptics.trigger('scope_enter');
          this.scopeCrosshair.visible = true;
          this.defaultCrosshair.visible = false;
          this.targetZoom = this.zoomSteps[this.zoomIndex];
          if (this.game.onScopeEnter) this.game.onScopeEnter();
      } else {
          this.scopeCrosshair.visible = false;
          this.defaultCrosshair.visible = true;
          this.targetZoom = 1;
          this.currentZoom = 1;
          if (this.game.onScopeExit) this.game.onScopeExit();
      }
      this.applyZoom();
  }

  nock() {
      if (this.isNocked || this.isDrawn || this.game.gameData.ammo <= 0) return;
      this.isNocked = true;
      this.game.haptics.trigger('draw_start');
      
      this.loadedArrow = new Arrow(new THREE.Vector3(), new THREE.Vector3(0,0,1));
      this.loadedArrow.isActive = false; 
      this.bow.add(this.loadedArrow.mesh);
      this.loadedArrow.mesh.rotation.x = -Math.PI / 2;
      this.loadedArrow.mesh.position.set(0, 0.1, 0);
      
      if (this.game.onNock) this.game.onNock(true);
  }

  cancel() {
      if (this.isTracking) return;
      this.isDrawn = false;
      this.isScoped = false;
      this.isNocked = false;
      this.drawPower = 0;
      this.scopeCrosshair.visible = false;
      this.defaultCrosshair.visible = true;
      this.targetZoom = 1;
      this.currentZoom = 1;
      this.applyZoom();

      if (this.loadedArrow) {
          this.bow.remove(this.loadedArrow.mesh);
          this.loadedArrow = null;
      }
      this.updateBowString(0);
      
      if (this.game.onScopeExit) this.game.onScopeExit();
      if (this.game.onNock) this.game.onNock(false);
  }

  handleMouseDown(e) {
    if (this.isScoped || this.isTracking) return;
    if (!this.isNocked) {
        if (this.game.gameData.ammo <= 0) {
            this.game.onNoAmmo();
            return;
        }
        this.nock();
    }
    this.isDrawn = true;
    this.drawStartTime = Date.now();
    this.game.audio.play('draw');
    this.game.haptics.trigger('draw_tension');
  }

  handleMouseUp(e) {
    if (this.isDrawn && !this.isTracking) {
      this.isDrawn = false;
    }
  }

  handleMouseMove(e) {
      if (this.isScoped && !this.isTracking) {
         const movementX = e.movementX || 0;
         const movementY = e.movementY || 0;
         this.game.camera.rotation.y -= movementX * 0.002;
         this.game.camera.rotation.x -= movementY * 0.002;
         this.game.camera.rotation.x = Math.max(-1.4, Math.min(1.4, this.game.camera.rotation.x));
         this.game.camera.rotation.order = 'YXZ';
      }
  }

  update(deltaTime) {
      // Smooth Zoom Lerp
      if (Math.abs(this.currentZoom - this.targetZoom) > 0.01) {
          this.currentZoom = THREE.MathUtils.lerp(this.currentZoom, this.targetZoom, deltaTime * 8);
          this.applyZoom();
      }

      if (this.isDrawn) {
          const elapsed = Date.now() - this.drawStartTime;
          this.drawPower = Math.min(elapsed / this.maxDrawTime, 1);
          this.updateBowString(this.drawPower);
          if (this.leftArm) {
              this.leftArm.position.z = 0.6 + this.drawPower * 0.2;
              this.leftArm.position.x = -0.4 - this.drawPower * 0.1;
          }
          if (this.loadedArrow) {
              this.loadedArrow.mesh.position.z = -this.drawPower * 0.3;
          }
      }
  }

  shoot() {
      if (!this.isScoped || !this.isNocked || this.isTracking) return;
      if (this.game.gameData.ammo <= 0) {
          this.cancel();
          return;
      }
      this.game.gameData.ammo--;

      this.isNocked = false;
      this.isTracking = true; 
      if (this.game.onShotFired) this.game.onShotFired();

      this.game.haptics.trigger('shoot');
      this.game.audio.play('shoot');
      
      const direction = new THREE.Vector3();
      this.game.camera.getWorldDirection(direction);
      const spawnPos = new THREE.Vector3();
      this.game.camera.getWorldPosition(spawnPos);
      
      const flyingArrow = new Arrow(spawnPos, direction, this.drawPower);
      this.game.scene.add(flyingArrow.mesh);
      this.game.scene.add(flyingArrow.trail);

      const arrowBody = new CANNON.Body({
          mass: 0.2,
          position: new CANNON.Vec3(spawnPos.x, spawnPos.y, spawnPos.z),
          shape: new CANNON.Sphere(0.05),
          linearDamping: 0.01,
          allowSleep: false
      });

      const baseSpeed = 85; 
      const launchVelocity = direction.multiplyScalar(baseSpeed * this.drawPower);
      arrowBody.velocity.set(launchVelocity.x, launchVelocity.y, launchVelocity.z);
      
      arrowBody.addEventListener('collide', (event) => {
          if (flyingArrow.isActive) {
              flyingArrow.isActive = false;
              arrowBody.velocity.set(0, 0, 0);
              arrowBody.angularVelocity.set(0, 0, 0);
              arrowBody.mass = 0;
              arrowBody.updateMassProperties();
          }
      });

      this.game.world.addBody(arrowBody);
      flyingArrow.body = arrowBody;
      this.arrows.push(flyingArrow);
      this.game.activeTrackingArrow = flyingArrow; 
      
      if (this.game.onShoot) {
          this.game.onShoot({ power: this.drawPower });
      }

      if (this.loadedArrow) {
          this.bow.remove(this.loadedArrow.mesh);
          this.loadedArrow = null;
      }
      this.updateBowString(0);
      this.drawPower = 0;
  }

  finalizeShot() {
      this.isTracking = false;
      if (!this.isScoped) {
          this.scopeCrosshair.visible = false;
          this.defaultCrosshair.visible = true;
          this.targetZoom = 1;
          this.currentZoom = 1;
          this.applyZoom();
          if (this.game.onScopeExit) this.game.onScopeExit();
      }
      if (this.game.onNock) this.game.onNock(false);
  }

  destroy() {
      const element = this.game.container;
      element.removeEventListener('mousedown', this._onMouseDown);
      element.removeEventListener('mouseup', this._onMouseUp);
      element.removeEventListener('wheel', this._onWheel);
      element.removeEventListener('touchstart', this._onTouchStart);
      element.removeEventListener('touchend', this._onTouchEnd);
      element.removeEventListener('touchmove', this._onTouchMove);
      window.removeEventListener('mousemove', this._onMouseMove);
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
  }
}

class PhysiologicalSimulation {
  constructor(game) {
    this.game = game;
    this.hunterState = {
      heartRate: 60, // BPM
      breathingRate: 12, // Breaths per minute
      adrenaline: 0, // 0-100%
      stamina: 100 // 0-100%
    };
    this.time = 0;
  }
  
  update(deltaTime) {
    this.time += deltaTime;
    
    // Increase heart rate when drawing bow
    if (this.game.bowSystem.isDrawn) {
        this.hunterState.heartRate = Math.min(this.hunterState.heartRate + deltaTime * 20, 150);
    } else {
        this.hunterState.heartRate = Math.max(this.hunterState.heartRate - deltaTime * 10, 60);
    }

    // Apply breathing effect to camera
    if (this.game.bowSystem.isScoped) {
        const breathCycle = Math.sin(this.time * (this.hunterState.breathingRate / 60) * Math.PI * 2);
        const heartBeat = Math.sin(this.time * (this.hunterState.heartRate / 60) * Math.PI * 2) * (this.hunterState.heartRate / 2000);
        
        // Vertical sway from breathing
        this.game.camera.position.y = 1.7 + breathCycle * 0.02 + heartBeat * 0.01;
    } else {
        // Reset camera height slowly
        this.game.camera.position.y = THREE.MathUtils.lerp(this.game.camera.position.y, 1.7, deltaTime * 5);
    }
  }
}

class HuntingGame3D {
  constructor(container, gameData, onScore, onShoot, onNoAmmo) {
    this.container = container;
    this.gameData = gameData;
    this.onScore = onScore;
    this.onShoot = onShoot;
    this.onNoAmmo = onNoAmmo;
    this.activeArrows = [];
    this.particles = [];
    this.aimVector = new THREE.Vector2(0, 0); // For smooth joystick aiming
    
    this.initThree();
    this.initPhysics();
    this.initEnvironment();
    
    this.audio = new SoundSystem(this.camera);
    this.haptics = new HapticSystem();
    this.audio.load();

    this.bowSystem = new BowSystem3D(this);
    this.birdSystem = new BirdSystem3D(this, gameData.birds);
    this.physiology = new PhysiologicalSimulation(this);
    
    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    this.requestID = requestAnimationFrame(this.animate);
    
    // Handle resize
    this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
    });
    this.resizeObserver.observe(container);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01); // Add atmospheric depth
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.7, 0); // Correct Hunter Eye Level
    this.camera.rotation.order = 'YXZ';
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // More compatible filtering
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    this.scene.add(sun);
  }

  initPhysics() {
      this.world = new CANNON.World();
      this.world.gravity.set(0, -15.0, 0); 
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 10;
      this.world.defaultContactMaterial.friction = 0.5;
  }

  initEnvironment() {
      const textureLoader = new THREE.TextureLoader();
      const basename = window.location.hostname.includes('github.io') ? '/game' : '';
      
      // Determine theme based on gameData.level
      const level = this.gameData?.level || 1;
      const theme = ENVIRONMENT_THEMES[level] || ENVIRONMENT_THEMES[1];

      // Update Fog and Scene background
      this.scene.fog.color.setHex(theme.fog);
      
      // 360 Degree Looping Background (Skydome)
      const bgTex = textureLoader.load(`${basename}/assets/environment/${theme.sky}`, (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.repeat.set(5, 1); 
          tex.colorSpace = THREE.SRGBColorSpace;
      });
      const skyGeo = new THREE.SphereGeometry(800, 32, 32);
      const skyMat = new THREE.MeshBasicMaterial({ 
          map: bgTex, 
          side: THREE.BackSide,
          fog: false 
      });
      const skydome = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(skydome);

      // Ground
      const groundGeo = new THREE.PlaneGeometry(2000, 2000);
      const groundTex = textureLoader.load(`${basename}/assets/environment/${theme.ground}`, (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(200, 200);
          tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      });
      
      const groundMat = new THREE.MeshStandardMaterial({ 
          map: groundTex, 
          roughness: 0.8,
          metalness: 0.1,
          color: theme.groundColor 
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      this.scene.add(ground);
      
      // Physics ground
      const groundBody = new CANNON.Body({ mass: 0 });
      groundBody.addShape(new CANNON.Plane());
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.world.addBody(groundBody);

      // Trees (Simple Cylinders/Cones)
      for(let i=0; i<30; i++) {
          const x = (Math.random() - 0.5) * 200;
          const z = (Math.random() - 0.5) * 200 - 50;
          
          const trunk = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.8, 3),
              new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
          );
          trunk.position.set(x, 1.5, z);
          this.scene.add(trunk);
          
          const leaves = new THREE.Mesh(
              new THREE.ConeGeometry(3, 6),
              new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 })
          );
          leaves.position.set(x, 5, z);
          this.scene.add(leaves);
      }
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
      this.requestID = requestAnimationFrame(this.animate);
      
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Physics step
      this.world.step(1/60);
      
      // --- Centralized Aiming System (Smooth & Clamped) ---
      if (!this.bowSystem.isTracking) {
          const aimSpeed = 2.0 * deltaTime; 
          
          if (this.bowSystem.keys['KeyW'] || this.bowSystem.keys['ArrowUp']) this.camera.rotation.x += aimSpeed;
          if (this.bowSystem.keys['KeyS'] || this.bowSystem.keys['ArrowDown']) this.camera.rotation.x -= aimSpeed;
          if (this.bowSystem.keys['KeyA'] || this.bowSystem.keys['ArrowLeft']) this.camera.rotation.y += aimSpeed;
          if (this.bowSystem.keys['KeyD'] || this.bowSystem.keys['ArrowRight']) this.camera.rotation.y -= aimSpeed;

          if (this.aimVector.lengthSq() > 0.001) {
              this.camera.rotation.y -= this.aimVector.x * aimSpeed * 2.5;
              this.camera.rotation.x += this.aimVector.y * aimSpeed * 2.5;
          }

          this.camera.rotation.x = Math.max(-1.45, Math.min(1.45, this.camera.rotation.x));
          this.camera.rotation.order = 'YXZ';
      } else if (this.activeTrackingArrow) {
          // --- Arrow Tracking (Scoped View Extension) ---
          const arrowPos = this.activeTrackingArrow.mesh.position;
          
          // Smoothly look at the arrow as it flies
          const targetRotation = new THREE.Quaternion();
          const m = new THREE.Matrix4();
          m.lookAt(this.camera.position, arrowPos, new THREE.Vector3(0,1,0));
          targetRotation.setFromRotationMatrix(m);
          this.camera.quaternion.slerp(targetRotation, 0.1);

          // Once arrow hits, wait before returning
          if (!this.activeTrackingArrow.isActive) {
              if (!this.shotFinishTime) this.shotFinishTime = Date.now();
              if (Date.now() - this.shotFinishTime > 1500) {
                  this.bowSystem.finalizeShot();
                  this.activeTrackingArrow = null;
                  this.shotFinishTime = null;
              }
          }
      }

      // Update Systems
      this.bowSystem.update(deltaTime);
      this.birdSystem.updateFlock(deltaTime);
      this.physiology.update(deltaTime);

      // Report draw power to React
      if (this.onDrawUpdate) {
          this.onDrawUpdate(this.bowSystem.drawPower);
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.life -= deltaTime; 
          if (p.life <= 0) {
              this.scene.remove(p.mesh);
              this.particles.splice(i, 1);
              continue;
          }
          p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
          p.mesh.material.opacity = p.life;
      }
      
      // Update arrows and check collisions
      const arrows = this.bowSystem.arrows;
      for (let i = arrows.length - 1; i >= 0; i--) {
          const arrow = arrows[i];
          arrow.update(deltaTime);
          
          if (!arrow.isActive) {
              // Stay in world for 5 seconds then disappear
              if (!arrow.dyingTime) arrow.dyingTime = Date.now();
              if (Date.now() - arrow.dyingTime > 5000) {
                  this.scene.remove(arrow.mesh);
                  if (arrow.trail) this.scene.remove(arrow.trail);
                  this.world.removeBody(arrow.body);
                  arrows.splice(i, 1);
              }
              continue;
          }

          // Collision Check
          this.birdSystem.birds.forEach(bird => {
              if (bird.active && !bird.isDying) {
                  const dist = arrow.mesh.position.distanceTo(bird.mesh.position);
                  if (dist < bird.type.size + 0.5) {
                      // HIT!
                      bird.isDying = true;
                      bird.deathVelocity = arrow.body.velocity.clone().scale(0.1);
                      this.onScore(bird.type.points);
                      
                      this.haptics.trigger('hit');
                      this.audio.play('hit');
                      this.bowSystem.triggerHitMarker();
                      this.birdSystem.createFeatherExplosion(bird.mesh.position);
                      this.birdSystem.createFloatingScore(bird.mesh.position, bird.type.points);

                      if (this.game.onShoot) {
                          this.game.onShoot({ 
                              power: this.drawPower,
                              hit: true,
                              birdId: bird.serverId,
                              // Project 3D impact back to 0-100 for server
                              x: (bird.mesh.position.x + 50),
                              y: (bird.mesh.position.y - 10)
                          });
                      }

                      // Arrow sticks into bird
                      arrow.isActive = false;
                      this.world.removeBody(arrow.body);
                      bird.mesh.add(arrow.mesh);
                      arrow.mesh.position.set(0,0,0);
                  }
              }
          });
      }

      // Special death animation update for birds
      this.birdSystem.birds.forEach(bird => {
          if (bird.isDying) {
              bird.mesh.position.y -= deltaTime * 15; // Fall
              bird.mesh.rotation.x += deltaTime * 10; // Spin
              if (bird.mesh.position.y < -1) {
                  bird.active = false;
                  this.scene.remove(bird.mesh);
              }
          }
      });

      this.renderer.render(this.scene, this.camera);
  }

  dispose() {
      cancelAnimationFrame(this.requestID);
      this.resizeObserver.disconnect();
      this.bowSystem.destroy();
      this.renderer.dispose();
      this.container.innerHTML = '';
  }
}

const Joystick = ({ onMove }) => {
    const joystickRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleDrag = (event, info) => {
        const x = info.offset.x;
        const y = info.offset.y;
        setPosition({ x, y });
        onMove({ x: x / 50, y: -y / 50 });
    };

    return (
        <div className="relative w-32 h-32 bg-white/10 rounded-full border-2 border-white/20 backdrop-blur-md flex items-center justify-center">
            <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                onDrag={handleDrag}
                onDragEnd={() => { setPosition({ x: 0, y: 0 }); onMove({ x: 0, y: 0 }); }}
                className="w-12 h-12 bg-yellow-500 rounded-full shadow-2xl cursor-pointer"
                animate={position}
            />
        </div>
    );
};

// --- React Component ---

const BirdShooting = () => {
  const { socket } = useContext(AuthContext);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('lobby');
  const [matchData, setMatchData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [showScopeUI, setShowScopeUI] = useState(false);
  const [drawPower, setDrawPower] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [remainingAmmo, setRemainingAmmo] = useState(0);
  const [isNocked, setIsNocked] = useState(false);
  const [isScoped, setIsScoped] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [isTracking, setIsTracking] = useState(false);
  const [hitMessage, setHitMessage] = useState(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [buyingAmmo, setBuyingAmmo] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [error, setError] = useState(null);

  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const isFiringRef = useRef(false);
  const dispatch = useDispatch();
  const { user, wallet, inventory } = useSelector(state => state.user);

  const handleBuyAmmo = async (type) => {
      setBuyingAmmo(true);
      try {
          const res = await shopAPI.buyAmmo(type);
          dispatch(updateWallet(res.data.wallet));
          dispatch(updateInventory(res.data.inventory));
          setPurchaseSuccess(`Added ${type === 'arrow' ? '50x Arrows' : '100x Pellets'}!`);
          setTimeout(() => setPurchaseSuccess(null), 3000);
      } catch (err) {
          setError(err.response?.data?.error || "Failed to buy ammo");
      } finally {
          setBuyingAmmo(false);
      }
  };

  const handleScore = (points) => {
      setCurrentScore(prev => prev + points);
      setHitMessage("BIRD DOWN!");
      setTimeout(() => setHitMessage(null), 2000);
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleSession = (data) => {
        setMatchData(data);
        setRemainingAmmo(data.ammo);
        setGameState('playing');
        setSessionTime(0);
        setLoading(false);
    };

    const handleShotResult = (res) => {
        if (res.remainingAmmo !== undefined) {
            setRemainingAmmo(res.remainingAmmo);
        }
    };

    const handleGameOver = (data) => {
        setFinalResult(data);
        setGameState('ended');
        dispatch(updateWallet({ mainBalance: data.newBalance }));
    };

    const handleBalanceUpdate = (data) => {
        dispatch(updateWallet({ mainBalance: data.mainBalance }));
    };

    const handleError = (err) => {
        setError(err.message || 'An error occurred');
        setLoading(false);
    };

    socket.on('bird_shoot:session', handleSession);
    socket.on('bird_shoot:shot_result', handleShotResult);
    socket.on('bird_shoot:game_over', handleGameOver);
    socket.on('balance_update', handleBalanceUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('bird_shoot:session', handleSession);
      socket.off('bird_shoot:shot_result', handleShotResult);
      socket.off('bird_shoot:game_over', handleGameOver);
      socket.off('balance_update', handleBalanceUpdate);
      socket.off('error', handleError);
    };
  }, [socket, dispatch]);

  useEffect(() => {
      if (gameState === 'playing' && gameContainerRef.current && matchData) {
          gameInstanceRef.current = new HuntingGame3D(
            gameContainerRef.current, 
            matchData,
            handleScore,
            (shotData) => {
                if (socket && matchData) {
                    socket.emit('bird_shoot:shoot', {
                        gameId: matchData.id,
                        shotData: {
                            ...shotData,
                            // Send dummy coords for now to satisfy existing server logic
                            x: 50, y: 50 
                        }
                    });
                }
            },
            () => {
                setHitMessage("OUT OF AMMO!");
                setTimeout(() => setHitMessage(null), 2000);
            }
          );

          // Hook UI events
          gameInstanceRef.current.onScopeEnter = () => {
              setShowScopeUI(true);
              setIsScoped(true);
              setIsTracking(false);
          };
          gameInstanceRef.current.onScopeExit = () => {
              setShowScopeUI(false);
              setIsScoped(false);
              setIsTracking(false);
              setDrawPower(0);
          };
          gameInstanceRef.current.onShotFired = () => {
              setIsTracking(true);
              setIsScoped(true); 
          };
          gameInstanceRef.current.onDrawUpdate = (power) => setDrawPower(power);
          gameInstanceRef.current.onNock = (nocked) => setIsNocked(nocked);
          gameInstanceRef.current.onZoomChange = (z) => setZoomMultiplier(z);

          return () => {
              if (gameInstanceRef.current) {
                  gameInstanceRef.current.dispose();
              }
          };
      }
  }, [gameState]);

  useEffect(() => {
      let interval;
      if (gameState === 'playing') {
          interval = setInterval(() => {
              setSessionTime(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
        timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleEndGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleEndGame = () => {
      if (socket && matchData) {
          socket.emit('bird_shoot:end', { gameId: matchData.id });
      } else {
          setGameState('lobby');
      }
      if (gameInstanceRef.current) {
          gameInstanceRef.current.dispose();
          gameInstanceRef.current = null;
      }
  };

  const startNewMatch = () => {
      if (!socket) return;
      
      // Request Fullscreen for mobile immersion
      if (gameContainerRef.current?.requestFullscreen) {
          gameContainerRef.current.requestFullscreen().catch(err => {
              console.warn("Fullscreen request failed", err);
          });
      }

      setLoading(true);
      setTimeLeft(60);
      setCurrentScore(0);
      socket.emit('bird_shoot:join', { level: 1 });
  };

  const handleShoot = () => {
      if (gameInstanceRef.current && gameInstanceRef.current.bowSystem) {
          gameInstanceRef.current.isFiringClick = true;
          gameInstanceRef.current.bowSystem.shoot();
          setTimeout(() => {
              if (gameInstanceRef.current) gameInstanceRef.current.isFiringClick = false;
          }, 100);
      }
  };

  const handleCancel = () => {
      if (gameInstanceRef.current && gameInstanceRef.current.bowSystem) {
          gameInstanceRef.current.bowSystem.cancel();
      }
  };

  const handleLoad = () => {
      if (gameInstanceRef.current && gameInstanceRef.current.bowSystem) {
          gameInstanceRef.current.bowSystem.nock();
      }
  };

  const handleToggleScope = () => {
      if (gameInstanceRef.current?.bowSystem) {
          gameInstanceRef.current.bowSystem.toggleScope();
      }
  };

  const handleSetZoomIndex = (idx) => {
      if (gameInstanceRef.current?.bowSystem) {
          gameInstanceRef.current.bowSystem.setZoomIndex(idx);
      }
  };

  const handleJoystickMove = (delta) => {
      if (gameInstanceRef.current) {
          gameInstanceRef.current.aimVector.set(delta.x, delta.y);
      }
  };

  // Component Keyboard shortcuts
  useEffect(() => {
      const handleGlobalKeyDown = (e) => {
          if (gameState !== 'playing') return;
          if (e.code === 'Space') {
              // Logic is handled in class, but we can sync React state if needed
          }
          if (e.code === 'Escape') {
              handleCancel();
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-sans select-none relative overflow-hidden">
      <style>{`
        @media (max-width: 768px) {
          .game-hud { font-size: 0.8rem; }
          .zoom-bar { scale: 0.8; right: 1rem !important; }
          .action-buttons { bottom: 2rem !important; right: 1rem !important; }
          .scope-btn { width: 4rem !important; height: 4rem !important; }
        }
      `}</style>
      {/* Top Navigation Overlay */}
      {gameState !== 'playing' && (
        <div className="absolute top-6 left-0 right-0 flex justify-center z-[60]">
            <div className="flex bg-[#0f212e]/80 backdrop-blur-xl border border-gray-800 p-2 rounded-2xl gap-2 shadow-2xl">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-[#3bc117]/10 transition-all group">
                    <Home className="w-4 h-4 text-gray-400 group-hover:text-[#3bc117]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Home</span>
                </button>
                <button onClick={() => navigate('/store')} className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-[#3bc117]/10 transition-all group">
                    <ShoppingBag className="w-4 h-4 text-gray-400 group-hover:text-[#3bc117]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Armory</span>
                </button>
                <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-[#3bc117]/10 transition-all group">
                    <UserIcon className="w-4 h-4 text-gray-400 group-hover:text-[#3bc117]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Profile</span>
                </button>
            </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto pt-20">
        
        {/* Lobby State */}
        {gameState === 'lobby' && (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center space-y-8">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-[#3bc117]/10 rounded-full flex items-center justify-center mx-auto border border-[#3bc117]/50 shadow-[0_0_50px_rgba(59,193,23,0.3)]">
                        <Target className="w-12 h-12 text-[#3bc117]" />
                    </div>
                </div>

                <div>
                    <h1 className="text-6xl font-black italic tracking-tighter">GAMEX <span className="text-[#3bc117]">SNIPER 3D</span></h1>
                    <p className="text-gray-400 font-bold tracking-[0.3em] text-xs mt-2">Next-Gen Archery Simulation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                    {/* Detailed Wallet Display */}
                    <div className="bg-[#1a2c38] border border-gray-800 rounded-3xl p-6 text-left shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Coins className="w-6 h-6 text-[#3bc117]" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 font-sans">Elite Wallet</h3>
                            </div>
                            <Link to="/wallet" className="text-[10px] font-black text-[#3bc117] hover:underline uppercase tracking-wider">Deposit</Link>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-black/30 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter mb-1">Available Balance</p>
                                    <p className="text-2xl font-black text-white">{wallet.mainBalance.toFixed(2)} <span className="text-xs text-[#3bc117]">TRX</span></p>
                                </div>
                                <Trophy className="w-8 h-8 text-[#3bc117]/20" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Winnings</p>
                                    <p className="text-sm font-black text-[#3bc117]">{wallet.totalWon.toFixed(1)}</p>
                                </div>
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Spent</p>
                                    <p className="text-sm font-black text-red-500">{wallet.totalSpent.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arsenal & Refill */}
                    <div className="bg-[#1a2c38] border border-gray-800 rounded-3xl p-6 text-left shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-6 h-6 text-orange-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 font-sans">Current Ammo</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {['arrow', 'pellet'].map(type => {
                                const count = inventory.items?.find(i => i.itemKey === type)?.amount || 0;
                                return (
                                    <div key={type} className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-[#3bc117] animate-pulse' : 'bg-red-500'}`}></div>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase mb-1 font-sans">{type}s</p>
                                        <p className="text-2xl font-black text-white">{count}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleBuyAmmo('arrow')}
                                disabled={buyingAmmo || wallet.mainBalance < 5}
                                className="relative py-4 bg-[#3bc117]/10 hover:bg-[#3bc117]/20 border border-[#3bc117]/20 rounded-2xl transition-all group overflow-hidden"
                            >
                                <div className="relative z-10 text-center">
                                    <p className="text-[8px] font-black text-[#3bc117] uppercase mb-1 font-sans">Add 50x Arrows</p>
                                    <p className="text-xs font-black text-white">5 TRX</p>
                                </div>
                                <motion.div className="absolute inset-0 bg-[#3bc117]/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                            </button>
                            <button 
                                onClick={() => handleBuyAmmo('pellet')}
                                disabled={buyingAmmo || wallet.mainBalance < 5}
                                className="relative py-4 bg-[#3bc117]/10 hover:bg-[#3bc117]/20 border border-[#3bc117]/20 rounded-2xl transition-all group overflow-hidden"
                            >
                                <div className="relative z-10 text-center">
                                    <p className="text-[8px] font-black text-[#3bc117] uppercase mb-1 font-sans">Add 100x Pellets</p>
                                    <p className="text-xs font-black text-white">5 TRX</p>
                                </div>
                                <motion.div className="absolute inset-0 bg-[#3bc117]/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {purchaseSuccess && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex items-center justify-center gap-2 text-[#3bc117] font-black uppercase text-xs tracking-widest bg-[#3bc117]/10 p-4 rounded-2xl border border-[#3bc117]/30 shadow-[0_0_30px_rgba(59,193,23,0.2)] max-w-sm mx-auto"
                        >
                            <ShieldCheck className="w-5 h-5" /> {purchaseSuccess}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button 
                    onClick={startNewMatch}
                    disabled={loading}
                    className="bg-[#3bc117] hover:bg-[#32a814] text-black text-xl font-black py-6 px-16 rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(59,193,23,0.4)]"
                >
                    {loading ? 'INITIALIZING...' : 'ENTER HUNT'}
                </button>

                {error && (
                    <div className="flex items-center justify-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}
            </motion.div>
          </div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && (
          <div className="fixed inset-0 z-[100] bg-black">
            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-40 pointer-events-none">
                <div className="flex gap-4">
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Score</p>
                        <p className="text-4xl font-black text-[#3bc117]">{currentScore}</p>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Ammo</p>
                        <p className="text-4xl font-black text-white">{remainingAmmo}</p>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Zoom</p>
                        <p className="text-2xl font-black text-yellow-500">{zoomMultiplier}x</p>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Session</p>
                        <p className="text-2xl font-black text-white">
                            {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
                        </p>
                    </div>
                </div>

                                <div className="flex gap-2 pointer-events-auto">
                                    <button 
                                        onClick={() => handleEndGame()}
                                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-3 rounded-xl border border-red-500/30 backdrop-blur-md font-black text-xs"
                                    >
                                        EXTRACT
                                    </button>
                                </div>
                            </div>
                
                            {/* Vertical Zoom Bar (Right) - Discrete Steps */}
                            <AnimatePresence>
                                {isScoped && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30 zoom-bar"
                                    >
                                        <div className="bg-[#0f212e]/80 backdrop-blur-md border-2 border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl">
                                            {[8, 6, 4, 2].map((z, i) => (
                                                <button
                                                    key={z}
                                                    onClick={() => handleSetZoomIndex(3-i)}
                                                    className={`w-12 h-12 rounded-xl font-black transition-all ${Math.round(zoomMultiplier) === z ? 'bg-[#3bc117] text-black shadow-[0_0_20px_rgba(59,193,23,0.4)]' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                                                >
                                                    {z}x
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-center bg-black/60 p-2 rounded-xl">
                                            <p className="text-[8px] font-black text-white uppercase tracking-widest">Zoom</p>
                                            <p className="text-lg font-black text-yellow-500">{Math.round(zoomMultiplier)}x</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                
                            {/* Hit Confirmation Message */}
                ...
                            {/* Controls Overlay */}
                            <div className="absolute bottom-10 left-10 z-30 pointer-events-auto flex items-end gap-8 action-buttons">
                                {/* Virtual Joystick */}
                                <Joystick onMove={handleJoystickMove} />
                                
                                {/* Manual Scope Toggle */}
                                {!isTracking && (
                                    <button 
                                        onClick={handleToggleScope}
                                        className={`w-20 h-20 rounded-full border-4 shadow-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-all scope-btn ${isScoped ? 'bg-[#3bc117] border-[#3bc117]/50 text-black' : 'bg-gray-800 border-gray-700 text-white'}`}
                                    >
                                        {isScoped ? 'UNSCOPE' : 'SCOPE'}
                                    </button>
                                )}
                            </div>
            {/* Bottom Inventory Drawer */}
            <div className={`absolute bottom-0 left-0 right-0 z-50 transition-transform duration-500 ${isInventoryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
                <div className="max-w-4xl mx-auto">
                    {/* Toggle Handle */}
                    <button 
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className="w-32 h-10 bg-[#0f212e] border-t border-l border-r border-gray-800 rounded-t-2xl mx-auto flex items-center justify-center gap-2 group"
                    >
                        {isInventoryOpen ? <ChevronDown className="w-4 h-4 text-[#3bc117]" /> : <ChevronUp className="w-4 h-4 text-[#3bc117] animate-bounce" />}
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">Inventory</span>
                    </button>

                    {/* Inventory Content */}
                    <div className="bg-[#0f212e]/95 backdrop-blur-2xl border-t border-gray-800 p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] h-48 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* Ammo Items */}
                            {['arrow', 'pellet'].map(type => {
                                const amount = inventory.items?.find(i => i.itemKey === type)?.amount || 0;
                                return (
                                    <div key={type} className="bg-black/40 border border-gray-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                        <Zap className={`w-4 h-4 ${type === 'arrow' ? 'text-yellow-500' : 'text-orange-500'}`} />
                                        <p className="text-[8px] font-black text-gray-500 uppercase font-sans">{type}s</p>
                                        <p className="text-sm font-black text-white">{amount}</p>
                                    </div>
                                );
                            })}
                            {/* Spin Credits */}
                            {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'].map(tier => (
                                <div key={tier} className="bg-black/40 border border-gray-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                    <RotateCw className="w-4 h-4 text-yellow-500" />
                                    <p className="text-[8px] font-black text-gray-500 uppercase">{tier}</p>
                                    <p className="text-sm font-black text-white">{wallet.spinCredits?.[tier] || 0}</p>
                                </div>
                            ))}
                            {/* Balance */}
                            <div className="bg-black/40 border border-[#3bc117]/30 p-3 rounded-2xl flex flex-col items-center gap-1">
                                <Coins className="w-4 h-4 text-[#3bc117]" />
                                <p className="text-[8px] font-black text-gray-500 uppercase">Balance</p>
                                <p className="text-sm font-black text-[#3bc117]">{wallet.mainBalance.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scope UI Overlay */}
            <AnimatePresence>
            {showScopeUI && (
                <motion.div 
                    initial={{opacity: 0}} 
                    animate={{opacity: 1}} 
                    exit={{opacity: 0}}
                    className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                >
                     {/* Scope Crosshair */}
                    <div className="w-full h-full border-[50px] border-black/80 rounded-full absolute inset-0 mix-blend-multiply"></div>
                    <div className="w-[1px] h-screen bg-[#3bc117]/50 absolute"></div>
                    <div className="h-[1px] w-screen bg-[#3bc117]/50 absolute"></div>
                    
                    <div className="absolute bottom-10 right-10 flex gap-4 pointer-events-auto">
                        {/* Cancel Button */}
                        <button 
                            onMouseDown={(e) => { e.stopPropagation(); handleCancel(); }}
                            className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-600 shadow-xl active:scale-90 transition-transform flex items-center justify-center font-black text-[10px] text-gray-400"
                        >
                            CANCEL
                        </button>

                        {/* Shoot Button */}
                        <button 
                            onMouseDown={(e) => { e.stopPropagation(); handleShoot(); }}
                            className="w-24 h-24 bg-red-600 rounded-full border-4 border-red-400 shadow-[0_0_50px_rgba(255,0,0,0.5)] active:scale-90 transition-transform flex items-center justify-center font-black text-xs"
                        >
                            FIRE
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            
            {/* Game Container */}
            <div 
                ref={gameContainerRef} 
                className="w-screen h-screen bg-black overflow-hidden shadow-2xl relative cursor-crosshair touch-none"
            >
                {/* Instruction Overlay if needed */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-black pointer-events-none text-center uppercase tracking-widest bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
                    HOLD TO DRAW • RELEASE TO AIM • SPACE OR FIRE BUTTON TO SHOOT • ESC OR CANCEL BUTTON TO STOP
                </div>
            </div>
          </div>
        )}

        {/* Results State */}
        <AnimatePresence>
            {gameState === 'ended' && finalResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} className="bg-[#1a2c38] border-4 border-[#3bc117] p-12 rounded-[4rem] text-center max-w-lg w-full shadow-[0_0_150px_rgba(59,193,23,0.2)]">
                    <Trophy className="w-20 h-20 text-[#3bc117] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(59,193,23,0.5)]" />
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Extraction Complete</h2>
                    <div className="text-6xl font-black text-white mb-8">{finalResult.reward.toFixed(2)} <span className="text-[#3bc117] text-2xl">TRX</span></div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-black/20 p-6 rounded-3xl border border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Final Score</p>
                            <p className="text-2xl font-black text-white">{finalResult.score}</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-3xl border border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Arena Balance</p>
                            <p className="text-2xl font-black text-[#3bc117]">{finalResult.newBalance.toFixed(2)}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setGameState('lobby')}
                        className="w-full py-6 bg-[#3bc117] hover:bg-[#45d61d] text-black font-black rounded-2xl uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#3bc117]/20 active:scale-95"
                    >
                        Return to Briefing
                    </button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BirdShooting;