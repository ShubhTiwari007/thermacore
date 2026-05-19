// src/components/LobbyUI.jsx
import React from 'react';

function LobbyUI({ unlockedLevel, onLaunch, mute, setMute }) {
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="glass-panel" style={{ width: '90%', maxWidth: '520px', textAlign: 'center', boxSizing: 'border-box' }}>
      
      {/* Sound & Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ width: '40px' }} /> {/* Spacer */}
        <div className="level-badge" style={{ color: '#ff5e00', borderColor: 'rgba(255, 94, 0, 0.4)', background: 'rgba(255, 94, 0, 0.1)' }}>THERMAL GRID</div>
        <button 
          className="sound-toggle-btn" 
          onClick={() => setMute(!mute)}
          title={mute ? "Unmute Audio" : "Mute Audio"}
        >
          {mute ? (
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      </div>

      <h1 className="neon-title" style={{ fontSize: 'clamp(28px, 6vw, 42px)', marginBottom: '4px' }}>
        THERMACORE
      </h1>
      <p style={{ color: '#ff0055', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 20px 0' }}>
        Expansion & Contraction Maze
      </p>

      {/* Description */}
      <div style={{ background: 'rgba(15, 6, 3, 0.65)', border: '1px solid rgba(255, 94, 0, 0.12)', borderRadius: '8px', padding: '14px', marginBottom: '24px', fontSize: '13px', textAlign: 'left', lineHeight: '1.6', color: '#bca8a0' }}>
        <strong style={{ color: '#ff5e00' }}>MISSION:</strong> Guide the core to the target reactor.
        <br />
        <strong style={{ color: '#ff0055' }}>MECHANIC:</strong> Core expands when hot (orange fire vents) and shrinks when cold (blue ice zones). Heavy/Hot state triggers pressure buttons, while Slim/Cold state fits through micro channels. Avoid high-voltage red sparks!
        <br />
        <strong style={{ color: '#60efff' }}>CONTROLS:</strong> Move with <strong style={{ color: '#fff' }}>[W, A, S, D]</strong> or the keyboard <strong style={{ color: '#fff' }}>[ARROWS]</strong>. Mobile players can use the HUD D-Pad buttons.
      </div>

      {/* Level Select Grid */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#8e7165', textTransform: 'uppercase', marginBottom: '10px' }}>SELECT CORE CELL</div>
        <div className="level-grid">
          {levels.map((lvl) => {
            const isUnlocked = lvl <= unlockedLevel;
            return (
              <button
                key={lvl}
                className={`level-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                onClick={() => isUnlocked && onLaunch(lvl)}
                disabled={!isUnlocked}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#776155' }}>
        ✦ Shift thermal structures by altering your molecular volume ✦
      </div>
    </div>
  );
}

export default LobbyUI;
