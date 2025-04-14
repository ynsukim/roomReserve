import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import type {
  ScrollView as ScrollViewType,
} from 'react-native';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isWeekend, isSameWeek } from 'date-fns';
import ReservationPopup from '../components/ReservationPopup';

// Constants
const TIME_GRID_HEIGHT = 30;
const SCROLL_VIEW_HEIGHT = 500;

interface SelectedSlot {
  hour: number;
  minute: number;
  dayIndex: number;
  date: Date;
  duration: number;
}

const ReserveRoom = () => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectionSlotActive, setSelectionSlotActive] = useState(false);
  const [showReservationPopup, setShowReservationPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollViewRef = useRef<ScrollViewType>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to current time when component mounts or week changes
  useEffect(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const today = new Date();
    
    if (hour >= 8 && hour <= 20 && isSameWeek(today, weekStart, { weekStartsOn: 1 })) {
      const scrollPosition = ((hour - 8) * TIME_GRID_HEIGHT * 2) + (minutes * (TIME_GRID_HEIGHT / 30));
      const centerPosition = Math.max(0, scrollPosition - SCROLL_VIEW_HEIGHT / 2);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: centerPosition,
          animated: true
        });
      }, 100);
    }
  }, [weekStart, currentTime]);

  const goToPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

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
  };

  const handleTimeSlotPress = (hour: number, minute: number, dayIndex: number, date: Date, event: GestureResponderEvent) => {
    event.stopPropagation();
    
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
        duration: 30
      });
      setSelectionSlotActive(true);
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
            return (
              <TouchableOpacity
                key={`hour-${i}-day-${dayIndex}`}
                style={styles.timeGridSlot}
                onPress={(event) => handleTimeSlotPress(i, 0, dayIndex, day, event)}
                activeOpacity={0.6}
              >
                <View style={styles.timeGridSlotContent}>
                  {selectedSlot?.hour === i && 
                   selectedSlot?.minute === 0 &&
                   selectedSlot?.dayIndex === dayIndex && (
                    <View style={styles.selectedSlotContainer}>
                      <View 
                        style={[
                          styles.selectedTimeSlot,
                          { height: (selectedSlot.duration / 30) * TIME_GRID_HEIGHT }
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
            return (
              <TouchableOpacity
                key={`half-hour-${i}-day-${dayIndex}`}
                style={styles.timeGridSlot}
                onPress={(event) => handleTimeSlotPress(i, 30, dayIndex, day, event)}
                activeOpacity={0.6}
              >
                <View style={styles.timeGridSlotContent}>
                  {selectedSlot?.hour === i && 
                   selectedSlot?.minute === 30 && 
                   selectedSlot?.dayIndex === dayIndex && (
                    <View style={styles.selectedSlotContainer}>
                      <View 
                        style={[
                          styles.selectedTimeSlot,
                          { height: (selectedSlot.duration / 30) * TIME_GRID_HEIGHT }
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
    const top = ((hour - 8) * TIME_GRID_HEIGHT * 2) + (minutes * (TIME_GRID_HEIGHT / 30));

    if (hour < 8 || hour > 20) return null;

    return (
      <View style={[styles.currentTimeContainer, { top }]}>
        <View style={styles.currentTimeDot} />
        <View style={styles.currentTimeLine} />
      </View>
    );
  };

  const renderDayColumn = (day: Date, index: number) => (
    <View style={styles.dayColumn} key={index}>
      {isSameDay(day, new Date()) && renderCurrentTimeIndicator()}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.dateRangeText}>
            {format(weekStart, 'MMMM').toUpperCase()} {format(weekStart, 'd')}-
            {format(addDays(weekStart, 6), 'd')}
          </Text>
          <View style={styles.topBarButtons}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToPreviousWeek}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.todayButton,
                !isSameWeek(new Date(), weekStart) && styles.todayButtonActive
              ]} 
              onPress={goToToday}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.todayButtonText,
                !isSameWeek(new Date(), weekStart) && styles.todayButtonTextActive
              ]}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={goToNextWeek}
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
              if (!isWeekend(day)) {
                return renderDateRow(day, index);
              }
            })}
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
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
                  if (!isWeekend(day)) {
                    return renderDayColumn(day, index);
                  }
                  return null;
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
    height: TIME_GRID_HEIGHT,
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
    height: TIME_GRID_HEIGHT,
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
  selectedTimeSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#4e5bf2',
    borderRadius: 8,
  },
  selectedSlotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  todayButtonActive: {
    backgroundColor: '#4e5bf2',
  },
  todayButtonTextActive: {
    color: 'white',
  },
});

export default ReserveRoom;