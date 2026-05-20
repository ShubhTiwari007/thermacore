// src/utils/audio.js
// Procedural Sound Generator using Web Audio API for ThermaCore.

let audioCtx = null;
let isMuted = false;
let bgMusicInterval = null;
let bgMusicStep = 0;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Start background music loop when context is created
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      startBackgroundMusic();
    });
  }
  return audioCtx;
}

export function setMute(muteState) {
  isMuted = muteState;
  if (audioCtx && isMuted) {
    audioCtx.suspend();
    stopBackgroundMusic();
  } else if (audioCtx && !isMuted) {
    audioCtx.resume().then(() => {
      startBackgroundMusic();
    });
  }
}

// 1. Cyberpunk Ambient Music Synthesizer
export function startBackgroundMusic() {
  if (isMuted) return;
  if (bgMusicInterval) return; // Already running

  try {
    const ctx = getAudioContext();
    const notes = [110.00, 130.81, 146.83, 164.81, 220.00]; // A2, C3, D3, E3, A3 (A Minor Pentatonic mood)

    const playStep = () => {
      if (isMuted || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      // 1. Deep Space Drone (plays every 8 steps)
      if (bgMusicStep % 8 === 0) {
        const oscBass = ctx.createOscillator();
        const oscSub = ctx.createOscillator();
        const gainBass = ctx.createGain();
        const lpFilter = ctx.createBiquadFilter();

        oscBass.type = 'sawtooth';
        oscBass.frequency.setValueAtTime(55.00, now); // A1 bass note
        
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(27.50, now); // A0 Sub bass hum

        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(140, now); // Low pass filter to make it a warm hum

        gainBass.gain.setValueAtTime(0, now);
        gainBass.gain.linearRampToValueAtTime(0.04, now + 0.5); // Slow fade-in
        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 2.9); // Fade-out

        oscBass.connect(lpFilter);
        oscSub.connect(lpFilter);
        lpFilter.connect(gainBass);
        gainBass.connect(ctx.destination);

        oscBass.start(now);
        oscSub.start(now);
        oscBass.stop(now + 3.0);
        oscSub.stop(now + 3.0);
      }

      // 2. Cybernetic Arpeggiator (plays on even steps)
      if (bgMusicStep % 2 === 0) {
        const oscArp = ctx.createOscillator();
        const gainArp = ctx.createGain();
        const delay = ctx.createDelay();
        const delayGain = ctx.createGain();

        oscArp.type = 'triangle';
        // Pick a semi-random note in pentatonic scale
        const noteIndex = (bgMusicStep * 3) % notes.length;
        const multiplier = bgMusicStep % 4 === 0 ? 2 : 1; // Octave alternation
        oscArp.frequency.setValueAtTime(notes[noteIndex] * multiplier, now);

        gainArp.gain.setValueAtTime(0.015, now);
        gainArp.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        // Add soft echo/delay effect
        delay.delayTime.value = 0.15;
        delayGain.gain.value = 0.2; // Soft echoes

        oscArp.connect(gainArp);
        gainArp.connect(ctx.destination);

        // Feedback loop for delay echo
        gainArp.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(ctx.destination);

        oscArp.start(now);
        oscArp.stop(now + 0.4);
      }

      bgMusicStep++;
    };

    bgMusicInterval = setInterval(playStep, 350); // Play steps on loop
  } catch (e) {
    console.warn("Background music start failed:", e);
  }
}

export function stopBackgroundMusic() {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
}

// 2. Core wall bump sound
export function playBump() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 3. Temperature State Transition (Hum/Sweep)
export function playStateTransition(isHeating) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    if (isHeating) {
      // Rising pitch for expanding/hot
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.2);
    } else {
      // Falling pitch for contracting/cold
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
    }
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 4. Switch Click (Gate unlock)
export function playSwitch() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 5. Core Explode / Fire Crash
export function playExplosion() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.35; // 0.35s
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.35);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 6. Level Clear Chord
export function playLevelUp() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [196.00, 246.94, 293.66, 392.00]; // G Major chords (G3, B3, D4, G4)
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}
