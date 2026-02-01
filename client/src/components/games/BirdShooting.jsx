import React, { useState, useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Trophy, Zap, Gamepad2, AlertCircle, ShieldCheck, Home, ShoppingBag, User as UserIcon, Coins, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { updateWallet, setUserData, updateInventory } from '../../redux/slices/userSlice';
import { shopAPI } from '../../services/api';

import Arrow from '../../entities/Arrow';

// --- Procedural Asset Generators (Canvas) ---

function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    
    return new THREE.CanvasTexture(canvas);
}

function createFlowerTexture(color = '#FFFF00') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    for(let i=0; i<5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const x = 32 + Math.cos(angle) * 15;
        const y = 32 + Math.sin(angle) * 15;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.fillStyle = '#443300';
    ctx.beginPath();
    ctx.arc(32, 32, 8, 0, Math.PI*2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

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
      sparrow: { speed: 1.5, size: 1.2, points: 10, asset: 'sparrow' },
      pigeon: { speed: 1.2, size: 1.4, points: 15, asset: 'pigeon' },
      crow: { speed: 2.0, size: 1.5, points: 25, asset: 'pigeon' },
      eagle: { speed: 3.0, size: 2.2, points: 50, asset: 'eagle' },
      phoenix: { speed: 4.5, size: 2.5, points: 150, asset: 'rare' }
    };
    
    this.textureLoader = new THREE.TextureLoader();
    this.initFromData(serverBirds);
  }

  initFromData(serverBirds) {
    if (!serverBirds) return;
    
    const basename = window.location.hostname.includes('github.io') ? window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '' : '';

    serverBirds.forEach((data) => {
      const config = this.birdConfigs[data.type] || this.birdConfigs.sparrow;
      
      const texturePath = `${basename}/assets/birds/${config.asset}/fly.png`;
      const texture = this.textureLoader.load(texturePath);
      
      // Use Mesh with PlaneGeometry instead of Sprite to allow Y-axis flipping
      const geometry = new THREE.PlaneGeometry(config.size, config.size);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Face flight direction (birds fly left-to-right by default speed > 0)
      if (config.speed < 0) mesh.rotation.y = Math.PI; 

      // Map server 0-100 coordinates to world -50 to 50
      mesh.position.set(
        (data.x - 50),
        data.y + 10,
        -40 - (Math.random() * 40)
      );
      
      const bird = {
        mesh: mesh,
        type: config,
        velocity: new THREE.Vector3(config.speed * 2, 0, 0),
        active: true,
        serverId: data.id,
        isDying: false
      };
      
      this.birds.push(bird);
      this.game.scene.add(bird.mesh);
    });
  }

  updateFlock(deltaTime) {
    const time = Date.now() * 0.001;
    this.birds.forEach((bird) => {
      if (!bird.active || bird.isDying) return;
      
      bird.mesh.position.x += bird.velocity.x * deltaTime;
      if (bird.mesh.position.x > 60) bird.mesh.position.x = -60;
      
      // Flapping Animation: Oscillate scale to simulate wing movement
      const flap = Math.sin(time * (10 + bird.type.speed * 2));
      bird.mesh.scale.y = 1.0 + flap * 0.2;
      
      // Subtle bobbing
      bird.mesh.position.y += Math.sin(time * 2) * 0.005;
      
      // Face movement direction
      bird.mesh.lookAt(bird.mesh.position.clone().add(bird.velocity));
      bird.mesh.rotateY(Math.PI / 2); // Correct orientation for PlaneGeometry
    });
  }

  createFeatherExplosion(position) {
    const featherCount = 12;
    const loader = new THREE.TextureLoader();
    const basename = window.location.hostname.includes('github.io') ? window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '' : '';
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
    this.isHeld = false; // NEW state for "Release to Hold"
    this.isScoped = false;
    this.isNocked = false;
    this.isTracking = false; 
    this.drawPower = 0;
    this.drawStartTime = 0;
    this.maxDrawTime = 2000;
    
    // Smooth Camera Properties
    this.rotationVelocity = new THREE.Vector2();
    this.lookSensitivity = 0.002;
    this.damping = 0.92; // Inertia factor
    
    // Zoom System (Discrete Steps)
    this.zoomSteps = [2, 4, 6, 8];
    this.zoomIndex = 0; // Starts at 2x
    this.targetZoom = 1;
    this.currentZoom = 1;
    
    this.arrows = [];
    this.loadedArrow = null;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isRightClickDown = false;

    // Scope Reticle (3D, only for scoped mode)
    this.scopeCrosshair = this.createScopeCrosshair();
    this.game.camera.add(this.scopeCrosshair); 
    this.scopeCrosshair.position.set(0, 0, -5); 
    this.scopeCrosshair.visible = false;

    this.initBow();
    this.setupInputs();
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
      if (this.scopeCrosshair) {
          this.scopeCrosshair.material.color.setHex(0xff0000); 
          setTimeout(() => {
              if (this.scopeCrosshair) this.scopeCrosshair.material.color.copy(originalColor);
          }, 150);
      }
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
    
    // Dynamic Deformation based on Draw
    const pullDistance = drawAmount * 0.35; 
    
    // Midpoint of the string gets pulled back (negative Z in local space relative to rest)
    // Local rest is around +0.1 Z. Pulling it back goes negative.
    positions[3] = 0; // X center
    positions[4] = 0.1 - (pullDistance * 0.5); // Y (Height adjustment if needed, usually minor)
    positions[5] = 0 - pullDistance; // Z (Pull back)

    this.bowString.geometry.attributes.position.needsUpdate = true;
  }

  setupInputs() {
    const element = this.game.container;
    
    // Desktop: Mouse Look & Click to Shoot
    this._onMouseDown = (e) => {
        if (e.target.closest('button')) return;
        // Desktop uses old logic for simplicity or can be matched to mobile
        if (e.button === 0) {
            if (this.isHeld) {
                this.shoot();
                this.isHeld = false;
            } else {
                this.handleMouseDown(e);
            }
        }
    };
    
    this._onMouseUp = (e) => {
        if (e.button === 0) {
            if (this.isDrawn && this.drawPower > 0.2) {
                this.isHeld = true;
            } else {
                this.handleMouseUp(e);
            }
        }
    };

    this._onMouseMove = (e) => {
        if (document.pointerLockElement === element) {
             const movementX = e.movementX || 0;
             const movementY = e.movementY || 0;
             this.rotationVelocity.x -= movementX * 0.0002;
             this.rotationVelocity.y -= movementY * 0.0002;
        }
    };
    
    element.addEventListener('mousedown', (e) => {
        if(e.button === 0) this._onMouseDown(e);
        if(e.button === 2) {
            if (document.pointerLockElement !== element) element.requestPointerLock();
        }
    });
    element.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('mousemove', this._onMouseMove);

    // --- Mobile Touch Controls (Split Screen) ---
    this.activeTouches = {}; 
    this.chargeStartY = 0;

    this._onTouchStart = (e) => {
        if (e.target.closest('button')) return;
        
        const width = element.clientWidth;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            if (touch.clientX < width / 2) {
                // LEFT SIDE: CHARGE OR FIRE
                this.activeTouches[touch.identifier] = 'charge';
                
                if (this.isHeld) {
                    this.shoot();
                    this.isHeld = false;
                    return;
                }

                this.chargeStartY = touch.clientY;
                
                // Start Charging
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

            } else {
                // RIGHT SIDE: AIM
                this.activeTouches[touch.identifier] = 'aim';
                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;
            }
        }
    };

    this._onTouchMove = (e) => {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const type = this.activeTouches[touch.identifier];

            if (type === 'charge' && !this.isHeld) {
                const deltaY = touch.clientY - this.chargeStartY;
                const power = Math.min(Math.max(deltaY / 200, 0), 1);
                
                this.drawPower = power;
                this.updateBowString(this.drawPower);
                
                if (this.leftArm) {
                    this.leftArm.position.z = 0.6 + this.drawPower * 0.2;
                    this.leftArm.position.x = -0.4 - this.drawPower * 0.1;
                }
                if (this.loadedArrow) {
                    this.loadedArrow.mesh.position.z = -this.drawPower * 0.3;
                }

            } else if (type === 'aim') {
                const deltaX = touch.clientX - this.lastTouchX;
                const deltaY = touch.clientY - this.lastTouchY;
                
                const sensitivity = this.isScoped ? 0.0005 : 0.0015;
                this.rotationVelocity.x -= deltaX * sensitivity;
                this.rotationVelocity.y -= deltaY * sensitivity;

                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;
            }
        }
    };

    this._onTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const type = this.activeTouches[touch.identifier];

            if (type === 'charge') {
                // RELEASE TO HOLD
                if (this.drawPower > 0.2) {
                    this.isHeld = true;
                } else {
                    this.cancel();
                    this.isDrawn = false;
                }
            }
            
            delete this.activeTouches[touch.identifier];
        }
    };

    element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    element.addEventListener('touchmove', this._onTouchMove, { passive: false });
    element.addEventListener('touchend', this._onTouchEnd, { passive: false });

    // Keyboard (Keep existing)
    this.keys = {};
    this._onKeyDown = (e) => {
        this.keys[e.code] = true;
        if (e.repeat) return;
        if (e.code === 'KeyR') this.nock();
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.isHeld) {
                this.shoot();
                this.isHeld = false;
            } else if (!this.isScoped && !this.isDrawn && !this.isTracking) {
                this.handleMouseDown(e);
            }
        }
        if (e.code === 'Escape') this.cancel();
    };
    this._onKeyUp = (e) => {
        this.keys[e.code] = false;
        if (e.code === 'Space') {
            if (this.isDrawn && this.drawPower > 0.2) {
                this.isHeld = true;
            } else if (this.isDrawn) {
                this.handleMouseUp(e);
            }
        }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // ... rest of the helpers ...
  
  raycastTarget() {
      this.raycaster.setFromCamera(this.mouse, this.game.camera);
      const birds = this.game.birdSystem.birds.map(b => b.mesh);
      const intersects = this.raycaster.intersectObjects(birds, true);
      if (intersects.length > 0) {
          let targetObj = intersects[0].object;
          while(targetObj.parent && !targetObj.serverId) {
              if (targetObj.parent.serverId) { targetObj = targetObj.parent; break; }
              targetObj = targetObj.parent;
          }
          const worldPos = new THREE.Vector3();
          targetObj.getWorldPosition(worldPos);
          this.game.camera.lookAt(worldPos);
          this.game.haptics.trigger('scope_enter');
      }
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
      const element = this.game.container;

      if (this.isScoped) {
          this.game.audio.play('scope');
          this.game.haptics.trigger('scope_enter');
          this.scopeCrosshair.visible = true;
          this.targetZoom = this.zoomSteps[this.zoomIndex];
          
          if (element.requestPointerLock) element.requestPointerLock();
          if (this.game.onScopeEnter) this.game.onScopeEnter();
      } else {
          this.scopeCrosshair.visible = false;
          this.targetZoom = 1;
          this.currentZoom = 1;
          if (document.pointerLockElement === element) document.exitPointerLock();
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
      this.isHeld = false;
      this.isScoped = false;
      this.isNocked = false;
      this.drawPower = 0;
      this.scopeCrosshair.visible = false;
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
    if (this.isTracking) return;
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
      // Logic handled in update or event listeners for mobile hold
    }
  }

  update(deltaTime) {
      // 1. Apply Smooth Camera Velocity
      this.game.camera.rotation.y += this.rotationVelocity.x;
      this.game.camera.rotation.x += this.rotationVelocity.y;
      
      this.rotationVelocity.multiplyScalar(this.damping);

      this.game.camera.rotation.x = Math.max(-1.396, Math.min(1.396, this.game.camera.rotation.x));
      this.game.camera.rotation.order = 'YXZ';

      // 2. Smooth Zoom
      if (Math.abs(this.currentZoom - this.targetZoom) > 0.01) {
          this.currentZoom = THREE.MathUtils.lerp(this.currentZoom, this.targetZoom, deltaTime * 8);
          this.applyZoom();
      }

      // 3. Draw Animation (Mouse only fallback)
      if (this.isDrawn && Object.keys(this.activeTouches).length === 0 && !this.isHeld) {
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
      if (!this.isNocked || this.isTracking) return;
      if (this.game.gameData.ammo <= 0) {
          this.cancel();
          return;
      }
      this.game.gameData.ammo--;

      this.isNocked = false;
      this.isTracking = true; 
      this.isDrawn = false;
      this.isHeld = false;
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
      
      arrowBody.angularVelocity.set(0, 0, 10); 

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
      const wasScoped = this.isScoped;
      this.isTracking = false;
      
      // Force exit scope and reset zoom/FOV after shot finishes
      if (wasScoped) {
          this.toggleScope(); 
      } else {
          this.scopeCrosshair.visible = false;
          this.targetZoom = 1;
          this.currentZoom = 1;
          this.applyZoom();
          if (this.game.onScopeExit) this.game.onScopeExit();
      }
      
      // Reset Camera Position and FOV
      this.game.camera.position.set(0, 1.7, 0);
      this.game.camera.fov = 75;
      this.game.camera.updateProjectionMatrix();
      
      // Smoothly reset camera pitch to eye level
      this.game.camera.rotation.x = 0;
      
      if (this.game.onNock) this.game.onNock(false);
  }

  destroy() {
      const element = this.game.container;
      element.removeEventListener('mousedown', this._onMouseDown);
      element.removeEventListener('mouseup', this._onMouseUp);
      element.removeEventListener('touchstart', this._onTouchStart);
      element.removeEventListener('touchend', this._onTouchEnd);
      element.removeEventListener('touchmove', this._onTouchMove);
      document.removeEventListener('mousemove', this._onMouseMove);
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
    this.isMobile = window.innerWidth < 768; // Detect Mobile
    
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
    
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;
    
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (!this.isMobile) {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    if (!this.isMobile) {
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
    }
    this.scene.add(sun);
  }

  initPhysics() {
      this.world = new CANNON.World();
      this.world.gravity.set(0, -15.0, 0); 
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = this.isMobile ? 5 : 10;
      this.world.defaultContactMaterial.friction = 0.5;
  }

  initEnvironment() {
      this.initSky();
      this.initGround();
      this.initVegetation();
      this.initClouds();
      this.initLighting();
  }

  initSky() {
      this.sky = new Sky();
      this.sky.scale.setScalar(450000);
      this.scene.add(this.sky);

      this.sun = new THREE.Vector3();

      // Dynamic Level-based Themes
      const level = this.gameData?.level || 1;
      const themeConfigs = {
          1: { turbidity: 10, rayleigh: 3, mieCoefficient: 0.005, mieDirectionalG: 0.7, elevation: 20, azimuth: 180, fog: 0x87CEEB }, // Day
          2: { turbidity: 20, rayleigh: 4, mieCoefficient: 0.01, mieDirectionalG: 0.8, elevation: 5, azimuth: 190, fog: 0xffa500 }, // Sunset
          3: { turbidity: 0.5, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.9, elevation: -2, azimuth: 180, fog: 0x0f212e }, // Night
          4: { turbidity: 5, rayleigh: 10, mieCoefficient: 0.002, mieDirectionalG: 0.5, elevation: 45, azimuth: 180, fog: 0x6a1b9a }  // Mystic
      };
      const config = themeConfigs[level] || themeConfigs[1];

      const uniforms = this.sky.material.uniforms;
      uniforms['turbidity'].value = config.turbidity;
      uniforms['rayleigh'].value = config.rayleigh;
      uniforms['mieCoefficient'].value = config.mieCoefficient;
      uniforms['mieDirectionalG'].value = config.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - config.elevation);
      const theta = THREE.MathUtils.degToRad(config.azimuth);

      this.sun.setFromSphericalCoords(1, phi, theta);
      uniforms['sunPosition'].value.copy(this.sun);
      
      this.scene.fog.color.setHex(config.fog);
  }

  initGround() {
      const level = this.gameData?.level || 1;
      const groundColors = {
          1: 0x2b4a1b, // Green
          2: 0x5d4037, // Brown
          3: 0x1a2c38, // Deep Blue
          4: 0x4a148c  // Purple
      };
      const groundMat = new THREE.MeshStandardMaterial({ 
          color: groundColors[level] || groundColors[1], 
          roughness: 0.9,
          metalness: 0.1
      });
      const groundGeo = new THREE.PlaneGeometry(2000, 2000);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = !this.isMobile;
      this.scene.add(ground);
      
      const groundBody = new CANNON.Body({ mass: 0 });
      groundBody.addShape(new CANNON.Plane());
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.world.addBody(groundBody);
  }

  initVegetation() {
      const instanceCount = this.isMobile ? 1500 : 5000;
      
      const bladeGeo = new THREE.PlaneGeometry(0.5, 1);
      bladeGeo.translate(0, 0.5, 0); 
      const bladeMat = new THREE.MeshStandardMaterial({
          color: 0x4caf50,
          side: THREE.DoubleSide,
          transparent: true
      });
      this.grassMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, instanceCount);
      
      const flowerTex = createFlowerTexture('#ffeb3b');
      const flowerGeo = new THREE.PlaneGeometry(0.5, 0.5);
      flowerGeo.translate(0, 0.4, 0);
      const flowerMat = new THREE.MeshBasicMaterial({
          map: flowerTex,
          transparent: true,
          side: THREE.DoubleSide,
          alphaTest: 0.5
      });
      this.flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, Math.floor(instanceCount / 5));

      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < instanceCount; i++) {
          const r = 20 + Math.random() * 80; 
          const theta = Math.random() * Math.PI * 2;
          dummy.position.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.scale.setScalar(0.8 + Math.random() * 0.5);
          dummy.updateMatrix();
          this.grassMesh.setMatrixAt(i, dummy.matrix);
      }
      
      for (let i = 0; i < Math.floor(instanceCount / 5); i++) {
          const r = 25 + Math.random() * 70;
          const theta = Math.random() * Math.PI * 2;
          dummy.position.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
          dummy.rotation.set(0, Math.random() * Math.PI, 0);
          dummy.scale.setScalar(0.6 + Math.random() * 0.4);
          dummy.updateMatrix();
          this.flowerMesh.setMatrixAt(i, dummy.matrix);
      }

      this.scene.add(this.grassMesh);
      this.scene.add(this.flowerMesh);
  }

  initClouds() {
      this.clouds = [];
      const cloudTex = createCloudTexture();
      const cloudMat = new THREE.SpriteMaterial({ 
          map: cloudTex, 
          transparent: true, 
          opacity: 0.7,
          color: 0xffffff
      });

      const cloudCount = this.isMobile ? 10 : 20;
      for (let i = 0; i < cloudCount; i++) {
          const cloud = new THREE.Sprite(cloudMat.clone());
          cloud.scale.set(100, 60, 1);
          cloud.position.set(
              (Math.random() - 0.5) * 800,
              100 + Math.random() * 50,
              (Math.random() - 0.5) * 800
          );
          this.scene.add(cloud);
          this.clouds.push({
              mesh: cloud,
              speed: 0.5 + Math.random() * 1.5
          });
      }
  }

  initLighting() {
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
      hemiLight.position.set(0, 20, 0);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      if (this.sun) {
          dirLight.position.copy(this.sun).multiplyScalar(100);
      } else {
          dirLight.position.set(50, 100, 50);
      }
      
      if (!this.isMobile) {
          dirLight.castShadow = true;
          dirLight.shadow.mapSize.width = 1024;
          dirLight.shadow.mapSize.height = 1024;
      }
      this.scene.add(dirLight);
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

      this.world.step(1/60);
      
      if (this.clouds) {
          this.clouds.forEach(c => {
              c.mesh.position.x += c.speed * deltaTime;
              if (c.mesh.position.x > 400) c.mesh.position.x = -400;
          });
      }

      if (!this.bowSystem.isTracking) {
          const aimSpeed = 2.0 * deltaTime; 
          if (this.bowSystem.keys['KeyW'] || this.bowSystem.keys['ArrowUp']) this.camera.rotation.x += aimSpeed;
          if (this.bowSystem.keys['KeyS'] || this.bowSystem.keys['ArrowDown']) this.camera.rotation.x -= aimSpeed;
          if (this.bowSystem.keys['KeyA'] || this.bowSystem.keys['ArrowLeft']) this.camera.rotation.y += aimSpeed;
          if (this.bowSystem.keys['KeyD'] || this.bowSystem.keys['ArrowRight']) this.camera.rotation.y -= aimSpeed;

          this.camera.rotation.x = Math.max(-1.45, Math.min(1.45, this.camera.rotation.x));
          this.camera.rotation.order = 'YXZ';
      } else if (this.activeTrackingArrow) {
          const arrow = this.activeTrackingArrow;
          const arrowPos = arrow.mesh.position;
          
          if (arrow.isActive) {
              // --- Cinematic Follow Cam ---
              // Calculate target position behind the arrow
              const direction = new THREE.Vector3(0, 0, 1);
              direction.applyQuaternion(arrow.mesh.quaternion);
              
              const followOffset = direction.clone().multiplyScalar(-6); // Slightly further back
              followOffset.y += 1.5; // Slightly higher
              
              const targetPos = arrowPos.clone().add(followOffset);
              
              // Exponential Lerp for ultra-smooth tracking
              this.camera.position.lerp(targetPos, 0.1);
              this.camera.lookAt(arrowPos);
              
              // Dynamic FOV Tightening
              this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 30, 0.05);
              this.camera.updateProjectionMatrix();
          } else {
              // --- Impact Detection & View ---
              this.camera.lookAt(arrowPos);
              
              if (!this.shotFinishTime) this.shotFinishTime = Date.now();
              if (Date.now() - this.shotFinishTime > 2500) { // 2.5s impact pause
                  this.bowSystem.finalizeShot();
                  this.activeTrackingArrow = null;
                  this.shotFinishTime = null;
              }
          }
      }

      this.bowSystem.update(deltaTime);
      this.birdSystem.updateFlock(deltaTime);
      this.physiology.update(deltaTime);

      if (this.onDrawUpdate) {
          this.onDrawUpdate(this.bowSystem.drawPower);
      }

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
          
          if (!arrow.isActive || arrow.isSkipped) {
              if (!arrow.dyingTime) arrow.dyingTime = Date.now();
              if (Date.now() - arrow.dyingTime > 5000) {
                  this.scene.remove(arrow.mesh);
                  if (arrow.trail) this.scene.remove(arrow.trail);
                  this.world.removeBody(arrow.body);
                  arrows.splice(i, 1);
              }
              continue;
          }

          this.birdSystem.birds.forEach(bird => {
              if (bird.active && !bird.isDying) {
                  const dist = arrow.mesh.position.distanceTo(bird.mesh.position);
                  if (dist < bird.type.size + 0.5) {
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
                              x: (bird.mesh.position.x + 50),
                              y: (bird.mesh.position.y - 10)
                          });
                      }

                      arrow.isActive = false;
                      this.world.removeBody(arrow.body);
                      bird.mesh.add(arrow.mesh);
                      arrow.mesh.position.set(0,0,0);
                  }
              }
          });
      }

      this.birdSystem.birds.forEach(bird => {
          if (bird.isDying) {
              bird.mesh.position.y -= deltaTime * 15; 
              bird.mesh.rotation.x += deltaTime * 10; 
              if (bird.mesh.position.y < -1) {
                  bird.active = false;
                  this.scene.remove(bird.mesh);
              }
          }
      });

      this.renderer.render(this.scene, this.camera);
  }

  skipShot() {
      if (this.activeTrackingArrow) {
          // Mark as skipped so it doesn't trigger hits/points
          this.activeTrackingArrow.isSkipped = true;
          
          // Detach camera tracking and reset camera
          this.activeTrackingArrow = null;
          this.shotFinishTime = null;
          this.bowSystem.finalizeShot();
      }
  }

  dispose() {
      cancelAnimationFrame(this.requestID);
      this.resizeObserver.disconnect();
      this.bowSystem.destroy();
      this.renderer.dispose();
      this.container.innerHTML = '';
  }
}

