export type DayType = 'MON-THU' | 'FRIDAY' | 'D-DAY';

export interface BusRoute {
  id: number;
  name: string;
  stops: string[];  // List of stops in order
}

export interface BusStation {
  id: number;
  name: string;
  platform: string;
  exitNumber?: string;  // Optional exit number
}

export interface BusSchedule {
  id: number;
  stationId: number;
  dayType: DayType;
  departureTime: string;
  busId: number;  // Reference to the bus
}

export interface Bus {
  id: number;
  routeId: number;
  destination: string;
  station: BusStation;
}

export interface BusDestination {
  id: number;
  name: string;
  stations: BusStation[];
  route: BusRoute;
} 