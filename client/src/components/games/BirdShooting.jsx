import React, { useState, useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Target, Trophy, Zap, Gamepad2, AlertCircle, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { updateWallet } from '../../redux/slices/userSlice';

import Arrow from '../../entities/Arrow';

// --- 3D Game Classes ---

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
    this.soundLoader = new THREE.AudioLoader();
    this.sounds = {};
    
    // Placeholder for loading sounds
    // In a real app, you'd preload these in a LoadingManager
    this.loaded = false;
  }

  load() {
    // Example: this.loadSound('shoot', '/assets/sounds/shoot.mp3');
    // For now, we'll just log since we have no files
    console.log("SoundSystem: Initialized (No audio files present)");
  }

  loadSound(name, path) {
    const sound = new THREE.Audio(this.listener);
    this.soundLoader.load(path, (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
        this.sounds[name] = sound;
    });
  }

  play(name) {
    if (this.sounds[name] && !this.sounds[name].isPlaying) {
        this.sounds[name].play();
    } else {
        // Fallback or log
        // console.log(`Playing sound: ${name}`);
    }
  }
  
  playPositional(name, object) {
      // Setup positional audio if needed
  }
}

class BirdSystem3D {
  constructor(game) {
    this.game = game;
    this.birds = [];
    this.flockSize = 15;
    this.birdTypes = [
      { name: 'Sparrow', speed: 8, size: 0.3, color: 0x8B4513, points: 10 },
      { name: 'Pigeon', speed: 10, size: 0.5, color: 0x808080, points: 15 },
      { name: 'Eagle', speed: 15, size: 1, color: 0xD2691E, points: 50 },
    ];
    
    this.createFlock();
  }

  createFlock() {
    for (let i = 0; i < this.flockSize; i++) {
      const birdType = this.birdTypes[Math.floor(Math.random() * this.birdTypes.length)];
      const bird = this.createBird(birdType);
      
      // Random starting position in sky
      bird.mesh.position.set(
        (Math.random() - 0.5) * 100,
        20 + Math.random() * 30,
        -30 - Math.random() * 50
      );
      
      // Random velocity
      bird.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * birdType.speed,
        0,
        (Math.random() - 0.5) * birdType.speed
      );
      
      bird.active = true;
      this.birds.push(bird);
      this.game.scene.add(bird.mesh);
    }
  }

  createBird(type) {
    const birdGroup = new THREE.Group();
    
    // Body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(type.size, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: type.color,
      roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    birdGroup.add(body);
    
    // Wings (animated)
    const wingGeometry = new THREE.BoxGeometry(type.size * 1.5, type.size * 0.1, type.size * 0.5);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: type.color });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, type.size * 0.6);
    leftWing.rotation.y = Math.PI / 4;
    birdGroup.wingLeft = leftWing;
    birdGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, 0, -type.size * 0.6);
    rightWing.rotation.y = -Math.PI / 4;
    birdGroup.wingRight = rightWing;
    birdGroup.add(rightWing);
    
    // Physics body (Kinematic for birds as they fly by logic, not gravity)
    const birdBody = new CANNON.Body({
      mass: 0, // Kinematic
      position: new CANNON.Vec3(0, 0, 0),
      shape: new CANNON.Sphere(type.size)
    });
    
    return {
      mesh: birdGroup,
      body: birdBody,
      type: type,
      velocity: new THREE.Vector3(),
      wingFlapPhase: Math.random() * Math.PI * 2,
      wingFlapSpeed: 5 + Math.random() * 5
    };
  }

  updateFlock(deltaTime) {
    this.birds.forEach((bird) => {
      if (!bird.active) return;
      
      // Bounce off bounds
      if (bird.mesh.position.x > 100 || bird.mesh.position.x < -100) bird.velocity.x *= -1;
      if (bird.mesh.position.z > 50 || bird.mesh.position.z < -150) bird.velocity.z *= -1;
      
      bird.mesh.position.add(bird.velocity.clone().multiplyScalar(deltaTime));
      
      // Update rotation to face direction
      if (bird.velocity.lengthSq() > 0.01) {
        bird.mesh.rotation.y = Math.atan2(-bird.velocity.z, bird.velocity.x);
      }
      
      // Update physics body
      bird.body.position.copy(bird.mesh.position);
      
      // Wing animation
      const time = Date.now() * 0.001;
      const flap = Math.sin(time * bird.wingFlapSpeed + bird.wingFlapPhase) * Math.PI / 4;
      bird.mesh.wingLeft.rotation.x = flap;
      bird.mesh.wingRight.rotation.x = -flap;
    });
  }

  createFeatherExplosion(position) {
    const featherCount = 10;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/assets/effects/feather.png');
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

    for (let i = 0; i < featherCount; i++) {
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.5, 0.5, 0.5);
        
        // Random velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        
        this.game.scene.add(sprite);
        this.game.particles.push({ mesh: sprite, velocity, life: 1.0 });
    }
  }
}

