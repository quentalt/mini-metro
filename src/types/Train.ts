export interface Train {
  lineIndex: number;
  position: number;
  direction: 1 | -1;
  passengers: Array<'circle' | 'square' | 'triangle'>;
  capacity: number;
  deliveredPassengers: number;
  showDeliveryEffect: boolean;
}