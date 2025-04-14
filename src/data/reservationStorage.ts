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
    
    // If no reservations exist, return an empty array
    return [];
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