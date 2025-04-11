import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawingStackParamList } from '../navigation/DrawingStack';
import { getDrawings, deleteDrawings, initializeDrawingStorage } from '../utils/drawingStorage';
import ImageViewerModal from '../components/ImageViewerModal';

interface DrawingImage {
  id: string;
  uri: string;
}

type DrawingGalleryProps = {
  navigation: NativeStackNavigationProp<DrawingStackParamList, 'Gallery'>;
};

const DrawingGallery = ({ navigation }: DrawingGalleryProps) => {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [drawings, setDrawings] = useState<DrawingImage[]>([]);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const loadDrawings = async () => {
    await initializeDrawingStorage();
    const savedDrawings = await getDrawings();
    setDrawings(savedDrawings);
  };

  useEffect(() => {
    loadDrawings();
  }, []);

  // Add focus listener to refresh drawings when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDrawings();
    });

    return unsubscribe;
  }, [navigation]);

  const handleImagePress = (imageId: string) => {
    if (isDeleteMode) {
      setSelectedImages(prev => 
        prev.includes(imageId) 
          ? prev.filter(id => id !== imageId)
          : [...prev, imageId]
      );
    } else {
      const drawing = drawings.find(d => d.id === imageId);
      if (drawing) {
        setSelectedImageUri(drawing.uri);
      }
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Images',
      'Are you sure you want to delete the selected images?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDrawings(selectedImages);
            setDrawings(prev => prev.filter(drawing => !selectedImages.includes(drawing.id)));
            setSelectedImages([]);
            setIsDeleteMode(false);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: DrawingImage }) => (
    <TouchableOpacity 
      style={[
        styles.imageContainer,
        selectedImages.includes(item.id) && styles.selectedImage
      ]}
      onPress={() => handleImagePress(item.id)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {isDeleteMode && (
        <View style={styles.checkmark}>
          <Icon 
            name={selectedImages.includes(item.id) ? "check-circle" : "radio-button-unchecked"} 
            size={24} 
            color={selectedImages.includes(item.id) ? "#387AFF" : "#8E8E93"} 
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isDeleteMode ? 'Delete Mode' : 'Drawing Board'}</Text>
        {drawings.length > 0 && !isDeleteMode && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setIsDeleteMode(true)}
          >
            <Icon name="delete" size={24} color="#000000" />
          </TouchableOpacity>
        )}
        {isDeleteMode && (
          <View style={styles.deleteControls}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setIsDeleteMode(false);
                setSelectedImages([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            {selectedImages.length > 0 && (
              <TouchableOpacity 
                style={styles.confirmDeleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <FlatList
        data={[{ id: 'new', uri: '' }, ...drawings]}
        renderItem={({ item, index }) => 
          index === 0 ? (
            <TouchableOpacity 
              style={[styles.imageContainer, styles.newDrawingButton]}
              onPress={() => navigation.navigate('Drawing')}
            >
              <Icon name="add" size={40} color="#387AFF" />
              <Text style={styles.newDrawingText}>New Drawing</Text>
            </TouchableOpacity>
          ) : renderItem({ item })
        }
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
      />

      <ImageViewerModal
        visible={!!selectedImageUri}
        imageUri={selectedImageUri || ''}
        onClose={() => setSelectedImageUri(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 16,
  },
  cancelButtonText: {
    color: '#387AFF',
    fontSize: 16,
  },
  confirmDeleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmDeleteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    margin: 8,
    aspectRatio: 1,
    maxWidth: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedImage: {
    borderWidth: 2,
    borderColor: '#387AFF',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  newDrawingButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  newDrawingText: {
    marginTop: 8,
    color: '#387AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DrawingGallery; 