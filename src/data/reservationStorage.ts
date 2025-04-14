import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from '../types/reservation';
import { startOfWeek, addDays } from 'date-fns';

const RESERVATION_STORAGE_KEY = '@reservations';

const getSampleReservations = (): Reservation[] => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const today = new Date();
  
  return [
    {
      id: 'res-1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      date: addDays(weekStart, 0), // Monday
      hour: 10,
      minute: 0,
      duration: 60,
      name: '김영수',
    },
    {
      id: 'res-2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
      date: addDays(weekStart, 0), // Monday
      hour: 14,
      minute: 30,
      duration: 90,
      name: '이지은',
    },
    {
      id: 'res-3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
      date: addDays(weekStart, 1), // Tuesday
      hour: 9,
      minute: 0,
      duration: 120,
      name: '박준호',
    },
    {
      id: 'res-4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
      date: addDays(weekStart, 2), // Wednesday
      hour: 11,
      minute: 0,
      duration: 30,
      name: '최민지',
    },
    {
      id: 'res-5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
      date: addDays(weekStart, 3), // Thursday
      hour: 15,
      minute: 0,
      duration: 60,
      name: '정현우',
    },
    {
      id: 'res-6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u',
      date: addDays(weekStart, 4), // Friday
      hour: 13,
      minute: 30,
      duration: 90,
      name: '한서연',
    },
  ];
};

export const saveReservation = async (reservation: Reservation) => {
  try {
    const existingReservations = await getReservations();
    const updatedReservations = [...existingReservations, reservation];
    await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(updatedReservations));
  } catch (error) {
    console.error('Error saving reservation:', error);
  }
};

export const getReservations = async (): Promise<Reservation[]> => {
  try {
    const reservationsJson = await AsyncStorage.getItem(RESERVATION_STORAGE_KEY);
    if (reservationsJson) {
      const reservations = JSON.parse(reservationsJson);
      // Convert date strings back to Date objects
      return reservations.map((res: any) => ({
        ...res,
        date: new Date(res.date)
      }));
    }
    
    // If no reservations exist, save and return sample data
    const sampleReservations = getSampleReservations();
    await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(sampleReservations));
    return sampleReservations;
  } catch (error) {
    console.error('Error getting reservations:', error);
    return [];
  }
};

export const deleteReservation = async (reservationId: string) => {
  try {
    const existingReservations = await getReservations();
    const updatedReservations = existingReservations.filter(res => res.id !== reservationId);
    await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(updatedReservations));
  } catch (error) {
    console.error('Error deleting reservation:', error);
  }
}; 