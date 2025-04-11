import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

const CafeteriaMenu = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cafeBox}>
        <View style={styles.cafeBoxHeader}>
          <Text style={styles.title}>1식당 메뉴 (B타워)</Text>
        </View>
        <View style={styles.cafeBoxContent}> 
          <WebView source={{ uri: 'https://front.cjfreshmeal.co.kr/menuinfo?idx=6415' }} />
        </View>
      </View>
      <View style={{ flex: 0.02 }} />
      <View style={styles.cafeBox}>
        <View style={styles.cafeBoxHeader}>
          <Text style={styles.title}>2식당 메뉴 (D타워)</Text>
        </View>
        <View style={styles.cafeBoxContent}> 
          <WebView source={{ uri: 'https://www.samsungwelstory.com/menu/seoulrnd/menu.jsp' }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    marginVertical: 35,
    paddingLeft: 10,
  },
  cafeBox: {
    flex: 1,
    marginRight: 10,
  },
  cafeBoxHeader: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeBoxContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CafeteriaMenu; 