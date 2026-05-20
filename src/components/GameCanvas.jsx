// src/components/GameCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';
import { playBump, playStateTransition, playSwitch, playExplosion, playLevelUp } from '../utils/audio';

function GameCanvas({ level, onLevelClear, onQuit }) {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // Track active keys
  const keysRef = useRef({
    KeyW: false, KeyA: false, KeyS: false, KeyD: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
  });

  const stateRef = useRef({
    // Core node attributes
    player: { x: 0.1, y: 0.5, vx: 0, vy: 0, radius: 14, targetRadius: 14, state: 'neutral' }, // 'neutral' | 'hot' | 'cold'
    
    // Level items (defined in terms of fraction of canvas width/height)
    walls: [],     // Array of { x, y, w, h }
    heaters: [],   // Array of { x, y, w, h }
    coolers: [],   // Array of { x, y, w, h }
    spikes: [],    // Array of { x, y, radius }
    switches: [],  // Array of { x, y, radius, pressed: false, heavy: true/false }
    gates: [],     // Array of { x, y, w, h, switchIndex, open: false }
    destination: { x: 0.9, y: 0.5, radius: 24 },
    
    particles: [], // glowing volcanic/cryo particles
    shake: 0,
    clearPending: false
  });

  const generateLevel = (lvl) => {
    const state = stateRef.current;
    state.player = { x: 0.1, y: 0.5, vx: 0, vy: 0, radius: 14, targetRadius: 14, state: 'neutral' };
    state.walls = [];
    state.heaters = [];
    state.coolers = [];
    state.spikes = [];
    state.switches = [];
    state.gates = [];
    state.particles = [];
    state.shake = 0;
    state.clearPending = false;

    state.destination = { x: 0.9, y: 0.5, radius: 24 };

    // Outer border walls
    state.walls.push({ x: 0, y: 0, w: 1.0, h: 0.05 }); // Top
    state.walls.push({ x: 0, y: 0.95, w: 1.0, h: 0.05 }); // Bottom
    state.walls.push({ x: 0, y: 0.05, w: 0.05, h: 0.9 }); // Left
    state.walls.push({ x: 0.95, y: 0.05, w: 0.05, h: 0.9 }); // Right

    switch(lvl) {
      case 1:
        // Tutorial 1: Heaters & Heavy Switch
        state.walls.push({ x: 0.35, y: 0.05, w: 0.05, h: 0.6 }); // Divider wall
        state.heaters.push({ x: 0.2, y: 0.7, w: 0.1, h: 0.2 });
        state.switches.push({ x: 0.25, y: 0.25, radius: 18, pressed: false, heavy: true }); // Heavy button
        state.gates.push({ x: 0.35, y: 0.65, w: 0.05, h: 0.3, switchIndex: 0, open: false });
        break;

      case 2:
        // Tutorial 2: Coolers & Narrow passages
        state.walls.push({ x: 0.45, y: 0.05, w: 0.05, h: 0.45 });
        state.walls.push({ x: 0.45, y: 0.55, w: 0.05, h: 0.4 }); // Narrow 10% gap in middle
        state.coolers.push({ x: 0.22, y: 0.25, w: 0.1, h: 0.15 });
        break;

      case 3:
        // Thermal Alternation: Heat then Cool
        state.walls.push({ x: 0.3, y: 0.05, w: 0.04, h: 0.5 });
        state.walls.push({ x: 0.6, y: 0.45, w: 0.04, h: 0.5 });
        state.heaters.push({ x: 0.15, y: 0.75, w: 0.1, h: 0.15 });
        state.switches.push({ x: 0.22, y: 0.25, radius: 18, pressed: false, heavy: true });
        state.gates.push({ x: 0.3, y: 0.55, w: 0.04, h: 0.4, switchIndex: 0, open: false });
        state.coolers.push({ x: 0.45, y: 0.75, w: 0.1, h: 0.15 });
        break;

      case 4:
        // Hazard spikes maze
        state.walls.push({ x: 0.3, y: 0.05, w: 0.05, h: 0.65 });
        state.walls.push({ x: 0.6, y: 0.3, w: 0.05, h: 0.65 });
        state.heaters.push({ x: 0.15, y: 0.75, w: 0.1, h: 0.15 });
        state.spikes.push({ x: 0.48, y: 0.35, radius: 14 });
        state.spikes.push({ x: 0.48, y: 0.65, radius: 14 });
        state.spikes.push({ x: 0.78, y: 0.25, radius: 14 });
        state.spikes.push({ x: 0.78, y: 0.55, radius: 14 });
        break;

      case 5:
        // Dual Gate complex puzzle
        state.walls.push({ x: 0.3, y: 0.05, w: 0.04, h: 0.5 });
        state.walls.push({ x: 0.6, y: 0.45, w: 0.04, h: 0.5 });
        
        state.heaters.push({ x: 0.12, y: 0.75, w: 0.1, h: 0.15 });
        state.coolers.push({ x: 0.42, y: 0.12, w: 0.1, h: 0.15 });

        state.switches.push({ x: 0.2, y: 0.25, radius: 18, pressed: false, heavy: true });
        state.switches.push({ x: 0.5, y: 0.75, radius: 18, pressed: false, heavy: false }); // regular button

        state.gates.push({ x: 0.3, y: 0.55, w: 0.04, h: 0.4, switchIndex: 0, open: false });
        state.gates.push({ x: 0.6, y: 0.05, w: 0.04, h: 0.4, switchIndex: 1, open: false });
        break;

      case 6:
        // The Lava Floor
        state.heaters.push({ x: 0.2, y: 0.2, w: 0.6, h: 0.6 });
        state.switches.push({ x: 0.5, y: 0.82, radius: 18, pressed: false, heavy: true });
        state.walls.push({ x: 0.8, y: 0.05, w: 0.04, h: 0.7 });
        state.gates.push({ x: 0.8, y: 0.75, w: 0.04, h: 0.2, switchIndex: 0, open: false });
        break;

      case 7:
        // Ice slides narrow corridor
        state.coolers.push({ x: 0.15, y: 0.15, w: 0.15, h: 0.15 });
        state.walls.push({ x: 0.35, y: 0.05, w: 0.05, h: 0.4 });
        state.walls.push({ x: 0.35, y: 0.52, w: 0.05, h: 0.43 }); // narrow gap
        state.walls.push({ x: 0.6, y: 0.05, w: 0.05, h: 0.43 });
        state.walls.push({ x: 0.6, y: 0.55, w: 0.05, h: 0.4 });
        state.heaters.push({ x: 0.48, y: 0.75, w: 0.1, h: 0.15 });
        state.switches.push({ x: 0.8, y: 0.25, radius: 18, pressed: false, heavy: true });
        break;

      case 8:
        // Spike Alley
        state.coolers.push({ x: 0.2, y: 0.7, w: 0.1, h: 0.18 });
        state.spikes.push({ x: 0.4, y: 0.25, radius: 12 });
        state.spikes.push({ x: 0.45, y: 0.55, radius: 12 });
        state.spikes.push({ x: 0.5, y: 0.8, radius: 12 });
        state.spikes.push({ x: 0.65, y: 0.3, radius: 12 });
        state.spikes.push({ x: 0.75, y: 0.7, radius: 12 });
        break;

      case 9:
        // Thermal labyrinth
        state.walls.push({ x: 0.25, y: 0.05, w: 0.04, h: 0.55 });
        state.walls.push({ x: 0.48, y: 0.4, w: 0.04, h: 0.55 });
        state.walls.push({ x: 0.72, y: 0.05, w: 0.04, h: 0.55 });
        
        state.heaters.push({ x: 0.1, y: 0.75, w: 0.1, h: 0.15 });
        state.coolers.push({ x: 0.35, y: 0.12, w: 0.1, h: 0.15 });
        state.heaters.push({ x: 0.58, y: 0.75, w: 0.1, h: 0.15 });

        state.switches.push({ x: 0.18, y: 0.22, radius: 18, pressed: false, heavy: true });
        state.gates.push({ x: 0.25, y: 0.6, w: 0.04, h: 0.35, switchIndex: 0, open: false });

        state.switches.push({ x: 0.65, y: 0.22, radius: 18, pressed: false, heavy: true });
        state.gates.push({ x: 0.72, y: 0.6, w: 0.04, h: 0.35, switchIndex: 1, open: false });
        break;

      case 10:
        // The Final Reactor
        state.heaters.push({ x: 0.15, y: 0.75, w: 0.1, h: 0.15 });
        state.coolers.push({ x: 0.35, y: 0.12, w: 0.1, h: 0.15 });

        state.walls.push({ x: 0.3, y: 0.05, w: 0.04, h: 0.65 });
        state.walls.push({ x: 0.55, y: 0.3, w: 0.04, h: 0.65 });
        state.walls.push({ x: 0.78, y: 0.05, w: 0.04, h: 0.65 });

        state.switches.push({ x: 0.2, y: 0.25, radius: 18, pressed: false, heavy: true });
        state.gates.push({ x: 0.3, y: 0.7, w: 0.04, h: 0.25, switchIndex: 0, open: false });

        state.spikes.push({ x: 0.45, y: 0.5, radius: 15 });
        state.spikes.push({ x: 0.68, y: 0.3, radius: 15 });
        state.spikes.push({ x: 0.68, y: 0.7, radius: 15 });
        break;

      default:
        state.heaters.push({ x: 0.3, y: 0.3, w: 0.15, h: 0.15 });
        break;
    }
  };

  const spawnExplosion = (x, y, color, count) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      stateRef.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  };

  const handleExplodeReset = () => {
    const state = stateRef.current;
    if (state.clearPending) return;

    playExplosion();
    state.shake = 15;
    
    const canvas = canvasRef.current;
    spawnExplosion(state.player.x * canvas.width, state.player.y * canvas.height, '#ff0055', 30);

    // Reset player position and temperature
    state.player.x = 0.1;
    state.player.y = 0.5;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.state = 'neutral';
    state.player.targetRadius = 14;
  };

  // Keyboard updates
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game tick loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(500, window.innerHeight - 80);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    generateLevel(level);

    const tick = () => {
      const state = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // 1. Move player based on inputs
      let ax = 0;
      let ay = 0;
      const force = 0.42;

      const keys = keysRef.current;
      if (keys.KeyW || keys.ArrowUp) ay = -force;
      if (keys.KeyS || keys.ArrowDown) ay = force;
      if (keys.KeyA || keys.ArrowLeft) ax = -force;
      if (keys.KeyD || keys.ArrowRight) ax = force;

      if (!state.clearPending) {
        state.player.vx += ax;
        state.player.vy += ay;
      }

      // Apply friction
      state.player.vx *= 0.91;
      state.player.vy *= 0.91;

      // Update positions
      state.player.x += state.player.vx / W;
      state.player.y += state.player.vy / H;

      // Interpolate smooth radius transition
      state.player.radius += (state.player.targetRadius - state.player.radius) * 0.12;

      const r = state.player.radius;

      // 2. Resolve wall collisions
      const checkWallCollision = (box) => {
        const bX = box.x * W;
        const bY = box.y * H;
        const bW = box.w * W;
        const bH = box.h * H;
        const pX = state.player.x * W;
        const pY = state.player.y * H;

        // Closest point on box to circle center
        const closestX = Math.max(bX, Math.min(pX, bX + bW));
        const closestY = Math.max(bY, Math.min(pY, bY + bH));
        const dist = Math.hypot(pX - closestX, pY - closestY);

        if (dist < r) {
          playBump();
          // Push player out
          const overlap = r - dist;
          const dx = pX - closestX;
          const dy = pY - closestY;
          const angle = Math.atan2(dy, dx);
          
          if (dist === 0) {
            // center overlap fallback
            state.player.x += (r / W);
          } else {
            state.player.x += (Math.cos(angle) * overlap) / W;
            state.player.y += (Math.sin(angle) * overlap) / H;
          }
          // Bounce speed
          state.player.vx *= -0.3;
          state.player.vy *= -0.3;
        }
      };

      // Check standard walls
      state.walls.forEach(checkWallCollision);

      // Check active gates
      state.gates.forEach(gate => {
        if (!gate.open) {
          checkWallCollision(gate);
        }
      });

      // 3. Check thermal zones (Heaters/Coolers)
      let inHeater = false;
      let inCooler = false;

      const pX = state.player.x * W;
      const pY = state.player.y * H;

      state.heaters.forEach(h => {
        if (pX >= h.x * W && pX <= (h.x + h.w) * W && pY >= h.y * H && pY <= (h.y + h.h) * H) {
          inHeater = true;
        }
      });

      state.coolers.forEach(c => {
        if (pX >= c.x * W && pX <= (c.x + c.w) * W && pY >= c.y * H && pY <= (c.y + c.h) * H) {
          inCooler = true;
        }
      });

      if (inHeater && state.player.state !== 'hot') {
        state.player.state = 'hot';
        state.player.targetRadius = 26;
        playStateTransition(true);
        spawnExplosion(pX, pY, '#ff5e00', 8);
      } else if (inCooler && state.player.state !== 'cold') {
        state.player.state = 'cold';
        state.player.targetRadius = 7;
        playStateTransition(false);
        spawnExplosion(pX, pY, '#60efff', 8);
      }

      // Volcanic/glacial tail particle emissions
      if (Math.random() < 0.28) {
        const color = state.player.state === 'hot' ? '#ff5e00' : state.player.state === 'cold' ? '#60efff' : '#ff0055';
        state.particles.push({
          x: pX + (Math.random() - 0.5) * r,
          y: pY + (Math.random() - 0.5) * r,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color,
          life: 0.8,
          decay: 0.03
        });
      }

      // 4. Update Switches / Plates (Stays pressed once activated)
      state.switches.forEach(sw => {
        const swX = sw.x * W;
        const swY = sw.y * H;
        const d = Math.hypot(pX - swX, pY - swY);

        if (!sw.pressed) {
          let touchTrigger = false;
          if (d < r + sw.radius) {
            if (sw.heavy) {
              touchTrigger = state.player.state === 'hot';
            } else {
              touchTrigger = true;
            }
          }

          if (touchTrigger) {
            sw.pressed = true;
            playSwitch();
            spawnExplosion(swX, swY, '#ff5e00', 6);
          }
        }
      });

      // Update gates status
      state.gates.forEach(gate => {
        gate.open = state.switches[gate.switchIndex]?.pressed || false;
      });

      // 5. Check hazard Spikes
      state.spikes.forEach(sp => {
        const spX = sp.x * W;
        const spY = sp.y * H;
        const d = Math.hypot(pX - spX, pY - spY);
        if (d < r + sp.radius) {
          handleExplodeReset();
        }
      });

      // 6. Check destination reactor
      const dExit = Math.hypot(pX - state.destination.x * W, pY - state.destination.y * H);
      if (dExit < r + state.destination.radius && !state.clearPending) {
        state.clearPending = true;
        playLevelUp();
        spawnExplosion(state.destination.x * W, state.destination.y * H, '#60efff', 35);
        setTimeout(() => {
          onLevelClear();
        }, 1200);
      }

      // RENDER CANVAS
      ctx.save();
      if (state.shake > 0.1) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake *= 0.88;
      }

      // Background draw
      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, 0, W, H);

      // Parallax moving background grid dots
      ctx.fillStyle = 'rgba(255, 94, 0, 0.03)';
      const bgShiftX = (Date.now() * 0.015) % 40;
      const bgShiftY = (Date.now() * 0.01) % 40;
      for (let x = bgShiftX; x < W; x += 40) {
        for (let y = bgShiftY; y < H; y += 40) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      // Tech Grid Lines
      ctx.strokeStyle = 'rgba(96, 239, 255, 0.015)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x += 100) {
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
      }
      for (let y = 0; y < H; y += 100) {
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Scanline effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 1);
      }

      // Draw heating zones (Heaters)
      state.heaters.forEach(h => {
        const hX = h.x * W;
        const hY = h.y * H;
        const hW = h.w * W;
        const hH = h.h * H;
        
        // Heat glow
        const grad = ctx.createRadialGradient(hX + hW/2, hY + hH/2, 5, hX + hW/2, hY + hH/2, hW * 0.7);
        grad.addColorStop(0, 'rgba(255, 94, 0, 0.28)');
        grad.addColorStop(1, 'rgba(255, 94, 0, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(hX, hY, hW, hH);

        // Animated warning stripes inside heaters
        ctx.strokeStyle = 'rgba(255, 94, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const spacing = 15;
        const offset = (Date.now() * 0.015) % spacing;
        for (let sx = hX + offset - spacing; sx < hX + hW + spacing; sx += spacing) {
          ctx.moveTo(sx, hY); ctx.lineTo(sx - 10, hY + hH);
        }
        ctx.stroke();

        // Border
        ctx.strokeStyle = '#ff5e00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hX, hY, hW, hH);

        // Tech details on top/bottom
        ctx.fillStyle = 'rgba(255, 94, 0, 0.4)';
        ctx.fillRect(hX, hY, hW, 4);
        ctx.fillRect(hX, hY + hH - 4, hW, 4);
      });

      // Draw cooling zones (Coolers)
      state.coolers.forEach(c => {
        const cX = c.x * W;
        const cY = c.y * H;
        const cW = c.w * W;
        const cH = c.h * H;

        // Ice glow
        const grad = ctx.createRadialGradient(cX + cW/2, cY + cH/2, 5, cX + cW/2, cY + cH/2, cW * 0.7);
        grad.addColorStop(0, 'rgba(96, 239, 255, 0.28)');
        grad.addColorStop(1, 'rgba(96, 239, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cX, cY, cW, cH);

        // Cool vertical wave lines
        ctx.strokeStyle = 'rgba(96, 239, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const spacing = 15;
        const offset = (Date.now() * -0.01) % spacing;
        for (let cx = cX + offset - spacing; cx < cX + cW + spacing; cx += spacing) {
          ctx.moveTo(cx, cY);
          // Wave curve
          for (let cy = cY; cy <= cY + cH; cy += 10) {
            ctx.lineTo(cx + Math.sin(cy * 0.1 + Date.now() * 0.005) * 3, cy);
          }
        }
        ctx.stroke();

        // Border
        ctx.strokeStyle = '#60efff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cX, cY, cW, cH);

        // Frost corners
        ctx.fillStyle = 'rgba(96, 239, 255, 0.4)';
        ctx.fillRect(cX, cY, 4, cH);
        ctx.fillRect(cX + cW - 4, cY, 4, cH);
      });

      // Draw normal walls (Metallic Beveled Tiles)
      state.walls.forEach(w => {
        const x = w.x * W;
        const y = w.y * H;
        const width = w.w * W;
        const height = w.h * H;

        // Metallic panel background
        const wallGrad = ctx.createLinearGradient(x, y, x + width, y + height);
        wallGrad.addColorStop(0, '#1c1926');
        wallGrad.addColorStop(0.5, '#12101b');
        wallGrad.addColorStop(1, '#0b0a12');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(x, y, width, height);

        // Outer neon highlight borders
        ctx.strokeStyle = 'rgba(96, 239, 255, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, width, height);

        // Inner beveled shade
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

        // Draw rivets on corners for a metallic mechanical look
        if (width > 22 && height > 22) {
          ctx.fillStyle = '#4e4c5e';
          const rivets = [
            [6, 6],
            [width - 6, 6],
            [6, height - 6],
            [width - 6, height - 6]
          ];
          rivets.forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(x + rx, y + ry, 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Rivet specular dot
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(x + rx - 0.6, y + ry - 0.6, 1.0, 1.0);
            ctx.fillStyle = '#4e4c5e'; // Restore
          });
        }
      });

      // Draw Switches / Plates (3D Cyber Pads)
      state.switches.forEach(sw => {
        const sX = sw.x * W;
        const sY = sw.y * H;
        const radius = sw.radius;

        // 3D Outer steel casing
        ctx.fillStyle = '#222030';
        ctx.strokeStyle = sw.pressed ? '#ff5e00' : '#454256';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sX, sY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner pressure pad plate
        ctx.fillStyle = sw.pressed ? 'rgba(255, 94, 0, 0.4)' : '#0e0c16';
        ctx.beginPath();
        ctx.arc(sX, sY, radius - 4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing center core led
        if (sw.pressed) {
          ctx.shadowColor = '#ff5e00';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ff5e00';
        } else {
          ctx.fillStyle = sw.heavy ? 'rgba(255, 94, 0, 0.5)' : '#60efff';
        }
        ctx.beginPath();
        ctx.arc(sX, sY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // State labeling text
        ctx.fillStyle = sw.pressed ? '#ff5e00' : 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 9px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sw.heavy ? "HEAVY" : "READY", sX, sY - radius * 0.5);
      });

      // Draw gates status (Glowing Neon Forcefield)
      state.gates.forEach(gate => {
        if (!gate.open) {
          const gX = gate.x * W;
          const gY = gate.y * H;
          const gW = gate.w * W;
          const gH = gate.h * H;

          // Glowing background pulse
          const pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.01);
          ctx.fillStyle = `rgba(255, 94, 0, ${0.1 + pulse * 0.08})`;
          ctx.fillRect(gX, gY, gW, gH);

          // Forcefield lines
          ctx.strokeStyle = `rgba(255, 94, 0, ${0.15 * pulse})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let gy = gY; gy < gY + gH; gy += 6) {
            ctx.moveTo(gX, gy); ctx.lineTo(gX + gW, gy);
          }
          ctx.stroke();

          // Glowing border
          ctx.shadowColor = '#ff5e00';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = '#ff5e00';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(gX, gY, gW, gH);
          ctx.shadowBlur = 0;
        }
      });

      // Draw spikes hazards (Tesla Coils with active animated electric lightning arcs!)
      state.spikes.forEach(sp => {
        const sX = sp.x * W;
        const sY = sp.y * H;
        const radius = sp.radius;

        // Draw metallic generator base
        ctx.fillStyle = '#1c1926';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sX, sY, radius * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing center core sphere
        const pulse = 1.0 + 0.15 * Math.sin(Date.now() * 0.025);
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(sX, sY, radius * 0.38 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Procedural electric lightning arcs extending outwards!
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 4;
        
        const arcCount = 3;
        for (let i = 0; i < arcCount; i++) {
          const startAngle = (Date.now() * 0.005 + (i * Math.PI * 2 / arcCount)) % (Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(sX, sY);
          
          let curX = sX;
          let curY = sY;
          const steps = 4;
          for (let s = 1; s <= steps; s++) {
            const ratio = s / steps;
            const targetX = sX + Math.cos(startAngle) * radius * ratio;
            const targetY = sY + Math.sin(startAngle) * radius * ratio;
            
            // Random lightning zig-zag offset
            const offsetAmp = 4 * (1 - ratio);
            curX = targetX + (Math.random() - 0.5) * offsetAmp;
            curY = targetY + (Math.random() - 0.5) * offsetAmp;
            ctx.lineTo(curX, curY);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      });

      // Draw destination reactor portal (Pulsing cyber core portal)
      const destX = state.destination.x * W;
      const destY = state.destination.y * H;
      const destR = state.destination.radius;

      ctx.save();
      ctx.shadowColor = '#60efff';
      ctx.shadowBlur = 15;
      
      // Portal base glow
      ctx.fillStyle = 'rgba(96, 239, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(destX, destY, destR + Math.sin(Date.now() * 0.006) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Outer rotating segmented scanner rings
      ctx.strokeStyle = '#60efff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(destX, destY, destR + 6, Date.now() * 0.002, Date.now() * 0.002 + Math.PI * 1.3);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(destX, destY, destR + 6, Date.now() * -0.003 + Math.PI, Date.now() * -0.003 + Math.PI * 2.3);
      ctx.stroke();

      // Center sphere
      ctx.fillStyle = '#60efff';
      ctx.beginPath();
      ctx.arc(destX, destY, destR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // "PORTAL" text
      ctx.fillStyle = '#06040a';
      ctx.font = 'bold 8px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("PORTAL", destX, destY);
      ctx.restore();

      // Draw Player core node (Plasma Orb with outer rings and energy shield)
      ctx.save();
      const col = state.player.state === 'hot' ? '#ff5e00' : state.player.state === 'cold' ? '#60efff' : '#ff0055';
      
      // Glow
      ctx.shadowColor = col;
      ctx.shadowBlur = 15;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pX, pY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Energy shield rings rotating
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pX, pY, r + 4, Date.now() * 0.015, Date.now() * 0.015 + Math.PI * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pX, pY, r + 4, Date.now() * -0.01 + Math.PI, Date.now() * -0.01 + Math.PI * 1.7);
      ctx.stroke();

      // Core center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pX, pY, r * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Status letter overlay
      if (state.player.state === 'hot') {
        ctx.fillStyle = '#ff5e00';
        ctx.font = 'bold 8px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("H", pX, pY);
      } else if (state.player.state === 'cold') {
        ctx.fillStyle = '#60efff';
        ctx.font = 'bold 6px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("C", pX, pY);
      }
      ctx.restore();

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5 * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [level]);

  // Virtual D-Pad movement triggers for mobile support
  const triggerMoveDir = (dir, active) => {
    const keys = keysRef.current;
    if (dir === 'U') keys.KeyW = active;
    if (dir === 'D') keys.KeyS = active;
    if (dir === 'L') keys.KeyA = active;
    if (dir === 'R') keys.KeyD = active;
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Header Info */}
      <div style={{ height: '50px', background: 'rgba(5, 5, 15, 0.9)', borderBottom: '1px solid rgba(255,94,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontFamily: 'Orbitron' }}>
        <div style={{ fontSize: '12px' }}>
          CELL: <span style={{ color: '#ff5e00' }}>{level}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cyber secondary" style={{ padding: '4px 12px', fontSize: '10px' }} onClick={() => handleExplodeReset()}>RESET CELL</button>
          <button className="btn-cyber secondary" style={{ padding: '4px 12px', fontSize: '10px', borderColor: '#ff0055', color: '#ff0055' }} onClick={onQuit}>ABORT</button>
        </div>
      </div>

      {/* Main Canvas viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* Mobile virtual HUD controller buttons */}
        <div style={{
          position: 'absolute', bottom: '24px', right: '24px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gridTemplateRows: 'repeat(3, 46px)',
          gap: '6px', zIndex: 10, pointerEvents: 'auto'
        }}>
          <div />
          <button 
            style={{ background: 'rgba(12,6,4,0.6)', border: '1px solid rgba(255,94,0,0.3)', color: '#ff5e00', borderRadius: '6px', fontFamily: 'Orbitron', fontWeight: '800' }}
            onTouchStart={() => triggerMoveDir('U', true)} onTouchEnd={() => triggerMoveDir('U', false)}
            onMouseDown={() => triggerMoveDir('U', true)} onMouseUp={() => triggerMoveDir('U', false)}
          >▲</button>
          <div />

          <button 
            style={{ background: 'rgba(12,6,4,0.6)', border: '1px solid rgba(255,94,0,0.3)', color: '#ff5e00', borderRadius: '6px', fontFamily: 'Orbitron', fontWeight: '800' }}
            onTouchStart={() => triggerMoveDir('L', true)} onTouchEnd={() => triggerMoveDir('L', false)}
            onMouseDown={() => triggerMoveDir('L', true)} onMouseUp={() => triggerMoveDir('L', false)}
          >◀</button>
          <div />
          <button 
            style={{ background: 'rgba(12,6,4,0.6)', border: '1px solid rgba(255,94,0,0.3)', color: '#ff5e00', borderRadius: '6px', fontFamily: 'Orbitron', fontWeight: '800' }}
            onTouchStart={() => triggerMoveDir('R', true)} onTouchEnd={() => triggerMoveDir('R', false)}
            onMouseDown={() => triggerMoveDir('R', true)} onMouseUp={() => triggerMoveDir('R', false)}
          >▶</button>

          <div />
          <button 
            style={{ background: 'rgba(12,6,4,0.6)', border: '1px solid rgba(255,94,0,0.3)', color: '#ff5e00', borderRadius: '6px', fontFamily: 'Orbitron', fontWeight: '800' }}
            onTouchStart={() => triggerMoveDir('D', true)} onTouchEnd={() => triggerMoveDir('D', false)}
            onMouseDown={() => triggerMoveDir('D', true)} onMouseUp={() => triggerMoveDir('D', false)}
          >▼</button>
          <div />
        </div>
      </div>

    </div>
  );
}

export default GameCanvas;
