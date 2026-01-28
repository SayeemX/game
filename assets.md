# Bird Hunting Game Assets Overview

This document contains all AI asset prompts and session details for generating high-quality components for the Bird Hunting Game.

---

## 1. Birds (Main Targets)
| Bird Type | Animation/State | AI Prompt | Notes |
|-----------|----------------|-----------|-------|
| Sparrow | Fly1 | Realistic sparrow flying in the sky, wings wide, slight motion blur, semi-realistic style, transparent background, 1024x1024 | 4-6 frames per flap cycle |
| Sparrow | Fly2 | Realistic sparrow in mid-flight, wings slightly tilted, semi-realistic style, transparent background, 1024x1024, motion blur, dynamic pose | 4-6 frames |
| Sparrow | Hit/Flinching | Sparrow reacting to arrow hit, wings flared, distressed pose, semi-realistic, transparent background, 1024x1024 | 2-3 frames |
| Pigeon | Flying | Realistic pigeon in mid-flight, angled slightly forward, semi-realistic style, transparent background | 4-6 frames |
| Pigeon | Hit/Flinching | Pigeon recoiling from arrow hit, flapping wings, semi-realistic, transparent background | 2-3 frames |
| Eagle | Flying | Majestic eagle soaring, wings wide, semi-realistic, cinematic lighting, transparent background | 6-8 frames |
| Eagle | Hit/Flinching | Eagle reacting to arrow impact, wings flared, distressed, semi-realistic, transparent background | 2-3 frames |
| Rare Bird | Flying | Exotic rare bird in flight, vibrant colors, glowing tips, semi-realistic, transparent background | Optional premium target |

---

## 2. Weapons
| Weapon | Pose/State | AI Prompt | Notes |
|--------|------------|-----------|-------|
| Wooden Bow | Idle | Detailed wooden bow with silver accents, semi-realistic, transparent background, 1024x1024 | UI icons + default bow |
| Wooden Bow | Draw Arrow | Wooden bow pulled back with arrow nocked, tension visible, semi-realistic, transparent background | Animation frame |
| Airgun | Idle | Modern airgun with metallic finish, semi-realistic, transparent background | Default projectile weapon |
| Airgun | Firing | Airgun firing, slight recoil, motion blur on barrel, semi-realistic, transparent background | 2-3 frames |
| Premium Bow | Idle | Elegant silver bow with glowing arrow, semi-realistic, premium item, transparent background | Premium visual cue |
| Premium Bow | Draw | Silver bow with glowing arrow drawn back, magical aura, semi-realistic, transparent background | Optional particle effect |

---

## 3. Projectiles / Effects
| Type | AI Prompt | Notes |
|------|-----------|------|
| Arrow | Idle | Wooden arrow with metal tip, realistic, semi-realistic, transparent background, 1024x1024 | Separate asset for rotation in Phaser |
| Arrow | Flight | Arrow mid-flight, motion blur, semi-realistic, transparent background | 2-3 frames |
| Airgun Pellet | Flight | Metallic airgun pellet flying, motion blur, semi-realistic, transparent background | 1 frame |
| Hit Impact | Arrow | Arrow hitting bird, feathers flying, small impact sparks, semi-realistic, transparent background | Particle system effect |
| Hit Impact | Airgun | Small metallic spark and feathers on bird hit, semi-realistic, transparent background | 1-2 frames |

---

## 4. Environment & Backgrounds
| Component | AI Prompt | Notes |
|-----------|-----------|------|
| Sky Day | Bright morning sky with soft clouds, cinematic, realistic, 16:9, 1920x1080, game background | Parallax layer 1 |
| Sky Sunset | Warm sunset sky with orange and purple clouds, cinematic, realistic, 16:9, 1920x1080 | Alternate level |
| Sky Night | Night sky with moon and stars, cinematic, semi-realistic, 16:9, 1920x1080 | Optional level |
| Foreground Trees | Green forest trees in soft focus, semi-realistic, transparent background, game foreground layer | Parallax layer 2 |
| Bushes/Grass | Bushes and grass in semi-realistic style, 2D game-ready, transparent background | Foreground + collision layer |
| Ground | Soft grassy terrain with small rocks, semi-realistic, transparent background, 1024x256 | Repeatable tile |

---

## 5. UI / HUD Components
| Element | AI Prompt | Notes |
|---------|-----------|------|
| Score Counter | Semi-transparent UI panel with elegant numeric display, modern gaming style, transparent background | Top-left corner |
| Combo Indicator | Floating combo text effect, semi-realistic, dynamic, transparent background | Appears above birds |
| Weapon Icon | Detailed bow icon, semi-realistic, transparent background | Swap with premium variants |
| Premium Unlock Button | Golden shiny button, 'Unlock' text, semi-realistic style, transparent background | Store button |
| Health / Arrow Count | Stylized UI bar for arrow count, semi-realistic, transparent background | Top-right corner |

---

## 6. Special Effects / Particles
| Effect | AI Prompt | Notes |
|--------|-----------|------|
| Feather Scatter | Bird feathers scattering mid-air, semi-realistic, transparent background | Phaser particle emitter |
| Arrow Trail | Light arrow motion trail, semi-transparent, semi-realistic, transparent background | Dynamic blur effect |
| Hit Spark | Small spark and smoke on hit, semi-realistic, transparent background | 2-3 frames |
| Premium Glow | Soft glowing aura around weapon, semi-realistic, transparent background | For premium weapons |

---

## 7. Session Notes
- Generated assets include Fly1/Fly2 for sparrow, hit/flinch frames, sky backgrounds, weapons, projectiles, UI elements, and particle effects.
- All prompts designed for **semi-realistic 2D game style**.
- Images generated at **1024x1024** (can downscale for mobile) with transparent backgrounds for sprite use.
- Organized for **Phaser.js integration**, sprite sheets, and animation frames.
- Premium weapons and rare birds included for monetization and game progression.

---

This document can be used as a **master reference** to generate, organize, and integrate all assets for the Bird Hunting Game.