class BowSystem3D {
  constructor(game) {
    this.game = game;
    this.bow = null;
    this.isDrawn = false;
    this.isScoped = false;
    this.drawPower = 0;
    this.drawStartTime = 0;
    this.maxDrawTime = 2000;
    
    this.arrows = [];
    this.loadedArrow = null;
    
    this.initBow();
    this.setupInputs();
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
    this.stringGeometry = new THREE.BufferGeometry().setFromPoints(stringPoints);
    this.bowString = new THREE.Line(this.stringGeometry, stringMaterial);
    this.bow.add(this.bowString);

    this.bow.position.set(0.3, -0.4, -0.6);
    this.game.camera.add(this.bow);
  }

  updateBowString(drawAmount = 0) {
    const positions = this.stringGeometry.attributes.position.array;
    const pullDistance = drawAmount * 0.3;
    positions[3] = -pullDistance; 
    positions[4] = 0.1 - (pullDistance * 0.3); 
    this.stringGeometry.attributes.position.needsUpdate = true;
  }

  setupInputs() {
    const element = this.game.container;
    element.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        this.handleMouseDown(e);
    });
    element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleMouseDown(e) {
    if (this.isScoped) return;
    this.isDrawn = true;
    this.drawStartTime = Date.now();
    this.game.haptics.trigger('draw_start');
    
    // Load arrow visual
    this.loadedArrow = new Arrow(new THREE.Vector3(), new THREE.Vector3(0,0,1));
    this.loadedArrow.isActive = false; // Static while nocked
    this.bow.add(this.loadedArrow.mesh);
    this.loadedArrow.mesh.rotation.x = -Math.PI / 2;
    this.loadedArrow.mesh.position.set(0, 0.1, 0);
  }

  handleMouseUp(e) {
    if (this.isDrawn && !this.isScoped) {
      this.isDrawn = false;
      this.activateScope();
    }
  }

  handleMouseMove(e) {
      if (this.isScoped) {
         const movementX = e.movementX || 0;
         const movementY = e.movementY || 0;
         this.game.camera.rotation.y -= movementX * 0.002;
         this.game.camera.rotation.x -= movementY * 0.002;
         this.game.camera.rotation.order = 'YXZ';
      }
  }

  activateScope() {
      this.isScoped = true;
      this.game.haptics.trigger('scope_enter');
      this.game.camera.fov = 15;
      this.game.camera.updateProjectionMatrix();
      if (this.game.onScopeEnter) this.game.onScopeEnter();
  }

  update(deltaTime) {
      if (this.isDrawn) {
          const elapsed = Date.now() - this.drawStartTime;
          this.drawPower = Math.min(elapsed / this.maxDrawTime, 1);
          this.updateBowString(this.drawPower);
          if (this.loadedArrow) {
              // Pull arrow back along Z (local space)
              this.loadedArrow.mesh.position.z = -this.drawPower * 0.3;
          }
      }
  }

  shoot() {
      if (!this.isScoped) return;
      this.isScoped = false;
      this.game.haptics.trigger('shoot');
      
      const direction = new THREE.Vector3();
      this.game.camera.getWorldDirection(direction);
      
      const spawnPos = new THREE.Vector3();
      this.game.camera.getWorldPosition(spawnPos);
      
      const flyingArrow = new Arrow(spawnPos, direction, this.drawPower);
      flyingArrow.shoot(this.drawPower, direction);
      this.game.scene.add(flyingArrow.mesh);
      this.game.scene.add(flyingArrow.trail);
      this.arrows.push(flyingArrow);
      
      if (this.game.onShoot) {
          this.game.onShoot({ power: this.drawPower });
      }

      this.game.camera.fov = 75;
      this.game.camera.updateProjectionMatrix();

      // Reset
      if (this.loadedArrow) {
          this.bow.remove(this.loadedArrow.mesh);
          this.loadedArrow = null;
      }
      this.updateBowString(0);
      this.drawPower = 0;
      if (this.game.onScopeExit) this.game.onScopeExit();
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
  constructor(container, onScore, onShoot) {
    this.container = container;
    this.onScore = onScore;
    this.onShoot = onShoot;
    this.activeArrows = [];
    this.particles = [];
    
    this.initThree();
    this.initPhysics();
    this.initEnvironment();
    
    this.audio = new SoundSystem(this.camera);
    this.haptics = new HapticSystem();
    this.audio.load();

    this.bowSystem = new BowSystem3D(this);
    this.birdSystem = new BirdSystem3D(this);
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
    this.camera.position.set(0, 1.7, 10); // Start position
    this.camera.rotation.order = 'YXZ';
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
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
      this.world.gravity.set(0, -9.82, 0);
  }

  initEnvironment() {
      // Ground
      const groundGeo = new THREE.PlaneGeometry(500, 500);
      const textureLoader = new THREE.TextureLoader();
      const groundTex = textureLoader.load('/assets/environment/ground.png');
      groundTex.wrapS = THREE.RepeatWrapping;
      groundTex.wrapT = THREE.RepeatWrapping;
      groundTex.repeat.set(50, 50);
      groundTex.colorSpace = THREE.SRGBColorSpace; // Standard color mapping
      
      const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
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
              this.scene.remove(arrow.mesh);
              if (arrow.trail) this.scene.remove(arrow.trail);
              arrows.splice(i, 1);
              continue;
          }

          // Collision Check
          this.birdSystem.birds.forEach(bird => {
              if (bird.active) {
                  const dist = arrow.mesh.position.distanceTo(bird.mesh.position);
                  if (dist < bird.type.size + 0.5) {
                      // HIT!
                      bird.active = false;
                      this.scene.remove(bird.mesh);
                      this.onScore(bird.type.points);
                      
                      this.audio.play('hit');
                      this.haptics.trigger('hit');
                      this.birdSystem.createFeatherExplosion(bird.mesh.position);

                      // Remove arrow
                      arrow.isActive = false;
                      this.scene.remove(arrow.mesh);
                      this.scene.remove(arrow.trail);
                  }
              }
          });
      }

      this.renderer.render(this.scene, this.camera);
  }

  dispose() {
      cancelAnimationFrame(this.requestID);
      this.resizeObserver.disconnect();
      this.renderer.dispose();
      this.container.innerHTML = '';
  }
}

