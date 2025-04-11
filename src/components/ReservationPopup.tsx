import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StatusBar, Platform } from 'react-native';
import { format } from 'date-fns';

interface ReservationPopupProps {
  selectedSlot: {
    date: Date;
    hour: number;
    minute: number;
  };
  onClose: () => void;
  visible: boolean;
}

const ReservationPopup: React.FC<ReservationPopupProps> = ({ selectedSlot, onClose, visible }) => {
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
            <Text style={styles.popupTitle}>New Reservation</Text>
            <View style={styles.popupContent}>
              <Text style={styles.popupText}>
                Date: {format(selectedSlot.date, 'MMMM d, yyyy')}
              </Text>
              <Text style={styles.popupText}>
                Time: {selectedSlot.hour}:{selectedSlot.minute === 0 ? '00' : '30'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
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
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  popupContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  popupText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
});

export default ReservationPopup; 