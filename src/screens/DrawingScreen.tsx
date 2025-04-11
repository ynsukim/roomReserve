import 'react-native-reanimated';
import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Path, SkPath, useCanvasRef, Skia } from '@shopify/react-native-skia';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawingStackParamList } from '../navigation/DrawingStack';
import { saveDrawing } from '../utils/drawingStorage';

interface DrawingPath {
  path: SkPath;
  color: string;
  strokeWidth: number;
  opacity: number;
}

type DrawingScreenProps = {
  navigation: NativeStackNavigationProp<DrawingStackParamList, 'Drawing'>;
};

const DrawingScreen = ({ navigation }: DrawingScreenProps) => {
  const canvasRef = useCanvasRef();
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingPath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const colors = ['#000000', '#FF3B30', '#387AFF', '#34C759', '#FF9500'];
  const strokeWidths = [1, 3, 5, 8, 12];

  const gesture = Gesture.Pan()
    .onStart((g) => {
      const path = Skia.Path.Make();
      path.moveTo(g.x, g.y);
      currentPath.current = path;
      
      const newPath: DrawingPath = {
        path,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        strokeWidth,
        opacity: tool === 'eraser' ? 1 : opacity,
      };
      
      setPaths(prev => [...prev, newPath]);
      setUndoStack([]);
    })
    .onUpdate((g) => {
      if (currentPath.current) {
        currentPath.current.lineTo(g.x, g.y);
        setPaths(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], path: currentPath.current! }]);
      }
    });

  const handleUndo = () => {
    if (paths.length > 0) {
      const lastPath = paths[paths.length - 1];
      setPaths(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, lastPath]);
    }
  };

  const handleRedo = () => {
    if (undoStack.length > 0) {
      const pathToRedo = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setPaths(prev => [...prev, pathToRedo]);
    }
  };

  const handleSave = async () => {
    if (canvasRef.current && !isSaving) {
      try {
        setIsSaving(true);
        const image = canvasRef.current.makeImageSnapshot();
        const base64 = image.encodeToBase64();
        await saveDrawing(base64);
        navigation.goBack();
      } catch (error) {
        console.error('Error saving drawing:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tools}>
          <TouchableOpacity 
            style={[styles.tool, tool === 'pen' && styles.selectedTool]}
            onPress={() => setTool('pen')}
          >
            <Icon name="edit" size={24} color={tool === 'pen' ? '#387AFF' : '#000000'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tool, tool === 'eraser' && styles.selectedTool]}
            onPress={() => setTool('eraser')}
          >
            <Icon name="auto-fix-high" size={24} color={tool === 'eraser' ? '#387AFF' : '#000000'} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleUndo}
            disabled={paths.length === 0}
          >
            <Icon name="undo" size={24} color={paths.length === 0 ? '#999999' : '#000000'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleRedo}
            disabled={undoStack.length === 0}
          >
            <Icon name="redo" size={24} color={undoStack.length === 0 ? '#999999' : '#000000'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <GestureDetector gesture={gesture}>
          <Canvas style={styles.canvas} ref={canvasRef}>
            {paths.map((drawingPath, index) => (
              <Path
                key={index}
                path={drawingPath.path}
                color={drawingPath.color}
                style="stroke"
                strokeWidth={drawingPath.strokeWidth}
                opacity={drawingPath.opacity}
              />
            ))}
          </Canvas>
        </GestureDetector>
      </View>

      <View style={styles.toolbar}>
        {tool === 'pen' && (
          <>
            <View style={styles.colorPicker}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorButton, { backgroundColor: c }, color === c && styles.selectedColor]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
            <View style={styles.strokePicker}>
              {strokeWidths.map((width) => (
                <TouchableOpacity
                  key={width}
                  style={[styles.strokeButton, strokeWidth === width && styles.selectedStroke]}
                  onPress={() => setStrokeWidth(width)}
                >
                  <View style={[styles.strokePreview, { height: width }]} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.opacityPicker}>
              {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.opacityButton, opacity === o && styles.selectedOpacity]}
                  onPress={() => setOpacity(o)}
                >
                  <View style={[styles.opacityPreview, { opacity: o }]} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.footerButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.footerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tools: {
    flexDirection: 'row',
    gap: 16,
  },
  tool: {
    padding: 8,
    borderRadius: 8,
  },
  selectedTool: {
    backgroundColor: '#E5E5EA',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#387AFF',
  },
  strokePicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  strokeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedStroke: {
    borderColor: '#387AFF',
    borderWidth: 2,
  },
  strokePreview: {
    width: 20,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  opacityPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  opacityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedOpacity: {
    borderColor: '#387AFF',
    borderWidth: 2,
  },
  opacityPreview: {
    width: 20,
    height: 20,
    backgroundColor: '#000000',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#387AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#387AFF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DrawingScreen; 