// --- React Component ---

const BirdShooting = () => {
  const { socket } = useContext(AuthContext);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('lobby');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLandscape, setIsLandscape] = useState(true);
  
  // Orientation Check
  useEffect(() => {
      const checkOrientation = () => {
          setIsLandscape(window.innerWidth > window.innerHeight);
      };
      window.addEventListener('resize', checkOrientation);
      checkOrientation();
      return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const [matchData, setMatchData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showScopeUI, setShowScopeUI] = useState(false);
  const [drawPower, setDrawPower] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionCharged, setSessionCharged] = useState(0); 
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
        setSessionCharged(data.sessionCharged || 0.1); 
        setGameState('playing');
        setSessionTime(0);
        setLoading(false);
    };

    const handleShotResult = (res) => {
        if (res.remainingAmmo !== undefined) {
            setRemainingAmmo(res.remainingAmmo);
        }
        if (res.score !== undefined) {
            setCurrentScore(res.score);
        }
    };

    const handleGameOver = (data) => {
        setFinalResult(data);
        setGameState('ended');
        dispatch(updateWallet({ mainBalance: data.newBalance }));
    };

    const handleBalanceUpdate = (data) => {
        dispatch(updateWallet({ mainBalance: data.mainBalance }));
        if (data.sessionCharged !== undefined) {
            setSessionCharged(data.sessionCharged);
        }
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
                            birdId: shotData.birdId, // Explicitly pass the ID
                            // Keep dummy coords for fallback/debug
                            x: shotData.x || 50, 
                            y: shotData.y || 50 
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
      setCurrentScore(0);
      socket.emit('bird_shoot:join', { level: selectedLevel });
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

  const handleSkip = () => {
      if (gameInstanceRef.current) {
          gameInstanceRef.current.skipShot();
          setIsTracking(false);
          setIsScoped(false);
          setShowScopeUI(false);
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
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-sans select-none relative">
      <style>{`
        @media (max-width: 768px) {
          .game-hud { font-size: 0.7rem; gap: 0.5rem !important; padding: 0.5rem !important; }
          .hud-item { padding: 0.5rem !important; border-radius: 1rem !important; min-width: 60px; }
          .hud-value { font-size: 1.25rem !important; line-height: 1 !important; }
          .hud-label { font-size: 7px !important; }
          .zoom-bar { scale: 0.75; right: 0.5rem !important; }
          .action-buttons { bottom: 1.5rem !important; left: 1rem !important; gap: 1rem !important; }
          .scope-btn { width: 3.5rem !important; height: 3.5rem !important; font-size: 8px !important; }
          .joystick-container { scale: 0.8; transform-origin: bottom left; }
          .extract-btn { padding: 0.5rem 1rem !important; font-size: 8px !important; }
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
          <div className="flex flex-col items-center justify-center py-6 md:py-12">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center space-y-8">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-[#3bc117]/10 rounded-full flex items-center justify-center mx-auto border border-[#3bc117]/50 shadow-[0_0_50px_rgba(59,193,23,0.3)]">
                        <Target className="w-12 h-12 text-[#3bc117]" />
                    </div>
                </div>

                <div>
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">GameX <span className="text-[#3bc117]">Sniper 3D</span></h1>
                    <p className="text-gray-400 font-bold tracking-[0.3em] text-[10px] md:text-xs mt-2 uppercase">Elite Archery Arena</p>
                </div>

                {/* Level Selection */}
                <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Arena Scene</p>
                    <div className="flex gap-2 p-2 bg-[#1a2c38] rounded-2xl border border-gray-800">
                        {[1, 2, 3, 4].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setSelectedLevel(lvl)}
                                className={`w-12 h-12 rounded-xl font-black transition-all ${selectedLevel === lvl ? 'bg-[#3bc117] text-black shadow-[0_0_20px_rgba(59,193,23,0.4)] scale-110' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                    <p className="text-[8px] font-black text-[#3bc117] uppercase italic">
                        {selectedLevel === 1 && "Meadow Fields"}
                        {selectedLevel === 2 && "Foggy Hills"}
                        {selectedLevel === 3 && "Midnight Hunt"}
                        {selectedLevel === 4 && "Rainbow Valley"}
                    </p>
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
                    className="bg-[#3bc117] hover:bg-[#32a814] text-black text-lg md:text-xl font-black py-4 px-10 md:py-6 md:px-16 rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(59,193,23,0.4)]"
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
            <div className="absolute top-4 left-2 right-2 flex justify-between items-start z-40 pointer-events-none game-hud">
                <div className="flex gap-1.5 md:gap-4">
                    <div className="bg-black/60 backdrop-blur-xl p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 hud-item shadow-2xl flex flex-col items-center justify-center">
                        <p className="text-[6px] md:text-[9px] text-gray-400 font-black uppercase hud-label tracking-tighter">Points</p>
                        <p className="text-sm md:text-4xl font-black text-[#3bc117] hud-value leading-none">{currentScore}</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 hud-item shadow-2xl flex flex-col items-center justify-center">
                        <p className="text-[6px] md:text-[9px] text-gray-400 font-black uppercase hud-label tracking-tighter">Arrows</p>
                        <p className="text-sm md:text-4xl font-black text-white hud-value leading-none">{remainingAmmo}</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 hud-item shadow-2xl flex flex-col items-center justify-center">
                        <p className="text-[6px] md:text-[9px] text-orange-500 font-black uppercase hud-label tracking-tighter">Balance</p>
                        <p className="text-xs md:text-2xl font-black text-white hud-value leading-none">{sessionCharged.toFixed(1)}</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 hud-item shadow-2xl flex flex-col items-center justify-center">
                        <p className="text-[6px] md:text-[9px] text-yellow-500 font-black uppercase hud-label tracking-tighter">Zoom</p>
                        <p className="text-xs md:text-2xl font-black text-white hud-value leading-none">{Math.round(zoomMultiplier)}x</p>
                    </div>
                </div>

                <div className="flex gap-2 pointer-events-auto items-center">
                    {isTracking && (
                        <button 
                            onClick={handleSkip}
                            className="bg-[#3bc117] text-black px-4 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-[8px] md:text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,193,23,0.4)] hover:scale-105 active:scale-95 transition-all"
                        >
                            Skip
                        </button>
                    )}
                    <button 
                        onClick={() => handleEndGame()}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-3 py-1.5 md:p-3 rounded-lg md:rounded-xl border border-red-500/30 backdrop-blur-md font-black text-[8px] md:text-xs uppercase tracking-widest shadow-lg extract-btn"
                    >
                        Extract
                    </button>
                </div>
            </div>

            {/* Pro 2D Crosshair (Always Visible when not Scoped) */}
            {!isScoped && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 scale-75 md:scale-100">
                    <div className="relative flex items-center justify-center">
                         {/* Circle */}
                         <div className="w-10 h-10 border border-black/30 rounded-full"></div>
                         {/* Cross lines */}
                         <div className="w-[1px] h-6 bg-black absolute opacity-80"></div>
                         <div className="w-6 h-[1px] bg-black absolute opacity-80"></div>
                         {/* Center Dot */}
                         <div className="w-1 h-1 bg-black rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]"></div>
                    </div>
                </div>
            )}

            {/* Vertical Zoom Bar (Far Right) */}
            <AnimatePresence>
                {isScoped && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30 zoom-bar"
                    >
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-xl flex flex-col gap-2 shadow-2xl">
                            {[8, 6, 4, 2].map((z, i) => (
                                <button
                                    key={z}
                                    onClick={() => handleSetZoomIndex(3-i)}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg font-black transition-all ${Math.round(zoomMultiplier) === z ? 'bg-[#3bc117] text-black' : 'bg-black/60 text-gray-400 hover:text-white'}`}
                                >
                                    {z}x
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hit Confirmation Message */}
            <AnimatePresence>
                {hitMessage && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-[#3bc117] text-black px-8 py-3 rounded-full font-black italic text-xl shadow-[0_0_50px_rgba(59,193,23,0.5)] uppercase tracking-tighter">
                            {hitMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vertical Charge Meter (Left) */}
            <AnimatePresence>
                {drawPower > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30"
                    >
                        <div className="h-60 md:h-80 w-4 md:w-6 bg-black/60 rounded-full border border-white/20 p-1 relative overflow-hidden backdrop-blur-md shadow-2xl">
                            <motion.div 
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-600 via-yellow-500 to-green-400 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                style={{ height: `${drawPower * 100}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                            {drawPower > 0.95 && (
                                <motion.div 
                                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                    className="absolute inset-0 bg-white"
                                />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">Tension</p>
                            <p className={`text-xl md:text-2xl font-black italic tracking-tighter ${drawPower > 0.9 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {Math.round(drawPower * 100)}%
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Overlay (Bottom Right) */}
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[60] pointer-events-auto flex items-center gap-4 action-buttons">
                {/* Inventory Toggle (Symbol Only) */}
                <button 
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl hover:bg-white/10 transition-all active:scale-90"
                >
                    <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-[#3bc117]" />
                </button>

                {/* Scope Toggle (Transparent Styled) */}
                {!isTracking && (
                    <button 
                        onClick={handleToggleScope}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-2 backdrop-blur-sm shadow-2xl flex items-center justify-center font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all scope-btn ${isScoped ? 'bg-[#3bc117]/20 border-[#3bc117] text-[#3bc117]' : 'bg-white/5 border-white/20 text-white'}`}
                    >
                        {isScoped ? 'Unscope' : 'Scope'}
                    </button>
                )}
            </div>

            {/* Inventory Drawer */}
            <AnimatePresence>
                {isInventoryOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-24 right-6 md:bottom-32 md:right-10 z-[70] w-72 md:w-96"
                    >
                        <div className="bg-[#0f212e]/95 backdrop-blur-2xl border border-gray-800 rounded-3xl p-6 shadow-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                {['arrow', 'pellet'].map(type => {
                                    const amount = inventory.items?.find(i => i.itemKey === type)?.amount || 0;
                                    return (
                                        <div key={type} className="bg-black/40 border border-gray-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                            <Zap className={`w-4 h-4 ${type === 'arrow' ? 'text-yellow-500' : 'text-orange-500'}`} />
                                            <p className="text-[8px] font-black text-gray-500 uppercase">{type}s</p>
                                            <p className="text-sm font-black text-white">{amount}</p>
                                        </div>
                                    );
                                })}
                                <div className="bg-black/40 border border-[#3bc117]/30 p-3 rounded-2xl flex flex-col items-center gap-1 col-span-2">
                                    <Coins className="w-4 h-4 text-[#3bc117]" />
                                    <p className="text-[8px] font-black text-gray-500 uppercase">Balance</p>
                                    <p className="text-sm font-black text-[#3bc117]">{wallet.mainBalance.toFixed(2)} TRX</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scope UI Overlay (ENHANCED) */}
            <AnimatePresence>
            {showScopeUI && (
                <motion.div 
                    initial={{opacity: 0}} 
                    animate={{opacity: 1}} 
                    exit={{opacity: 0}}
                    className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                >
                     {/* Scope Crosshair Mask */}
                    <div className="w-full h-full border-[15vw] md:border-[10vw] border-black/90 rounded-full absolute inset-0 mix-blend-multiply"></div>
                    
                    {/* Pro Scoped Reticle (2D) */}
                    <div className="relative flex items-center justify-center pointer-events-none">
                        {/* Outer Ring */}
                        <div className="w-[60vh] h-[60vh] border border-[#3bc117]/20 rounded-full"></div>
                        {/* Middle Ring */}
                        <div className="absolute w-[30vh] h-[30vh] border border-[#3bc117]/40 rounded-full"></div>
                        {/* Main Cross */}
                        <div className="absolute w-[80vh] h-[1px] bg-[#3bc117]/30"></div>
                        <div className="absolute h-[80vh] w-[1px] bg-[#3bc117]/30"></div>
                        {/* Center Dot */}
                        <div className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
                    </div>

                    {/* Exit Button Only in Scoped UI */}
                    <div className="absolute bottom-6 right-20 md:bottom-10 md:right-32 z-[80] pointer-events-auto">
                        <button 
                            onClick={handleToggleScope}
                            className="w-14 h-14 md:w-20 md:h-20 bg-red-500/20 backdrop-blur-md border-2 border-red-500/50 rounded-full flex items-center justify-center font-black text-[8px] md:text-[10px] text-red-500 active:scale-90 transition-all shadow-2xl"
                        >
                            EXIT
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            
            {/* Optimized Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-[#0d1117] flex flex-col items-center justify-center"
                    >
                        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                            <motion.div 
                                className="h-full bg-[#3bc117]"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                        </div>
                        <p className="text-[#3bc117] font-black text-[10px] tracking-[0.3em] animate-pulse">OPTIMIZING ASSETS...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Container */}
            <div 
                ref={gameContainerRef} 
                className="w-screen h-screen bg-black overflow-hidden shadow-2xl relative cursor-crosshair touch-none"
            >
                {/* Instruction Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-black pointer-events-none text-center uppercase tracking-widest bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
                    DRAG LEFT TO DRAW • RELEASE TO HOLD • DRAG RIGHT TO AIM • TAP LEFT TO SHOOT
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

        {/* Orientation Warning Overlay */}
        <AnimatePresence>
            {!isLandscape && gameState === 'playing' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-[#0d1117] flex flex-col items-center justify-center p-10 text-center"
                >
                    <RotateCw className="w-16 h-16 text-[#3bc117] animate-spin mb-6" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Landscape Recommended</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Please rotate your device for the best archery experience</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BirdShooting;