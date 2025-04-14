import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from '../types/reservation';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

const RESERVATION_STORAGE_KEY = '@reservations';

const getSampleReservations = (): Reservation[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Use actual calendar dates for sample data
  return [
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}15${10}00-1`,
      date: new Date(year, month, 15, 10, 0), // 15일 10:00
      hour: 10,
      minute: 0,
      duration: 60,
      name: '김영수',
    },
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}15${14}30-2`,
      date: new Date(year, month, 15, 14, 30), // 15일 14:30
      hour: 14,
      minute: 30,
      duration: 90,
      name: '이지은',
    },
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}16${9}00-3`,
      date: new Date(year, month, 16, 9, 0), // 16일 9:00
      hour: 9,
      minute: 0,
      duration: 120,
      name: '박준호',
    },
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}17${11}00-4`,
      date: new Date(year, month, 17, 11, 0), // 17일 11:00
      hour: 11,
      minute: 0,
      duration: 30,
      name: '최민지',
    },
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}18${15}00-5`,
      date: new Date(year, month, 18, 15, 0), // 18일 15:00
      hour: 15,
      minute: 0,
      duration: 60,
      name: '정현우',
    },
    {
      id: `${year}${(month+1).toString().padStart(2, '0')}19${13}30-6`,
      date: new Date(year, month, 19, 13, 30), // 19일 13:30
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
    if (reservation.id.includes('-') && !reservation.id.includes('-2')) {
      const date = reservation.date;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = reservation.hour.toString().padStart(2, '0');
      const minute = reservation.minute.toString().padStart(2, '0');
      
      return {
        ...reservation,
        id: `${year}${month}${day}${hour}${minute}-${Date.now()}`
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
      // Add new reservation with a unique ID based on actual date
      const date = reservation.date;
      const year = date.getFullYear();
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