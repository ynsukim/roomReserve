import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StatusBar, Platform, TextInput } from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReservationPopupProps {
  selectedSlot: {
    date: Date;
    hour: number;
    minute: number;
  };
  onClose: () => void;
  visible: boolean;
}

type DurationFormat = 
  | { number: string; unit: string }
  | { hours: { number: string; unit: string }; minutes: { number: string; unit: string } };

const ReservationPopup: React.FC<ReservationPopupProps> = ({ selectedSlot, onClose, visible }) => {
  const [duration, setDuration] = useState(30); // Duration in minutes
  const inputRef = useRef<TextInput>(null);

  const formatDuration = (minutes: number): DurationFormat => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return { number: mins.toString(), unit: '분' };
    if (mins === 0) return { number: hours.toString(), unit: '시간' };
    return { 
      hours: { number: hours.toString(), unit: '시간' },
      minutes: { number: mins.toString(), unit: '분' }
    };
  };

  const handleDurationChange = (increment: number) => {
    const newDuration = duration + increment;
    if (newDuration >= 30 && newDuration <= 240) { // Limit between 30min and 4 hours
      setDuration(newDuration);
    }
  };

  const renderDuration = () => {
    const formattedDuration = formatDuration(duration);
    
    if ('hours' in formattedDuration && 'minutes' in formattedDuration) {
      return (
        <View style={styles.durationTextContainer}>
          <Text style={styles.durationNumber}>{formattedDuration.hours.number}</Text>
          <Text style={styles.durationUnit}>{formattedDuration.hours.unit}</Text>
          <Text style={styles.durationNumber}>{formattedDuration.minutes.number}</Text>
          <Text style={styles.durationUnit}>{formattedDuration.minutes.unit}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.durationTextContainer}>
        <Text style={styles.durationNumber}>{formattedDuration.number}</Text>
        <Text style={styles.durationUnit}>{formattedDuration.unit}</Text>
      </View>
    );
  };

  useEffect(() => {
    if (visible && inputRef.current) {
      // Small delay to ensure the popup is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  if (!selectedSlot) return null;

  useEffect(() => {
    let originalStyle: any;
    
    if (Platform.OS === 'android') {
      if (visible) {
        // Save original style
        originalStyle = StatusBar.pushStackEntry({
          animated: true,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          barStyle: 'light-content',
          translucent: true
        });
      }
    }

    return () => {
      if (Platform.OS === 'android' && originalStyle) {
        // Restore original style when component unmounts or visibility changes
        StatusBar.popStackEntry(originalStyle);
      }
    };
  }, [visible]);
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View 
        style={[
          styles.popupOverlay,
          Platform.OS === 'android' && styles.androidOverlay
        ]}
      >
        <TouchableOpacity 
          style={styles.fullScreenTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity 
            style={styles.popup}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>회의실 예약</Text>
            </View>
            
            <View style={styles.popupContentLine}>
              <Text style={styles.popupText}>
                회의 시각 
              </Text>
              <Text style={styles.popupTextBig}>
              {format(selectedSlot.date, 'M.dd (E) ', { locale: ko })}                
              {selectedSlot.hour}:{selectedSlot.minute === 0 ? '00' : '30'}
              </Text>
            </View>

            <View style={styles.popupContentLineIndent}>
              <Text style={styles.popupText}>
                회의 시간 
              </Text>
              <View style={styles.durationContainer}>
                <TouchableOpacity 
                  style={styles.durationButton} 
                  onPress={() => handleDurationChange(-30)}
                >
                  <Text style={styles.durationButtonText}>-</Text>
                </TouchableOpacity>
                {renderDuration()}
                <TouchableOpacity 
                  style={styles.durationButton} 
                  onPress={() => handleDurationChange(30)}
                >
                  <Text style={styles.durationButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.popupContentLine}>
              <View style={styles.inputContainer}>
                <Text style={styles.popupText}>
                  예약자 
                </Text>
                <TextInput
                  ref={inputRef}
                  style={styles.popupTextInput}
                  placeholder="이름을 입력해주세요"
                  returnKeyType="done"
                  keyboardType="default"
                  textContentType="name"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.popupFooter}>
               <TouchableOpacity style={styles.popupFooterButton} onPress={onClose} >
                <Text style={styles.closeButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popupFooterButton} onPress={onClose}>
                <Text style={styles.confirmButtonText}>예약</Text>
              </TouchableOpacity>
            </View>
    
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidOverlay: {
    marginTop: -StatusBar.currentHeight,
  },
  fullScreenTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 400,
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupHeader: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 20,
    paddingLeft: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    // backgroundColor: 'red',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  popupContentLine: {
    paddingHorizontal: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
  },
  popupText: {
    fontSize: 18,
    color: '#333',
  },
  popupTextBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  popupContentLineIndent: {
    paddingLeft: 40,
    paddingRight: 24,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'lightgray', 
    borderRadius: 50,
    overflow: 'hidden',
  },
  durationButton: {
    width: 40,
    height: 40,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  durationTextContainer: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  durationUnit: {
    fontSize: 16,
    color: '#333',
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
  popupTextInput: {
    width: '100%',
    flexDirection: 'row',
    textAlign: 'right',
    paddingRight: 50,
  },
  popupFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    margin: 20,
  },   
  popupFooterButton: {
    width: 80,
    padding: 10,
    marginRight: 10,
    // backgroundColor: 'red',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'blue',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default ReservationPopup; 