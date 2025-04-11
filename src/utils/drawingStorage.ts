import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAWINGS_DIRECTORY = `${FileSystem.documentDirectory}drawings/`;
const DRAWINGS_KEY = '@drawings';

interface DrawingMetadata {
  id: string;
  uri: string;
  createdAt: number;
}

export const initializeDrawingStorage = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DRAWINGS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DRAWINGS_DIRECTORY, { intermediates: true });
  }
};

export const saveDrawing = async (base64Data: string): Promise<DrawingMetadata> => {
  const timestamp = Date.now();
  const fileName = `drawing_${timestamp}.png`;
  const uri = `${DRAWINGS_DIRECTORY}${fileName}`;

  await FileSystem.writeAsStringAsync(uri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const drawing: DrawingMetadata = {
    id: fileName,
    uri,
    createdAt: timestamp,
  };

  const existingDrawingsJson = await AsyncStorage.getItem(DRAWINGS_KEY);
  const existingDrawings: DrawingMetadata[] = existingDrawingsJson ? JSON.parse(existingDrawingsJson) : [];
  
  await AsyncStorage.setItem(DRAWINGS_KEY, JSON.stringify([...existingDrawings, drawing]));

  return drawing;
};

export const getDrawings = async (): Promise<DrawingMetadata[]> => {
  const drawingsJson = await AsyncStorage.getItem(DRAWINGS_KEY);
  return drawingsJson ? JSON.parse(drawingsJson) : [];
};

export const deleteDrawings = async (drawingIds: string[]) => {
  const drawingsJson = await AsyncStorage.getItem(DRAWINGS_KEY);
  const drawings: DrawingMetadata[] = drawingsJson ? JSON.parse(drawingsJson) : [];

  // Delete files
  await Promise.all(
    drawingIds.map(async (id) => {
      const drawing = drawings.find(d => d.id === id);
      if (drawing) {
        try {
          await FileSystem.deleteAsync(drawing.uri);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
    })
  );

  // Update metadata
  const updatedDrawings = drawings.filter(drawing => !drawingIds.includes(drawing.id));
  await AsyncStorage.setItem(DRAWINGS_KEY, JSON.stringify(updatedDrawings));
}; 