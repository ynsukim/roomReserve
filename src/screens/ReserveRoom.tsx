import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Pressable
} from 'react-native';
import type {
  ViewStyle,
  TextStyle,
  ScrollView as ScrollViewType,
  TouchableOpacity as TouchableOpacityType,
} from 'react-native';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isWeekend, isSameWeek } from 'date-fns';
import { reservations } from '../data/reservations.js';
import { ReservationProps, initialReservations } from '../data/reservations';
import ReservationPopup from '../components/ReservationPopup';

interface SelectedSlot {
  hour: number;
  minute: number;
  dayIndex: number;
  date: Date;
  duration: number; // in minutes
}

const ReserveRoom = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [reservations, setReservations] = useState<ReservationProps[]>(initialReservations);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectionSlotActive, setSelectionSlotActive] = useState(false);
  const [showReservationPopup, setShowReservationPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollViewRef = React.useRef<ScrollViewType>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const lastTouchY = React.useRef(0);
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = (e: GestureResponderEvent) => {
    console.log('🔴 Touch Start on drag handle');
    setIsDragging(true);
    setIsPressed(true);
    lastTouchY.current = e.nativeEvent.pageY;
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (!isDragging || !selectedSlot) return;
    
    const touchY = e.nativeEvent.pageY;
    const deltaY = touchY - lastTouchY.current;
    const additionalSlots = Math.round(deltaY / 60);
    const newDuration = Math.max(30, Math.min(240, selectedSlot.duration + (additionalSlots * 30)));

    console.log('🔴 Drag handle moved - New Duration:', newDuration);

    setSelectedSlot(prev => prev ? {
      ...prev,
      duration: newDuration
    } : null);

    lastTouchY.current = touchY;
  };

  const handleTouchEnd = () => {
    console.log('🔴 Touch End on drag handle');
    setIsDragging(false);
    setIsPressed(false);
  };

  useEffect(() => {
    console.log('Scroll enabled state changed:', !isDragging);
  }, [isDragging]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Scroll to current time when component mounts or week changes
  useEffect(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const today = new Date();
    
    // Only scroll if we're in the current week and within business hours
    if (hour >= 8 && hour <= 20 && isSameWeek(today, weekStart, { weekStartsOn: 1 })) {
      // Calculate scroll position
      const scrollPosition = ((hour - 8) * 120) + (minutes * 2);
      // Get ScrollView height (assuming it's about 500px)
      const scrollViewHeight = 500;
      // Center the current time by subtracting half of the ScrollView height
      const centerPosition = Math.max(0, scrollPosition - scrollViewHeight / 2);
      
      // Add small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: centerPosition,
          animated: true
        });
      }, 100);
    }
  }, [weekStart, currentTime]);

  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = addWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const renderTimeSlots = () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) {
      hours.push(
        <View key={`hour-${i}`} style={styles.timeSlot}>
          <Text style={styles.timeTextBig}>{i}</Text>
        </View>
      );
      hours.push(
        <View key={`half-hour-${i}`} style={styles.timeSlot}>
          <Text style={styles.timeText}>30</Text>
        </View>
      );
    }
    return hours;
  };

  const renderDateRow = (day: Date, index: number) => {
    const isToday = isSameDay(day, new Date());

    return (
      <View style={styles.dateBlock} key={index}>
        <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
          <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
          <Text style={styles.dayName}>{format(day, 'EEE').toUpperCase()}</Text>
        </View>
      </View>
    );
  }
 
  const isSlotReserved = (hour: number, minute: number, dayIndex: number) => {
    const day = addDays(weekStart, dayIndex);
    return reservations.some(res => {
      const startHour = res.startTime.getHours();
      const startMinute = res.startTime.getMinutes();
      return isSameDay(res.startTime, day) && 
             startHour === hour && 
             startMinute === minute;
    });
  };

  const handleTimeSlotPress = (hour: number, minute: number, dayIndex: number, date: Date, event: GestureResponderEvent) => {
    event.stopPropagation();
    
    if (isSlotReserved(hour, minute, dayIndex)) {
      console.log('Slot is already reserved');
      return;
    }

    if (selectedSlot?.hour === hour && 
        selectedSlot?.minute === minute && 
        selectedSlot?.dayIndex === dayIndex) {
      setShowReservationPopup(true);
    } else {
      setSelectedSlot({ 
        hour, 
        minute, 
        dayIndex, 
        date,
        duration: 30 // default duration
      });
      setSelectionSlotActive(true);
    }
  };

  const handleOutsidePress = () => {
    if (selectionSlotActive && !showReservationPopup) {
      setSelectedSlot(null);
      setSelectionSlotActive(false);
    }
  };

  const handleClosePopup = () => {
    setShowReservationPopup(false);
    setSelectedSlot(null);
    setSelectionSlotActive(false);
  };

  const renderTimeGrid = () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) {
      const hourSlot = (
        <View key={`hour-${i}`} style={styles.timeGridRow}>
          {Array(5).fill(null).map((_, dayIndex) => {
            const day = addDays(weekStart, dayIndex);
            const isReserved = isSlotReserved(i, 0, dayIndex);
            return (
              <TouchableOpacity
                key={`hour-${i}-day-${dayIndex}`}
                style={[
                  styles.timeGridSlot,
                  isReserved && styles.reservedTimeSlot
                ]}
                onPress={(event) => handleTimeSlotPress(i, 0, dayIndex, day, event)}
                activeOpacity={isReserved ? 1 : 0.6}
              >
                <View style={styles.timeGridSlotContent}>
                  {selectedSlot?.hour === i && 
                   selectedSlot?.minute === 0 && 
                   selectedSlot?.dayIndex === dayIndex && 
                   !isReserved && (
                    <View style={styles.selectedSlotContainer}>
                      <View 
                        style={[
                          styles.selectedTimeSlot,
                          { height: (selectedSlot.duration / 30) * 60 },
                          isPressed && styles.selectedTimeSlotPressed
                        ]} 
                      />
                      <View style={styles.selectionBox}>
                        <Text style={styles.plusSign}>+</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );

      const halfHourSlot = (
        <View key={`half-hour-${i}`} style={styles.timeGridRow}>
          {Array(5).fill(null).map((_, dayIndex) => {
            const day = addDays(weekStart, dayIndex);
            const isReserved = isSlotReserved(i, 30, dayIndex);
            return (
              <TouchableOpacity
                key={`half-hour-${i}-day-${dayIndex}`}
                style={[
                  styles.timeGridSlot,
                  isReserved && styles.reservedTimeSlot
                ]}
                onPress={(event) => handleTimeSlotPress(i, 30, dayIndex, day, event)}
                activeOpacity={isReserved ? 1 : 0.6}
              >
                <View style={styles.timeGridSlotContent}>
                  {selectedSlot?.hour === i && 
                   selectedSlot?.minute === 30 && 
                   selectedSlot?.dayIndex === dayIndex && 
                   !isReserved && (
                    <View style={styles.selectedSlotContainer}>
                      <View 
                        style={[
                          styles.selectedTimeSlot,
                          { height: (selectedSlot.duration / 30) * 60 },
                          isPressed && styles.selectedTimeSlotPressed
                        ]} 
                      />
                      <View style={styles.selectionBox}>
                        <Text style={styles.plusSign}>+</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );

      hours.push(hourSlot);
      hours.push(halfHourSlot);
    }
    return hours;
  };

  const renderCurrentTimeIndicator = () => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const top = ((hour - 8) * 120) + (minutes * 2);

    console.log('=== Current Time Indicator Debug ===');
    console.log('Current Time:', currentTime);
    console.log('Hour:', hour);
    console.log('Minutes:', minutes);
    console.log('Calculated top position:', top);
    console.log('Should render indicator:', hour >= 8 && hour <= 20);

    if (hour < 8 || hour > 20) {
      console.log('Not rendering indicator - outside business hours');
      return null;
    }

    return (
      <View style={[styles.currentTimeContainer, { top }]}>
        <View style={styles.currentTimeDot} />
        <View style={styles.currentTimeLine} />
      </View>
    );
  };

  const renderDayColumn = (day: Date, index: number) => {
    const dayReservations = reservations.filter(res => 
      isSameDay(res.startTime, day)
    );

    return (
      <View style={styles.dayColumn} key={index}>
        {dayReservations.map(reservation => {
          const startHour = reservation.startTime.getHours();
          const startMinutes = reservation.startTime.getMinutes();
          const endHour = reservation.endTime.getHours();
          const endMinutes = reservation.endTime.getMinutes();
          
          const startPosition = ((startHour - 8) * 120 + (startMinutes * 2)) + 4;
          const duration = (endHour - startHour) * 120 + (endMinutes - startMinutes) * 2;
          
          return (
            <View 
              key={reservation.id}
              style={[
                styles.reservation,
                {
                  top: startPosition,
                  height: duration
                },
                reservation.status === 'past' && styles.pastReservation,
                reservation.status === 'current' && styles.currentReservation,
                reservation.status === 'future' && styles.futureReservation,
              ]}
            >
              <Text style={styles.reservationText}>{reservation.name}</Text>
            </View>
          );
        })}
        {isSameDay(day, new Date()) && renderCurrentTimeIndicator()}
      </View>
    );
  };

  return (
    <View 
      style={styles.container} 
    >
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.dateRangeText}>
            {format(weekStart, 'MMMM').toUpperCase()} {format(weekStart, 'd')}-
            {format(addDays(weekStart, 6), 'd')}
          </Text>
          <View style={styles.topBarButtons}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => {
                console.log('Previous week button pressed');
                goToPreviousWeek();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.todayButton,
                !isSameWeek(currentDate, weekStart) && styles.todayButtonActive
              ]} 
              onPress={() => {
                console.log('Today button pressed');
                goToToday();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.todayButtonText,
                !isSameWeek(currentDate, weekStart) && styles.todayButtonTextActive
              ]}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => {
                console.log('Next week button pressed');
                goToNextWeek();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.navButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.datesRowBar}>
            {Array(7).fill(null).map((_, index) => {
              const day = addDays(weekStart, index);
              // Only render weekdays (Monday to Friday)
              if (!isWeekend(day)) {
                return renderDateRow(day, index);
              }
            })}
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            scrollEnabled={!isDragging}
            onScrollBeginDrag={() => console.log('Scroll attempt detected')}
          >
            <View style={{flexDirection: 'row'}}>
              <View style={styles.timeColumn}>
                {renderTimeSlots()}
              </View>

              <View style={styles.daysContainer}>
                <View style={styles.timeGridContainer}>
                  {renderTimeGrid()}
                </View>
                {Array(7).fill(null).map((_, index) => {
                  const day = addDays(weekStart, index);
                  // Only render weekdays (Monday to Friday)
                  if (!isWeekend(day)) {
                    return renderDayColumn(day, index);
                  }
                  return null; // Skip weekends
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {selectedSlot && (
        <ReservationPopup
          selectedSlot={selectedSlot}
          onClose={handleClosePopup}
          visible={showReservationPopup}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 40,
    marginLeft: 20,
    backgroundColor: '#F1F1F1',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop:10,
  },
  dateRangeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    marginHorizontal: 8,
    width: 80,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F1',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'lightgray',
    borderRadius: 40,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontWeight: 'bold',
    color: 'black',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 50,
    overflow: 'hidden',
  },
  datesRowBar: {
    width: '100%',
    height: 70,
    flexDirection: 'row',
    paddingLeft: 40,
    borderBottomWidth: 2,
    borderBottomColor: 'gray',
  },
  dateBlock: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayHeader: {
    backgroundColor: '#e6e9ff',
    borderRadius: 30,
    width: 50,
    height: 50,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayName: {
    fontSize: 12,
    color: 'black',
  },
  scrollView: {
    flex: 0.5,
    flexDirection: 'column',
  },
  timeColumn: {
    width: 40,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  timeGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  timeGridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeGridSlot: {
    flex: 1,
    height: 60,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    position: 'relative',
  },
  timeGridSlotContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timeSlot: {
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  timeTextBig: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: 'gray',
  },
  daysContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  dayColumn: {
    width:'20%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    position: 'relative',
  },
  reservation: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 8,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 2,
  },
  pastReservation: {
    backgroundColor: '#f0f0f0',
  },
  currentReservation: {
    backgroundColor: '#4e5bf2',
  },
  futureReservation: {
    backgroundColor: 'skyblue',
  },
  reservationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  todayButtonActive: {
    backgroundColor: '#4e5bf2',
  },
  todayButtonTextActive: {
    color: 'white',
  },
  selectionBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4e5bf2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  plusSign: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 20,
  },
  selectedTimeSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#4e5bf2',
    borderRadius: 8,
    margin: 6,
  },
  selectedTimeSlotPressed: {
    backgroundColor: '#e0e0e0',
  },
  selectedSlotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  currentTimeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
    pointerEvents: 'none',
  },
  currentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    marginLeft: -6,
    position: 'relative',
    zIndex: 4,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF0000',
    opacity: 0.8,
    marginLeft: 0,
    position: 'relative',
    zIndex: 4,
  },
  dragHandle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',  // Even more visible for debugging
    borderRadius: 16,
    padding: 4,
    elevation: 5,  // Android elevation
    shadowColor: '#000',  // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dragHandleBar: {
    width: 30,
    height: 4,
    backgroundColor: '#4e5bf2',
    borderRadius: 2,
    marginBottom: 4,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4e5bf2',
  },
});

export default ReserveRoom;