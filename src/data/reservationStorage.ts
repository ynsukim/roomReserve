import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from '../types/reservation';
import { isSameDay } from 'date-fns';

const RESERVATION_STORAGE_KEY = '@reservations';

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
      res.year === reservation.year &&
      res.month === reservation.month &&
      res.day === reservation.day &&
      res.hour === reservation.hour && 
      res.minute === reservation.minute
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
      const year = reservation.year;
      const month = reservation.month.toString().padStart(2, '0');
      const day = reservation.day.toString().padStart(2, '0');
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
  
    // Create data that looks like it was created by the app
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Convert to 1-12 format
    const currentDate = now.getDate();
    
    const initialData: Reservation[] = [
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${(currentDate-1).toString().padStart(2, '0')}0900-${Date.now() - 259200000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate - 1,
        hour: 9,
        minute: 0,
        duration: 60,
        name: '김영수',
      },
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${(currentDate-1).toString().padStart(2, '0')}1430-${Date.now() - 229200000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate - 1,
        hour: 14,
        minute: 30,
        duration: 90,
        name: '이지은',
      },
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${currentDate.toString().padStart(2, '0')}1100-${Date.now() - 172800000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate,
        hour: 11,
        minute: 0,
        duration: 60,
        name: '박준호',
      },
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${currentDate.toString().padStart(2, '0')}1530-${Date.now() - 158800000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate,
        hour: 15,
        minute: 30,
        duration: 30,
        name: '한서연',
      },
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${(currentDate+1).toString().padStart(2, '0')}1000-${Date.now() - 86400000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate + 1,
        hour: 10,
        minute: 0,
        duration: 120,
        name: '정현우',
      },
      {
        id: `${currentYear}${currentMonth.toString().padStart(2, '0')}${(currentDate+7).toString().padStart(2, '0')}1330-${Date.now() - 50400000}`,
        year: currentYear,
        month: currentMonth,
        day: currentDate + 7 > 28 ? 28 : currentDate + 7,  // Avoid invalid dates
        hour: 13,
        minute: 30,
        duration: 60,
        name: '최민지',
      }
    ];
    
    // Handle month boundaries for previous date
    if (currentDate === 1) {
      initialData[0].month = currentMonth === 1 ? 12 : currentMonth - 1;
      initialData[0].year = currentMonth === 1 ? currentYear - 1 : currentYear;
      initialData[0].day = currentMonth === 2 ? 28 : 30; // Simplified; doesn't handle leap years perfectly
      
      initialData[1].month = currentMonth === 1 ? 12 : currentMonth - 1;
      initialData[1].year = currentMonth === 1 ? currentYear - 1 : currentYear;
      initialData[1].day = currentMonth === 2 ? 28 : 30;
    }
    
    await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
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