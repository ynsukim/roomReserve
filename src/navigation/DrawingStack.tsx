import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawingGallery from '../screens/DrawingPad';
import DrawingScreen from '../screens/DrawingScreen';

export type DrawingStackParamList = {
  Gallery: undefined;
  Drawing: undefined;
};

const Stack = createNativeStackNavigator<DrawingStackParamList>();

const DrawingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Gallery" component={DrawingGallery} />
      <Stack.Screen name="Drawing" component={DrawingScreen} />
    </Stack.Navigator>
  );
};

export default DrawingStack; 