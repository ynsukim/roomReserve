import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

interface AnalogClockProps {
  size?: number;
  color?: string;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ 
  size = 260, 
  color = '#FFFFFF' 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const center = size / 2;
  const clockRadius = (size / 2) * 0.8;
  const hourHandLength = clockRadius * 0.5;
  const minuteHandLength = clockRadius * 0.7;

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();

  const hourAngle = (hours + minutes / 60) * (360 / 12);
  const minuteAngle = minutes * (360 / 60);

  const hourX = center + hourHandLength * Math.sin((hourAngle * Math.PI) / 180);
  const hourY = center - hourHandLength * Math.cos((hourAngle * Math.PI) / 180);
  const minuteX = center + minuteHandLength * Math.sin((minuteAngle * Math.PI) / 180);
  const minuteY = center - minuteHandLength * Math.cos((minuteAngle * Math.PI) / 180);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Clock face circle */}
        <Circle
          cx={center}
          cy={center}
          r={clockRadius}
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const markerLength = i % 3 === 0 ? 10 : 5;
          const startRadius = clockRadius - markerLength;
          const x1 = center + startRadius * Math.sin(angle);
          const y1 = center - startRadius * Math.cos(angle);
          const x2 = center + clockRadius * Math.sin(angle);
          const y2 = center - clockRadius * Math.cos(angle);
          
          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}

        {/* Hour hand */}
        <Line
          x1={center}
          y1={center}
          x2={hourX}
          y2={hourY}
          stroke={color}
          strokeWidth="3"
        />

        {/* Minute hand */}
        <Line
          x1={center}
          y1={center}
          x2={minuteX}
          y2={minuteY}
          stroke={color}
          strokeWidth="2"
        />

        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r="4"
          fill={color}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnalogClock; 