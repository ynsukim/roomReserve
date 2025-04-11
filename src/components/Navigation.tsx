import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SettingsModal from './SettingsModal';
import AnalogClock from './AnalogClock';


const menuItems = [
  { id: 'reserve', name: 'Reserve Room', icon: 'event' },
  { id: 'cafeteria', name: 'Cafeteria Menu', icon: 'restaurant' },
  { id: 'bus', name: 'Bus Schedule', icon: 'directions-bus' },
  { id: 'drawing', name: 'Drawing Pad', icon: 'brush' },
  { id: 'chatbot', name: 'Chatbot', icon: 'chat' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ICON_SIZE = 20;
const NAV_WIDTH = SCREEN_WIDTH * 0.18; 
const NAV_HEIGHT = ((ICON_SIZE * 3 + ICON_SIZE * 0.25) * menuItems.length) + ICON_SIZE*2;


interface NavigationProps {
  onMenuSelect: (menuId: string) => void;
  selectedMenu: string;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuSelect, selectedMenu }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const NAV_WIDTHAnim = useRef(new Animated.Value(NAV_WIDTH)).current;
  const NAV_RadiusAnim = useRef(new Animated.Value(0)).current;
  const NAV_MarginLeft = useRef(new Animated.Value(0)).current;
  const NAV_HeightAnim = useRef(new Animated.Value(SCREEN_HEIGHT+16)).current;

  const iconHeightAinm = useRef(new Animated.Value(ICON_SIZE*2.5)).current;

  const OpacityAnim = useRef(new Animated.Value(1)).current;
  const RevOpacityAnim = useRef(new Animated.Value(0)).current;


  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    console.log(isExpanded);
    Animated.parallel([
      Animated.timing(NAV_WIDTHAnim, {
        toValue: isExpanded ? NAV_WIDTH : ICON_SIZE * 3.5,
        easing: Easing.bezier(0.83, 0.01, 0.39, 1.01),
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(NAV_MarginLeft, {
        toValue: isExpanded ? 0 : ICON_SIZE * 1.25,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(OpacityAnim, {
        toValue: isExpanded ? 1 : 0,
        delay: isExpanded ? 250 : 0,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(RevOpacityAnim, {
        toValue: isExpanded ? 0 : 1,
        delay: isExpanded ? 0 : 250,
        duration: 50,
        useNativeDriver: false,
      }),
      Animated.timing(iconHeightAinm, {
        toValue: isExpanded ? 0 : ICON_SIZE*2,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(NAV_RadiusAnim, {
        toValue: isExpanded ? 0 : 100,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(NAV_HeightAnim, {
        toValue: isExpanded ? SCREEN_HEIGHT+14 : NAV_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Animated.View style={[styles.navigation, { marginLeft: NAV_MarginLeft }]}>

          <Animated.View style={[styles.navBar, { width: NAV_WIDTHAnim , height: NAV_HeightAnim , borderRadius: NAV_RadiusAnim}]} >
            
              <Animated.View style={[styles.header, { opacity: OpacityAnim }]}>
                  <View style={styles.headerBar}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleExpansion}>
                      <Icon name="menu" size={ICON_SIZE} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                      <Icon name="settings" size={ICON_SIZE} color="white" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.clockContainer}>
                    <AnalogClock size={140} color="white" />
                    <Text style={styles.dateText}>
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </Text>
                    <Text style={styles.dateText}>
                      {currentTime.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </Text>
                  </View>
              </Animated.View>  
            
            
            <View style={styles.menuContainer}>
                <Animated.View style={[styles.iconButton, { height: iconHeightAinm, opacity: RevOpacityAnim, margin: ICON_SIZE*0.25}]}>
                  <TouchableOpacity style={styles.iconButton} onPress={toggleExpansion}>
                    <Icon name="menu" size={ICON_SIZE} color="white" />
                  </TouchableOpacity>
                </Animated.View>
              
              {menuItems.map((item) => (
                <TouchableOpacity  key={item.id}
                  style={[
                    styles.menuTouchArea,
                    selectedMenu === item.id && styles.selectedMenuItem,
                  ]}
                  onPress={() => onMenuSelect(item.id)}
                >
                  <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', paddingLeft:ICON_SIZE*0.25, flex: 1}]}>
                      <View style={styles.iconButton}>
                        <Icon name={item.icon} size={ICON_SIZE} color="white" />
                      </View>
                      <Text style={[styles.menuText, { display: !isExpanded ? 'flex' : 'none'}]}>
                        {item.name}
                      </Text>
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>      
                
            
            <Animated.View style={[styles.footer, { opacity: OpacityAnim }]}/>

          </Animated.View>
      </Animated.View>

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  navigation: {
    marginRight: 20,
    // backgroundColor: '#B8860B', // Dark Yellow
    zIndex: 1000,
    justifyContent: 'center',
    height: SCREEN_HEIGHT+14,
  },
  navBar: {
    backgroundColor: 'black', // black
    // borderTopRightRadius: 20,
    // borderBottomRightRadius: 20,
    overflow: 'hidden',
    justifyContent:'center',
    flexDirection: 'column',
  },
  header: {
    flex: 1,
    // backgroundColor: '#0000FF', // Blue
    alignContent: 'flex-start'
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    // backgroundColor: 'aqua', // aqua
  },

  iconButton: {
    width: ICON_SIZE*2,
    height: ICON_SIZE*2,
    borderRadius: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#FF00FF80', // Magenta
  },

  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    // backgroundColor: 'red',
  },
  dateText: {
    color: 'white',
    fontSize: 14,
    marginTop: 2,
  },

  menuContainer: {
    padding: ICON_SIZE*0.5,
    justifyContent: 'center',
    // backgroundColor: '#008000', // Dark Green
  },
  menuTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ICON_SIZE * 2.5,
    borderRadius: ICON_SIZE * 2,
    marginBottom: 8,
    overflow: 'hidden',
    // backgroundColor: '#000080', // blueBlack
  },
  selectedMenuItem: {
    backgroundColor: '#387AFF', // skyblue
    overflow: 'hidden',
  },
  menuText: {
    color: 'white',
    marginLeft: 12,
    fontSize: 16,
    height: ICON_SIZE*1,
    // backgroundColor: '#80008080', // Purple
    overflow: 'hidden',
  },
  footer: {
    flex: 0.95,
    // backgroundColor: '#FFFF00', // Yellow
  },
});

export default Navigation; 