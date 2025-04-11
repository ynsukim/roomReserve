import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const BusStation = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={require('../../assets/busStation.png')} style={styles.image} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'green',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'red',
  },
  image: {
    height: 1000,
    resizeMode: 'contain',
    backgroundColor: 'white',  
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default BusStation; 