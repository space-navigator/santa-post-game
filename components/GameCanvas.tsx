import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCROLL_SPEED, PLAYER_SPEED, POST_FALL_SPEED, LINKEDIN_POSTS, OBSTACLE_LABELS } from '../constants';
import { Entity, Particle, GameState } from '../types';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  addPostToHistory: (msg: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, addPostToHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Game State Refs (mutable for loop performance)
  const santaRef = useRef<Entity>({ x: 50, y: 100, width: 40, height: 20, vx: 0, vy: 0, color: COLORS.santa, type: 'santa', markedForDeletion: false });
  const postsRef = useRef<Entity[]>([]);
  const obstaclesRef = useRef<Entity[]>([]);
  const targetsRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const frameCountRef = useRef(0);

  // Input state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const spawnObstacle = () => {
    const types = ['ghost', 'invite', 'coach', 'toxic'];
    const type = types[Math.floor(Math.random() * types.length)];
    const yPos = Math.random() * (CANVAS_HEIGHT - 150); // Air obstacles
    obstaclesRef.current.push({
      x: CANVAS_WIDTH + 50,
      y: yPos,
      width: 40,
      height: 40,
      vx: -SCROLL_SPEED,
      vy: 0,
      color: '#a855f7', // Purple-ish
      type: type,
      markedForDeletion: false
    });
  };

  const spawnTarget = () => {
    // Targets are on the ground
    targetsRef.current.push({
      x: CANVAS_WIDTH + 50,
      y: CANVAS_HEIGHT - 60, // On ground
      width: 30,
      height: 50,
      vx: -SCROLL_SPEED,
      vy: 0,
      color: '#94a3b8', // Slate 400 (Grey follower)
      type: 'target',
      markedForDeletion: false
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        width: 4, height: 4,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color,
        type: 'particle',
        markedForDeletion: false,
        life: 1.0,
        maxLife: 1.0
      });
    }
  };

  const resetGame = () => {
    santaRef.current = { x: 50, y: 200, width: 40, height: 24, vx: 0, vy: 0, color: COLORS.santa, type: 'santa', markedForDeletion: false };
    postsRef.current = [];
    obstaclesRef.current = [];
    targetsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    scrollOffsetRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
    // Note: History is cleared in parent component when state changes to playing
  };

  const checkCollision = (rect1: Entity, rect2: Entity) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    frameCountRef.current++;
    scrollOffsetRef.current += SCROLL_SPEED;

    // Vertical Movement
    if (keysRef.current['ArrowUp']) santaRef.current.y -= PLAYER_SPEED;
    if (keysRef.current['ArrowDown']) santaRef.current.y += PLAYER_SPEED;
    
    // Horizontal Movement
    if (keysRef.current['ArrowLeft']) santaRef.current.x -= PLAYER_SPEED;
    if (keysRef.current['ArrowRight']) santaRef.current.x += PLAYER_SPEED;

    // Boundaries
    if (santaRef.current.y < 0) santaRef.current.y = 0;
    if (santaRef.current.y > CANVAS_HEIGHT - 100) santaRef.current.y = CANVAS_HEIGHT - 100;
    
    // X Boundaries
    if (santaRef.current.x < 0) santaRef.current.x = 0;
    if (santaRef.current.x > CANVAS_WIDTH - santaRef.current.width) santaRef.current.x = CANVAS_WIDTH - santaRef.current.width;

    // Spawning
    if (frameCountRef.current % 120 === 0) spawnObstacle();
    if (frameCountRef.current % 180 === 0) spawnTarget();

    // Update Posts (Bullets)
    postsRef.current.forEach(post => {
      post.y += POST_FALL_SPEED; // Fall down
      post.x -= SCROLL_SPEED; // Move with world slightly
      if (post.y > CANVAS_HEIGHT) post.markedForDeletion = true;
    });

    // Update Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.x += obs.vx;
      if (obs.x < -100) obs.markedForDeletion = true;

      // Player Collision
      if (checkCollision(santaRef.current, obs)) {
        audioService.playCrash();
        setGameState('gameover');
      }
    });

    // Update Targets
    targetsRef.current.forEach(target => {
      target.x += target.vx;
      if (target.x < -100) target.markedForDeletion = true;

      // Post Collision with Target
      postsRef.current.forEach(post => {
        if (!post.markedForDeletion && !target.markedForDeletion && checkCollision(post, target)) {
          post.markedForDeletion = true;
          target.markedForDeletion = true;
          createParticles(target.x, target.y, '#22c55e', 10); // Success particles
          
          scoreRef.current += 1000;
          setScore(scoreRef.current);
          audioService.playScore();

          const randomMsg = LINKEDIN_POSTS[Math.floor(Math.random() * LINKEDIN_POSTS.length)];
          addPostToHistory(randomMsg);
        }
      });
    });

    // Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    // Cleanup
    postsRef.current = postsRef.current.filter(e => !e.markedForDeletion);
    obstaclesRef.current = obstaclesRef.current.filter(e => !e.markedForDeletion);
    targetsRef.current = targetsRef.current.filter(e => !e.markedForDeletion);
    particlesRef.current = particlesRef.current.filter(e => !e.markedForDeletion);

  }, [gameState, setGameState, setScore, addPostToHistory]);

  const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  };

  // Sprite drawing helpers
  const drawSanta = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Sled
    drawPixelRect(ctx, x, y + 15, 40, 10, COLORS.sled);
    drawPixelRect(ctx, x + 5, y + 25, 30, 3, '#92400e'); // runners
    // Santa Body
    drawPixelRect(ctx, x + 10, y, 20, 15, COLORS.santa);
    // Face
    drawPixelRect(ctx, x + 20, y + 2, 8, 8, '#fca5a5');
    // Beard
    drawPixelRect(ctx, x + 20, y + 10, 10, 8, '#ffffff');
    // Hat
    drawPixelRect(ctx, x + 10, y - 5, 20, 5, COLORS.santa);
    drawPixelRect(ctx, x + 30, y - 2, 5, 5, '#ffffff'); // pompom
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Entity) => {
    // Base shape
    drawPixelRect(ctx, obs.x, obs.y, obs.width, obs.height, obs.color);
    // Inner details based on type
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    // Simple pixel art simulation for icons
    if (obs.type === 'ghost') {
       drawPixelRect(ctx, obs.x + 10, obs.y + 10, 5, 5, 'black'); // eyes
       drawPixelRect(ctx, obs.x + 25, obs.y + 10, 5, 5, 'black');
    } else if (obs.type === 'invite') {
       drawPixelRect(ctx, obs.x + 5, obs.y + 15, 30, 10, 'white'); // Envelope
    }
  };

  const drawTarget = (ctx: CanvasRenderingContext2D, t: Entity) => {
    // Building or Follower
    drawPixelRect(ctx, t.x, t.y, t.width, t.height, t.color);
    // "Open to work" ring
    ctx.strokeStyle = '#22c55e'; // Green ring
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x + t.width/2, t.y + 10, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Head
    drawPixelRect(ctx, t.x + 10, t.y + 5, 10, 10, '#e2e8f0');
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    // Draw "Moving" Stars/Snow
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
        const starX = ((i * 50) - (scrollOffsetRef.current * 0.5)) % CANVAS_WIDTH;
        const actualX = starX < 0 ? CANVAS_WIDTH + starX : starX;
        drawPixelRect(ctx, actualX, (i * 30) % (CANVAS_HEIGHT - 100), 2, 2, 'white');
    }

    // Draw Santa
    drawSanta(ctx, santaRef.current.x, santaRef.current.y);

    // Draw Entities
    postsRef.current.forEach(p => drawPixelRect(ctx, p.x, p.y, p.width, p.height, '#fcd34d')); // Gold Present
    targetsRef.current.forEach(t => drawTarget(ctx, t));
    obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
    particlesRef.current.forEach(p => drawPixelRect(ctx, p.x, p.y, p.width, p.height, p.color));

  }, []);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault(); 
        if (gameState === 'playing') {
          // Drop Post
          postsRef.current.push({
            x: santaRef.current.x + 10,
            y: santaRef.current.y + 20,
            width: 20,
            height: 20,
            vx: 0,
            vy: POST_FALL_SPEED,
            color: '#fcd34d',
            type: 'post',
            markedForDeletion: false
          });
          audioService.playShoot();
        } else if (gameState === 'start' || gameState === 'gameover') {
           resetGame();
           setGameState('playing');
           audioService.init();
           audioService.resume();
           audioService.startBGM();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, setGameState]);

  // Loop Lifecycle
  useEffect(() => {
    if (gameState === 'playing') {
        requestRef.current = requestAnimationFrame(loop);
    } else {
        // Draw one frame even if paused/stopped to show state
        draw();
        audioService.stopBGM();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, loop, draw]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT}
      className="border-4 border-slate-700 shadow-2xl rounded-sm pixelated max-w-full h-auto"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};