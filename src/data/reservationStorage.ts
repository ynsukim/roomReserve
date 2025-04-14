import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from '../types/reservation';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

const RESERVATION_STORAGE_KEY = '@reservations';

const getSampleReservations = (): Reservation[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  
  // Create timestamps that look like they were created at various times
  const threeDaysAgoTimestamp = Date.now() - (3 * 24 * 60 * 60 * 1000);
  const oneDayAgoTimestamp = Date.now() - (24 * 60 * 60 * 1000);
  const weekAgoTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgoTimestamp = Date.now() - (14 * 24 * 60 * 60 * 1000);
  
  // Calculate last month and next month
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear = currentYear - 1;
  }
  
  let nextMonth = currentMonth + 1;
  let nextMonthYear = currentYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextMonthYear = currentYear + 1;
  }
  
  const sampleData: Reservation[] = [];
  
  // Past reservations (last month)
  sampleData.push({
    id: `${lastMonthYear}${(lastMonth+1).toString().padStart(2, '0')}25${10}00-${twoWeeksAgoTimestamp}`,
    date: new Date(lastMonthYear, lastMonth, 25, 10, 0),
    hour: 10,
    minute: 0,
    duration: 60,
    name: '김영수',
  });
  
  // Past reservations (earlier this month)
  if (currentDate > 5) {
    sampleData.push({
      id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}05${14}30-${weekAgoTimestamp}`,
      date: new Date(currentYear, currentMonth, 5, 14, 30),
      hour: 14,
      minute: 30,
      duration: 90,
      name: '이지은',
    });
  }
  
  // Yesterday's reservations
  if (currentDate > 1) {
    const yesterday = currentDate - 1;
    sampleData.push({
      id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${yesterday.toString().padStart(2, '0')}${13}00-${oneDayAgoTimestamp}`,
      date: new Date(currentYear, currentMonth, yesterday, 13, 0),
      hour: 13,
      minute: 0,
      duration: 60,
      name: '박준호',
    });
  }
  
  // Today's reservations
  sampleData.push({
    id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${currentDate.toString().padStart(2, '0')}${9}00-${threeDaysAgoTimestamp}`,
    date: new Date(currentYear, currentMonth, currentDate, 9, 0),
    hour: 9,
    minute: 0,
    duration: 120,
    name: '최민지',
  });
  
  // Current ongoing reservation if it's between 14:00-15:00
  const currentHour = today.getHours();
  if (currentHour >= 14 && currentHour < 15) {
    sampleData.push({
      id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${currentDate.toString().padStart(2, '0')}${14}00-${Date.now() - 3600000}`, // 1 hour ago
      date: new Date(currentYear, currentMonth, currentDate, 14, 0),
      hour: 14,
      minute: 0,
      duration: 60,
      name: '홍길동',
    });
  } else {
    // Future reservation today
    sampleData.push({
      id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${currentDate.toString().padStart(2, '0')}${15}30-${Date.now() - 7200000}`, // 2 hours ago
      date: new Date(currentYear, currentMonth, currentDate, 15, 30),
      hour: 15,
      minute: 30,
      duration: 60,
      name: '김철수',
    });
  }
  
  // Future reservations (next 3 days)
  const day1 = currentDate + 1 > 28 ? 28 : currentDate + 1;
  const day2 = currentDate + 2 > 28 ? 28 : currentDate + 2;
  const day3 = currentDate + 3 > 28 ? 28 : currentDate + 3;
  
  sampleData.push({
    id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${day1.toString().padStart(2, '0')}${11}00-${Date.now() - 10800000}`, // 3 hours ago
    date: new Date(currentYear, currentMonth, day1, 11, 0),
    hour: 11,
    minute: 0,
    duration: 30,
    name: '정현우',
  });
  
  sampleData.push({
    id: `${currentYear}${(currentMonth+1).toString().padStart(2, '0')}${day2.toString().padStart(2, '0')}${16}00-${Date.now() - 18000000}`, // 5 hours ago
    date: new Date(currentYear, currentMonth, day2, 16, 0),
    hour: 16,
    minute: 0,
    duration: 120,
    name: '한서연',
  });
  
  // Next month reservation
  sampleData.push({
    id: `${nextMonthYear}${(nextMonth+1).toString().padStart(2, '0')}05${10}30-${Date.now() - 86400000}`, // 1 day ago
    date: new Date(nextMonthYear, nextMonth, 5, 10, 30),
    hour: 10,
    minute: 30,
    duration: 90,
    name: '이미래',
  });
  
  return sampleData;
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