// --- React Component ---

const BirdShooting = () => {
  const { socket } = useContext(AuthContext);
  const [gameState, setGameState] = useState('lobby');
  const [matchData, setMatchData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [showScopeUI, setShowScopeUI] = useState(false);
  const [drawPower, setDrawPower] = useState(0);
  const [error, setError] = useState(null);

  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const isFiringRef = useRef(false);
  const dispatch = useDispatch();
  const { wallet } = useSelector(state => state.user);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleSession = (data) => {
        setMatchData(data);
        setGameState('playing');
        setLoading(false);
    };

    const handleShotResult = (res) => {
        // Validation from server
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
            (points) => {
                setCurrentScore(prev => prev + points);
                // In a production app, we'd wait for server confirmation of the hit
            },
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
            }
          );

          // Hook UI events
          gameInstanceRef.current.onScopeEnter = () => setShowScopeUI(true);
          gameInstanceRef.current.onScopeExit = () => {
              setShowScopeUI(false);
              setDrawPower(0);
          };
          gameInstanceRef.current.onDrawUpdate = (power) => setDrawPower(power);

          return () => {
              if (gameInstanceRef.current) {
                  gameInstanceRef.current.dispose();
              }
          };
      }
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
      }
  };

  const startNewMatch = () => {
      if (!socket) return;
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-sans select-none">
      <div className="max-w-6xl mx-auto pt-4">
        
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
          <div className="relative">
            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="flex gap-4">
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Score</p>
                        <p className="text-4xl font-black text-[#3bc117]">{currentScore}</p>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Time</p>
                        <p className={`text-4xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
                    </div>
                </div>

                {/* Charge Bar */}
                {drawPower > 0 && (
                    <div className="flex-1 max-w-xs px-8">
                        <div className="bg-black/40 h-4 w-full rounded-full border border-white/10 overflow-hidden backdrop-blur-sm">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${drawPower * 100}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </div>
                        <p className="text-[8px] font-black text-white/50 text-center uppercase tracking-[0.3em] mt-2">Power: {Math.round(drawPower * 100)}%</p>
                    </div>
                )}
                
                <button 
                    onClick={() => setGameState('lobby')}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-3 rounded-xl border border-red-500/30 pointer-events-auto backdrop-blur-md"
                >
                    EXIT
                </button>
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
                    
                    {/* Shoot Button */}
                    <button 
                        onMouseDown={(e) => { e.stopPropagation(); handleShoot(); }}
                        className="absolute bottom-10 right-10 w-24 h-24 bg-red-600 rounded-full border-4 border-red-400 shadow-[0_0_50px_rgba(255,0,0,0.5)] pointer-events-auto active:scale-90 transition-transform flex items-center justify-center font-black text-xs"
                    >
                        FIRE
                    </button>
                </motion.div>
            )}
            </AnimatePresence>
            
            {/* Game Container */}
            <div 
                ref={gameContainerRef} 
                className="w-full h-[80vh] bg-black rounded-3xl overflow-hidden shadow-2xl relative cursor-crosshair touch-none"
            >
                {/* Instruction Overlay if needed */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold pointer-events-none text-center">
                    HOLD TO DRAW • RELEASE TO AIM • TAP FIRE BUTTON
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