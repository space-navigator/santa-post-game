import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [postHistory, setPostHistory] = useState<string[]>([]);

  // Clear history on game start
  useEffect(() => {
    if (gameState === 'playing') {
      setPostHistory([]);
    }
  }, [gameState]);

  const handleAddPost = (msg: string) => {
    // Keep last 5 posts for summary
    setPostHistory(prev => [msg, ...prev].slice(0, 5));
  };

  // Helper to simulate keyboard events for touch controls
  const simulateKey = useCallback((code: string, type: 'down' | 'up') => {
    const eventType = type === 'down' ? 'keydown' : 'keyup';
    const event = new KeyboardEvent(eventType, { code, bubbles: true });
    window.dispatchEvent(event);
  }, []);

  // Button handlers that prevent default behavior (scrolling/selecting)
  const bindButton = (code: string) => ({
    onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); simulateKey(code, 'down'); },
    onMouseUp: (e: React.MouseEvent) => { e.preventDefault(); simulateKey(code, 'up'); },
    onMouseLeave: (e: React.MouseEvent) => { e.preventDefault(); simulateKey(code, 'up'); },
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); simulateKey(code, 'down'); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); simulateKey(code, 'up'); },
  });

  return (
    <div className="app">
      <h1 className="title">
        POSTY OD MIKOŁAJA
      </h1>
      
      <div className="game-wrapper">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          setScore={setScore}
          addPostToHistory={handleAddPost}
        />

        {/* UI Overlay: HUD */}
        <div className="hud">
          <div className="score-box">
            ZASIĘGI: <span className="score-val">{score.toLocaleString()}</span>
          </div>

          {/* Post History (Feed) - Show only top 3 during game */}
          <div className="feed">
            {postHistory.slice(0, 3).map((msg, index) => (
              <div 
                key={index} 
                className={`post-card ${index !== 0 ? 'faded' : ''}`}
              >
                  <div className="post-header">
                    <div className="avatar"></div>
                    <div className="post-meta">
                      Santa Claus <span>• Now</span>
                    </div>
                  </div>
                  <p className="post-text">"{msg}"</p>
                  <div className="post-reactions">
                     <span>👍 {Math.floor(Math.random() * 5000) + 1}</span>
                     <span>💬 {Math.floor(Math.random() * 200) + 1}</span>
                  </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="overlay">
            <div className="modal dashed">
              <h2 className="modal-title">Zbuduj Markę Osobistą!</h2>
              <p className="modal-text">
                Jesteś Influencerem Mikołajem. <br/>
                Lecisz saniami nad korporacyjnym światem.
              </p>
              <div 
                className="btn btn-start"
                onClick={() => simulateKey('Space', 'down')}
              >
                TAPNIJ ABY ZACZĄĆ
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen - Full Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="overlay">
            <div className="modal">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>KRYZYS WIZERUNKOWY!</h2>
              
              <div className="result-box">
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Ostateczny Wynik</div>
                <div className="result-score">{score.toLocaleString()}</div>
              </div>

              {postHistory.length > 0 && (
                <div className="history-list">
                  <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'uppercase', textAlign: 'left', marginBottom: '10px' }}>Twoje wiralowe hity:</h3>
                  {postHistory.map((msg, index) => (
                    <div key={index} className="history-item">
                      <div className="post-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                         <div className="avatar" style={{ width: 16, height: 16 }}></div>
                         <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>Santa Claus</span>
                      </div>
                      <p className="history-text">"{msg}"</p>
                      <div style={{ fontSize: '10px', color: '#666', textAlign: 'right' }}>
                          🔥 {Math.floor(Math.random() * 5000) + 1000} reactions
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                className="btn btn-restart"
                onClick={(e) => {
                  e.stopPropagation(); 
                  simulateKey('Space', 'down');
                }}
              >
                PIVOT (RESTART)
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      <div className="controls-container">
        
        {/* D-Pad */}
        <div className="d-pad">
          <div className="control-spacer"></div>
          <button className="control-btn" {...bindButton('ArrowUp')}>⬆️</button>
          <div className="control-spacer"></div>
          
          <button className="control-btn" {...bindButton('ArrowLeft')}>⬅️</button>
          <div className="control-center"></div>
          <button className="control-btn" {...bindButton('ArrowRight')}>➡️</button>

          <div className="control-spacer"></div>
          <button className="control-btn" {...bindButton('ArrowDown')}>⬇️</button>
          <div className="control-spacer"></div>
        </div>

        {/* Action Button */}
        <div>
          <button 
            className="action-btn"
            {...bindButton('Space')}
          >
            <span className="action-icon">🎁</span>
            POST!
          </button>
        </div>
      </div>

      <div className="footer">
        Sterowanie: Strzałki (ruch) + Spacja (post) | Tapnij przyciski na ekranie.
      </div>
    </div>
  );
}