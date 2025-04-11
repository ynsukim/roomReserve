import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import Navigation from './src/components/Navigation';
import ReserveRoom from './src/screens/ReserveRoom';
import CafeteriaMenu from './src/screens/CafeteriaMenu';
import BusSchedule from './src/screens/BusSchedule';
import DrawingStack from './src/navigation/DrawingStack';
import Chatbot from './src/screens/Chatbot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_WIDTH = SCREEN_WIDTH * 0.1;


import { useState } from 'react';

const App = () => {
  const [selectedMenu, setSelectedMenu] = useState('reserve');

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
  }, []);

  const renderScreen = () => {
    switch (selectedMenu) {
      case 'reserve':
        return <ReserveRoom />;
      case 'cafeteria':
        return <CafeteriaMenu />;
      case 'bus':
        return <BusSchedule />;
      case 'drawing':
        return (
          <NavigationContainer>
            <DrawingStack />
          </NavigationContainer>
        );
      case 'chatbot':
        return <Chatbot />;
      default:
        return <ReserveRoom />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <Navigation
          onMenuSelect={setSelectedMenu}
          selectedMenu={selectedMenu}
        />
        <View style={styles.content}>
          {renderScreen()}
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
  },
  content: {
    flex: 1,
    // marginLeft: NAV_WIDTH,
    backgroundColor: '#F1F1F1',
  },
});

export default App;
