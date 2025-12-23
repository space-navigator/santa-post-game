import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState } from './types';
import { COLORS } from './constants';

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
    // Keep last 5 posts for summary, but HUD might show less
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-2 font-mono text-slate-100 select-none overflow-hidden overscroll-none touch-none">
      <h1 className="text-3xl md:text-5xl font-bold mb-2 text-center text-red-500 tracking-tighter drop-shadow-lg" style={{textShadow: '3px 3px 0 #000'}}>
        POSTY OD MIKOŁAJA
      </h1>
      
      <div className="relative">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          setScore={setScore}
          addPostToHistory={handleAddPost}
        />

        {/* UI Overlay: HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-slate-900/80 p-2 md:p-3 border-2 border-slate-600 text-sm md:text-xl font-bold uppercase tracking-widest backdrop-blur-sm">
            ZASIĘGI: <span className="text-green-400">{score.toLocaleString()}</span>
          </div>

          {/* Post History (Feed) - Show only top 3 during game */}
          <div className="flex flex-col gap-2 md:gap-3 w-48 md:w-[25rem]">
            {postHistory.slice(0, 3).map((msg, index) => (
              <div 
                key={index} 
                className={`bg-white text-slate-900 border-2 md:border-4 border-blue-600 p-2 md:p-4 shadow-xl animate-in fade-in slide-in-from-right-10 duration-300 ${index === 0 ? 'opacity-100 scale-100' : 'opacity-80 scale-95 hidden md:block'}`}
              >
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 border-b border-gray-300 pb-1 md:pb-2">
                    <div className="w-6 h-6 md:w-10 md:h-10 bg-gray-300 rounded-full"></div>
                    <div className="text-[10px] md:text-sm text-left font-bold text-gray-600 leading-tight">
                      Santa Claus <span className="text-gray-400 font-normal">• Now</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-lg font-bold leading-snug">"{msg}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
            <div className="text-center p-6 border-4 border-dashed border-red-500 max-w-sm md:max-w-lg bg-slate-900 mx-4">
              <h2 className="text-xl md:text-2xl mb-4 text-green-400 uppercase">Zbuduj Markę Osobistą!</h2>
              <p className="mb-4 text-sm md:text-lg">
                Jesteś Influencerem Mikołajem. <br/>
                Lecisz saniami nad korporacyjnym światem.
              </p>
              <div className="animate-pulse bg-red-600 text-white py-3 px-6 text-lg md:text-2xl font-bold border-b-4 border-red-800 inline-block cursor-pointer shadow-lg hover:scale-105 transition-transform"
                   onClick={() => simulateKey('Space', 'down')}>
                TAPNIJ ABY ZACZĄĆ
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen - Full Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 z-50 p-4 animate-in fade-in duration-300">
            <div className="flex flex-col items-center max-w-2xl w-full max-h-full overflow-y-auto p-4 md:p-8 border-4 border-white bg-slate-900 shadow-2xl">
              <h2 className="text-3xl md:text-5xl mb-4 text-red-500 font-bold uppercase text-center drop-shadow-md">KRYZYS WIZERUNKOWY!</h2>
              
              <div className="w-full mb-6 p-4 bg-slate-800 border border-slate-600 text-center rounded">
                <div className="text-sm md:text-base text-slate-400 uppercase tracking-widest mb-1">Ostateczny Wynik (Zasięgi)</div>
                <div className="text-4xl md:text-6xl text-green-400 font-bold">{score.toLocaleString()}</div>
              </div>

              {postHistory.length > 0 && (
                <div className="w-full mb-6">
                  <h3 className="text-center text-slate-300 mb-3 uppercase tracking-wider text-sm font-bold">Twoje wiralowe hity:</h3>
                  <div className="flex flex-col gap-3">
                    {postHistory.map((msg, index) => (
                      <div key={index} className="bg-white text-slate-900 border-l-8 border-blue-600 p-3 shadow-md rounded-r">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                           <span className="text-xs font-bold text-gray-500">Santa Claus</span>
                        </div>
                        <p className="text-sm md:text-base font-bold italic">"{msg}"</p>
                        <div className="mt-1 text-[10px] text-gray-500 flex justify-end">
                            <span>🔥 {Math.floor(Math.random() * 5000) + 1000} reactions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="mt-auto animate-pulse bg-blue-600 text-white py-4 px-8 text-xl md:text-2xl font-bold border-b-8 border-blue-800 rounded hover:scale-105 active:border-b-0 active:translate-y-2 transition-all w-full md:w-auto text-center shadow-lg uppercase"
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
      <div className="w-full max-w-[800px] mt-4 grid grid-cols-2 gap-4 px-4 touch-none pb-8">
        
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 w-32 h-32 mx-auto md:ml-0">
          <div></div>
          <button 
            className="bg-slate-700 border-b-4 border-slate-900 rounded active:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-2xl"
            {...bindButton('ArrowUp')}
          >⬆️</button>
          <div></div>
          
          <button 
            className="bg-slate-700 border-b-4 border-slate-900 rounded active:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-2xl"
            {...bindButton('ArrowLeft')}
          >⬅️</button>
          <div className="bg-slate-800 rounded-full opacity-50"></div>
          <button 
            className="bg-slate-700 border-b-4 border-slate-900 rounded active:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-2xl"
            {...bindButton('ArrowRight')}
          >➡️</button>

          <div></div>
          <button 
            className="bg-slate-700 border-b-4 border-slate-900 rounded active:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-2xl"
            {...bindButton('ArrowDown')}
          >⬇️</button>
          <div></div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-center">
          <button 
            className="w-full h-24 max-w-[200px] bg-red-600 border-b-8 border-red-900 rounded-xl text-white font-bold text-xl uppercase active:bg-red-500 active:border-b-0 active:translate-y-2 transition-all shadow-lg flex flex-col items-center justify-center gap-1"
            {...bindButton('Space')}
          >
            <span className="text-3xl">🎁</span>
            POST!
          </button>
        </div>
      </div>

      <div className="mt-2 text-[10px] md:text-xs text-slate-500 text-center px-4">
        Sterowanie: Strzałki (ruch) + Spacja (post) | Tapnij przyciski na ekranie.
      </div>
    </div>
  );
}