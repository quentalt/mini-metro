export interface GameState {
  score: number;
  gameOver: boolean;
  day: number;
  timeUntilNextDay: number;
  stationOverflowCount: number;
}