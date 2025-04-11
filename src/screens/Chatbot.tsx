import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { Button, Icon } from '@rneui/themed';
import Voice, { SpeechResultsEvent } from '@react-native-community/voice';
import * as Speech from 'expo-speech';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN || '');
const MODEL_ID = 'facebook/blenderbot-400M-distill';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi, I am a prototype chatbot. Using AI Model ${MODEL_ID}. For now I can only speak english`,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useVoiceOutput, setUseVoiceOutput] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0]);
        handleSend(e.value[0]);
      }
    };

    return () => {
      // Stop any ongoing speech
      if (isSpeaking) {
        Speech.stop();
      }
      
      // Cleanup Voice
      Voice.destroy().then(() => Voice.removeAllListeners());
    };
  }, []);

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const speak = async (text: string) => {
    if (!useVoiceOutput) return;

    try {
      // Stop any ongoing speech
      await Speech.stop();
      setIsSpeaking(true);
      
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: (error: Error) => {
          console.warn('Speech error:', error);
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.warn('Speech failed:', err);
      setIsSpeaking(false);
      setUseVoiceOutput(false);
      Alert.alert('Error', 'Failed to speak text');
    }
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await hf.textGeneration({
        model: MODEL_ID,
        inputs: text,
        parameters: {
          max_length: 100,
          temperature: 0.7,
        },
      });

      const botMessage: Message = {
        text: response.generated_text || "Sorry, I couldn't generate a response.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev: Message[]) => [...prev, botMessage]);
      speak(botMessage.text);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: "Sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    }
  };

  const renderMessage = (message: Message, index: number) => (
    <View
      style={[
        styles.messageBubble,
        message.isUser ? styles.userMessage : styles.botMessage,
      ]}
      testID={`message-${index}`}
    >
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.botMessageText,
      ]}>
        {message.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {messages.map((message, index) => renderMessage(message, index))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.voiceOutputToggle}
          onPress={() => setUseVoiceOutput(!useVoiceOutput)}
        >
          <Icon
            name={useVoiceOutput ? 'volume-up' : 'volume-off'}
            type="material"
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={isListening ? stopListening : startListening}
        >
          <Icon
            name={isListening ? 'mic' : 'mic-none'}
            type="material"
            size={24}
            color={isListening ? '#FF4444' : '#007AFF'}
          />
        </TouchableOpacity>

        <Button
          title="Send"
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
          buttonStyle={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    margin: 55,
    width: '70%',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginHorizontal: 35,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    maxHeight: 100,
  },
  voiceButton: {
    padding: 5,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  voiceOutputToggle: {
    padding: 5,
  },
});

export default Chatbot; 