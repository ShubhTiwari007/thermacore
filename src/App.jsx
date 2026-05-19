// src/App.jsx
import React, { useState, useEffect } from 'react';
import LobbyUI from './components/LobbyUI';
import GameCanvas from './components/GameCanvas';
import { setMute } from './utils/audio';
import {
  requestMidgameAd,
  signalGameplayStart,
  signalGameplayStop,
  triggerHappytime,
  saveData,
  loadData
} from './utils/crazyGamesSDK';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'clear'
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(() => parseInt(loadData('thermacore_lvl_unlocked') || '1'));
  const [mute, setMuteState] = useState(() => loadData('thermacore_mute') === 'true');
  const [adActive, setAdActive] = useState(false);

  useEffect(() => {
    // Sync mute status
    setMute(mute);
    saveData('thermacore_mute', mute);
  }, [mute]);

  const handleLaunchGame = (selectedLevel = 1) => {
    setLevel(selectedLevel);
    setGameState('playing');
    signalGameplayStart();
  };

  const handleLevelClear = () => {
    signalGameplayStop();
    triggerHappytime();

    // Unlock next level
    if (level === unlockedLevel && unlockedLevel < 10) {
      const nextLvl = unlockedLevel + 1;
      setUnlockedLevel(nextLvl);
      saveData('thermacore_lvl_unlocked', nextLvl);
    }
    setGameState('clear');
  };

  const handleNextLevel = () => {
    const startNextLevel = () => {
      setLevel(prev => prev + 1);
      setGameState('playing');
      signalGameplayStart();
    };

    if (level >= 10) {
      // Loop back or menu
      setGameState('menu');
      return;
    }

    // Trigger Midgame ad before next level
    setAdActive(true);
    setMute(true); // Mute during ads

    requestMidgameAd({
      adStarted: () => {
        console.log("Ad break started.");
      },
      adFinished: () => {
        setAdActive(false);
        setMute(mute); // restore user mute status
        startNextLevel();
      },
      adError: () => {
        setAdActive(false);
        setMute(mute); // restore user mute status
        startNextLevel();
      }
    });
  };

  const handleQuitGame = () => {
    signalGameplayStop();
    setGameState('menu');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#030205', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. Play Screen Viewport */}
      {gameState === 'playing' && !adActive && (
        <div style={{ width: '100%', height: '100%' }}>
          <GameCanvas 
            level={level}
            onLevelClear={handleLevelClear}
            onQuit={handleQuitGame}
          />
        </div>
      )}

      {/* 2. Cockpit Lobby menu */}
      {gameState === 'menu' && !adActive && (
        <LobbyUI 
          unlockedLevel={unlockedLevel}
          onLaunch={handleLaunchGame}
          mute={mute}
          setMute={setMuteState}
        />
      )}

      {/* 3. Level Clear overlay splash */}
      {gameState === 'clear' && !adActive && (
        <div className="screen" style={{ background: 'rgba(3, 2, 5, 0.95)', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', textAlign: 'center' }}>
            <h1 className="neon-title" style={{ fontSize: '28px', color: '#ff5e00', textShadow: '0 0 15px rgba(255, 94, 0, 0.5)' }}>
              CELL STABILIZED!
            </h1>
            <div className="level-badge" style={{ marginTop: '12px', background: 'rgba(255, 94, 0, 0.1)', borderColor: 'rgba(255, 94, 0, 0.4)', color: '#ff5e00' }}>
              REACTOR {level} ENGAGED
            </div>
            
            <p style={{ color: '#bca8a0', fontSize: '13px', margin: '20px 0' }}>
              ✦ Core thermal volume equilibrium achieved successfully ✦
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-cyber" onClick={handleNextLevel}>
                {level >= 10 ? 'FINISH' : 'NEXT CELL →'}
              </button>
              <button className="btn-cyber secondary" onClick={() => setGameState('menu')}>
                COCKPIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full screen Ad Block Overlay */}
      {adActive && (
        <div className="screen" style={{ background: '#020103', zIndex: 9999 }}>
          <div style={{ textAlign: 'center', fontFamily: 'Orbitron' }}>
            <div className="level-badge" style={{ color: '#ff5e00', borderColor: '#ff5e00', background: 'rgba(255, 94, 0, 0.1)' }}>CELL FLUX AD BREAK</div>
            <h2 className="neon-title-ice" style={{ fontSize: '24px', marginTop: '15px' }}>SYNCHRONIZING CORE DATA...</h2>
            <p style={{ color: '#776155', fontSize: '12px', marginTop: '10px' }}>Core state stabilization will complete in a moment.</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
