declare module '@react-native-community/voice' {
  export interface SpeechResultsEvent {
    value?: string[];
  }

  export interface VoiceModule {
    onSpeechStart: () => void;
    onSpeechEnd: () => void;
    onSpeechResults: (e: SpeechResultsEvent) => void;
    start: (locale: string) => Promise<void>;
    stop: () => Promise<void>;
    destroy: () => Promise<void>;
    removeAllListeners: () => void;
  }

  const Voice: VoiceModule;
  export default Voice;
} 