export interface Line {
  stations: Station[];
  color: string;
  controlPoints?: Array<{x: number, y: number}>;
}