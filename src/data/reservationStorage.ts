import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from '../types/reservation';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

const RESERVATION_STORAGE_KEY = '@reservations';

const getSampleReservations = (): Reservation[] => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const today = new Date();
  
  return [
    {
      id: '2402151000-1',
      date: addDays(weekStart, 0), // Monday
      hour: 10,
      minute: 0,
      duration: 60,
      name: '김영수',
    },
    {
      id: '2402151430-2',
      date: addDays(weekStart, 0), // Monday
      hour: 14,
      minute: 30,
      duration: 90,
      name: '이지은',
    },
    {
      id: '2402160900-3',
      date: addDays(weekStart, 1), // Tuesday
      hour: 9,
      minute: 0,
      duration: 120,
      name: '박준호',
    },
    {
      id: '2402171100-4',
      date: addDays(weekStart, 2), // Wednesday
      hour: 11,
      minute: 0,
      duration: 30,
      name: '최민지',
    },
    {
      id: '2402181500-5',
      date: addDays(weekStart, 3), // Thursday
      hour: 15,
      minute: 0,
      duration: 60,
      name: '정현우',
    },
    {
      id: '2402191330-6',
      date: addDays(weekStart, 4), // Friday
      hour: 13,
      minute: 30,
      duration: 90,
      name: '한서연',
    },
  ];
};

const migrateReservationIds = (reservations: Reservation[]): Reservation[] => {
  return reservations.map(reservation => {
    // Check if the ID has the old format (contains hyphens)
    if (reservation.id.includes('-')) {
      const date = reservation.date;
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = reservation.hour.toString().padStart(2, '0');
      const minute = reservation.minute.toString().padStart(2, '0');
      
      return {
        ...reservation,
        id: `${year}${month}${day}${hour}${minute}`
      };
    }
    return reservation;
  });
};

export const saveReservation = async (reservation: Reservation) => {
  try {
    const existingReservations = await getReservations();
    
    // Check if this reservation already exists (by ID or by same time slot)
    const existingIndex = existingReservations.findIndex(res => 
      (isSameDay(res.date, reservation.date) && 
       res.hour === reservation.hour && 
       res.minute === reservation.minute)
    );
    
    let updatedReservations;
    if (existingIndex >= 0) {
      // Update existing reservation
      updatedReservations = [...existingReservations];
      // Preserve the original ID when updating
      updatedReservations[existingIndex] = {
        ...reservation,
        id: existingReservations[existingIndex].id
      };
    } else {
      // Add new reservation with a unique ID
      const date = reservation.date;
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = reservation.hour.toString().padStart(2, '0');
      const minute = reservation.minute.toString().padStart(2, '0');
      const uniqueId = `${year}${month}${day}${hour}${minute}-${Date.now()}`;
      
      updatedReservations = [...existingReservations, {
        ...reservation,
        id: uniqueId
      }];
    }
    
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
      const parsedReservations = reservations.map((res: any) => ({
        ...res,
        date: new Date(res.date)
      }));
      
      // Migrate old ID format to new format
      const migratedReservations = migrateReservationIds(parsedReservations);
      
      // Save migrated reservations if there were changes
      if (JSON.stringify(parsedReservations) !== JSON.stringify(migratedReservations)) {
        await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(migratedReservations));
      }
      
      return migratedReservations;
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

export const clearAllReservations = async () => {
  try {
    await AsyncStorage.removeItem(RESERVATION_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing reservations:', error);
    return false;
  }
}; 