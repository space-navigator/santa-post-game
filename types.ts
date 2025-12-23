export type GameState = 'start' | 'playing' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity extends Position, Size {
  vx: number;
  vy: number;
  color: string;
  type: string;
  markedForDeletion: boolean;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export interface GameScore {
  reach: number; // "Zasięgi"
}

export type ObstacleType = 'ghost' | 'invite' | 'coach' | 'toxic';
