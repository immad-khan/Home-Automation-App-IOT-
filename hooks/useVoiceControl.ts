/**
 * useVoiceControl Hook
 * 
 * Manages voice recording, transcription, and command execution
 * - Record audio using expo-av
 * - Transcribe using Whisper API
 * - Match commands and execute
 * - Voice feedback
 */

import voiceCommandService, { Language, VoiceCommand } from '@/services/voiceCommandService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useCallback, useRef, useState } from 'react';

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  isListening: boolean;
  error: string | null;
  transcript: string;
  matchedCommand: VoiceCommand | null;
  language: Language;
  recordingTime: number; // in seconds
}

export const useVoiceControl = (openaiApiKey: string) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    isListening: false,
    error: null,
    transcript: '',
    matchedCommand: null,
    language: 'en',
    recordingTime: 0,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const maxRecordingTime = 30000; // 30 seconds max

  /**
   * Initialize audio permissions and settings
   */
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpiece: false,
      });
      console.log('[VoiceControl] Audio initialized');
      return true;
    } catch (error) {
      console.error('[VoiceControl] Audio initialization failed:', error);
      setVoiceState((prev) => ({
        ...prev,
        error: 'Failed to initialize audio',
      }));
      return false;
    }
  }, []);

  /**
   * Start recording voice
   */
  const startRecording = useCallback(async () => {
    try {
      setVoiceState((prev) => ({
        ...prev,
        isRecording: true,
        isListening: true,
        error: null,
        recordingTime: 0,
      }));

      // Initialize recording
      const recording = new Audio.Recording();
      recordingRef.current = recording;

      const status = await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (status.isReadyToRecord) {
        await recording.startAsync();
        console.log('[VoiceControl] Recording started');

        // Start recording timer
        let time = 0;
        recordingTimerRef.current = setInterval(() => {
          time += 100;
          setVoiceState((prev) => ({
            ...prev,
            recordingTime: Math.floor(time / 1000),
          }));

          // Auto-stop after 30 seconds
          if (time >= maxRecordingTime) {
            stopRecording();
          }
        }, 100);
      } else {
        throw new Error('Recording not ready');
      }
    } catch (error) {
      console.error('[VoiceControl] Recording failed:', error);
      setVoiceState((prev) => ({
        ...prev,
        isRecording: false,
        isListening: false,
        error: 'Failed to start recording',
      }));
    }
  }, []);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        throw new Error('No active recording');
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('[VoiceControl] Recording stopped, processing...');

      setVoiceState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: true,
      }));

      // Initialize Whisper service with API key
      voiceCommandService.setApiKey(openaiApiKey);
      voiceCommandService.setLanguage(voiceState.language);

      // Transcribe audio
      const transcript = await voiceCommandService.transcribeAudio(uri);

      // Match command
      const matchedCommand = voiceCommandService.matchCommand(transcript);

      setVoiceState((prev) => ({
        ...prev,
        isProcessing: false,
        isListening: false,
        transcript,
        matchedCommand,
        error: matchedCommand ? null : 'Command not recognized',
      }));

      // Clean up audio file
      try {
        await FileSystem.deleteAsync(uri);
      } catch (e) {
        console.warn('[VoiceControl] Failed to delete recording file');
      }

      return { transcript, matchedCommand };
    } catch (error) {
      console.error('[VoiceControl] Processing failed:', error);
      setVoiceState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        isListening: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      }));
      return null;
    }
  }, [voiceState.language, openaiApiKey]);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          await FileSystem.deleteAsync(uri);
        }
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      setVoiceState((prev) => ({
        ...prev,
        isRecording: false,
        isListening: false,
        recordingTime: 0,
      }));

      console.log('[VoiceControl] Recording cancelled');
    } catch (error) {
      console.error('[VoiceControl] Cancellation failed:', error);
    }
  }, []);

  /**
   * Set language for voice recognition
   */
  const setLanguage = useCallback((language: Language) => {
    voiceCommandService.setLanguage(language);
    setVoiceState((prev) => ({
      ...prev,
      language,
    }));
    console.log('[VoiceControl] Language set to:', language);
  }, []);

  /**
   * Speak confirmation message
   */
  const speakConfirmation = useCallback(async (message: string) => {
    try {
      await voiceCommandService.speak(message);
    } catch (error) {
      console.error('[VoiceControl] TTS error:', error);
    }
  }, []);

  /**
   * Get all available commands for current language
   */
  const getAvailableCommands = useCallback(() => {
    return voiceCommandService.getAvailableCommands();
  }, []);

  /**
   * Reset voice state
   */
  const resetState = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      transcript: '',
      matchedCommand: null,
      error: null,
      recordingTime: 0,
    }));
  }, []);

  return {
    voiceState,
    initializeAudio,
    startRecording,
    stopRecording,
    cancelRecording,
    setLanguage,
    speakConfirmation,
    getAvailableCommands,
    resetState,
  };
};

export default useVoiceControl;
