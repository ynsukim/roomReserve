export interface ReservationProps {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status: 'past' | 'current' | 'future';
}

export const initialReservations: ReservationProps[] = [
  {
    id: '1',
    name: '홍길동',
    startTime: new Date(2025, 2, 23, 10, 0),
    endTime: new Date(2025, 2, 23, 11, 0),
    status: 'past'
  },
  {
    id: '2',
    name: '김갑환',
    startTime: new Date(2025, 2, 24, 10, 0),
    endTime: new Date(2025, 2, 24, 11, 0),
    status: 'current'
  },
  {
    id: '3',
    name: '홍길동',
    startTime: new Date(2025, 2, 26, 9, 0),
    endTime: new Date(2025, 2, 26, 10, 30),
    status: 'future'
  },
  {
    id: '4',
    name: '김삼순',
    startTime: new Date(2025, 2, 27, 10, 0),
    endTime: new Date(2025, 2, 27, 11, 30),
    status: 'future'
  }
]; 