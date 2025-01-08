export interface Station {
  x: number;
  y: number;
  type: 'circle' | 'square' | 'triangle';
  passengers: number;
}