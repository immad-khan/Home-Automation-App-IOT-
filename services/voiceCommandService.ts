/**
 * Voice Command Service
 * 
 * Handles:
 * - Speech-to-text using OpenAI Whisper API
 * - Command matching and fuzzy matching
 * - Text-to-speech feedback
 * - Language selection (English/Urdu)
 */

import * as Speech from 'expo-tts';

export type Language = 'en' | 'ur';

export interface VoiceCommand {
  name: string;
  aliases: string[]; // variations of the command name
  action: string; // command to send to ESP32
  icon?: string;
}

export const AVAILABLE_COMMANDS: VoiceCommand[] = [
  {
    name: 'Turn on Bulb 1',
    aliases: ['bulb 1 on', 'light 1 on', 'turn on bulb 1', 'switch on bulb 1', 'light one on'],
    action: 'BULB1:ON',
    icon: 'bulb',
  },
  {
    name: 'Turn off Bulb 1',
    aliases: ['bulb 1 off', 'light 1 off', 'turn off bulb 1', 'switch off bulb 1', 'light one off'],
    action: 'BULB1:OFF',
    icon: 'bulb-outline',
  },
  {
    name: 'Turn on Bulb 2',
    aliases: ['bulb 2 on', 'light 2 on', 'turn on bulb 2', 'switch on bulb 2', 'light two on'],
    action: 'BULB2:ON',
    icon: 'bulb',
  },
  {
    name: 'Turn off Bulb 2',
    aliases: ['bulb 2 off', 'light 2 off', 'turn off bulb 2', 'switch off bulb 2', 'light two off'],
    action: 'BULB2:OFF',
    icon: 'bulb-outline',
  },
  {
    name: 'Turn on Fan 1',
    aliases: ['fan 1 on', 'turn on fan 1', 'switch on fan 1', 'fan one on', 'fan 1 start'],
    action: 'FAN1:50',
    icon: 'snow',
  },
  {
    name: 'Turn off Fan 1',
    aliases: ['fan 1 off', 'turn off fan 1', 'switch off fan 1', 'fan one off', 'stop fan 1'],
    action: 'FAN1:0',
    icon: 'snow-outline',
  },
  {
    name: 'Turn on Fan 2',
    aliases: ['fan 2 on', 'turn on fan 2', 'switch on fan 2', 'fan two on', 'fan 2 start'],
    action: 'FAN2:50',
    icon: 'snow',
  },
  {
    name: 'Turn off Fan 2',
    aliases: ['fan 2 off', 'turn off fan 2', 'switch off fan 2', 'fan two off', 'stop fan 2'],
    action: 'FAN2:0',
    icon: 'snow-outline',
  },
  {
    name: 'Open Gate',
    aliases: ['open the gate', 'open gate', 'open door', 'unlock gate', 'door open'],
    action: 'SERVO:90',
    icon: 'key',
  },
  {
    name: 'Close Gate',
    aliases: ['close the gate', 'close gate', 'close door', 'lock gate', 'door close'],
    action: 'SERVO:0',
    icon: 'key-outline',
  },
  {
    name: 'Max Fan 1',
    aliases: ['fan 1 full speed', 'fan 1 max', 'maximum fan 1'],
    action: 'FAN1:100',
    icon: 'snow',
  },
  {
    name: 'Max Fan 2',
    aliases: ['fan 2 full speed', 'fan 2 max', 'maximum fan 2'],
    action: 'FAN2:100',
    icon: 'snow',
  },
  {
    name: 'Medium Fan 1',
    aliases: ['fan 1 medium', 'fan 1 medium speed', 'fan 1 fifty'],
    action: 'FAN1:50',
    icon: 'snow',
  },
  {
    name: 'Medium Fan 2',
    aliases: ['fan 2 medium', 'fan 2 medium speed', 'fan 2 fifty'],
    action: 'FAN2:50',
    icon: 'snow',
  },
];

export const URDU_COMMANDS: VoiceCommand[] = [
  {
    name: 'بلب 1 چالو کریں',
    aliases: ['بلب ایک آن', 'روشنی 1 چالو کریں', 'پہلا بلب'],
    action: 'BULB1:ON',
    icon: 'bulb',
  },
  {
    name: 'بلب 1 بند کریں',
    aliases: ['بلب ایک آف', 'روشنی 1 بند کریں', 'پہلا بلب بند'],
    action: 'BULB1:OFF',
    icon: 'bulb-outline',
  },
  {
    name: 'بلب 2 چالو کریں',
    aliases: ['بلب دو آن', 'روشنی 2 چالو کریں', 'دوسرا بلب'],
    action: 'BULB2:ON',
    icon: 'bulb',
  },
  {
    name: 'بلب 2 بند کریں',
    aliases: ['بلب دو آف', 'روشنی 2 بند کریں', 'دوسرا بلب بند'],
    action: 'BULB2:OFF',
    icon: 'bulb-outline',
  },
  {
    name: 'فین 1 چالو کریں',
    aliases: ['فین ایک آن', 'پہلا فین', 'فین 1 شروع کریں'],
    action: 'FAN1:50',
    icon: 'snow',
  },
  {
    name: 'فین 1 بند کریں',
    aliases: ['فین ایک آف', 'فین 1 رکو', 'فین بند کریں'],
    action: 'FAN1:0',
    icon: 'snow-outline',
  },
  {
    name: 'فین 2 چالو کریں',
    aliases: ['فین دو آن', 'دوسرا فین', 'فین 2 شروع کریں'],
    action: 'FAN2:50',
    icon: 'snow',
  },
  {
    name: 'فین 2 بند کریں',
    aliases: ['فین دو آف', 'فین 2 رکو'],
    action: 'FAN2:0',
    icon: 'snow-outline',
  },
  {
    name: 'گیٹ کھولیں',
    aliases: ['دروازہ کھولیں', 'قفل کھولیں', 'گیٹ کھول دیں'],
    action: 'SERVO:90',
    icon: 'key',
  },
  {
    name: 'گیٹ بند کریں',
    aliases: ['دروازہ بند کریں', 'قفل لگائیں', 'گیٹ بند کریں'],
    action: 'SERVO:0',
    icon: 'key-outline',
  },
];

class VoiceCommandService {
  private openaiApiKey: string = '';
  private currentLanguage: Language = 'en';

  constructor(openaiApiKey: string = '') {
    this.openaiApiKey = openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.warn('[VoiceService] OpenAI API key not found. Voice recognition disabled.');
    }
  }

  /**
   * Set OpenAI API key
   */
  setApiKey(key: string) {
    this.openaiApiKey = key;
  }

  /**
   * Set current language
   */
  setLanguage(language: Language) {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Transcribe audio file using OpenAI Whisper API
   */
  async transcribeAudio(audioUri: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const formData = new FormData();
      
      // Read file and append to form data
      const uriParts = audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: audioUri,
        type: `audio/${fileType === 'wav' ? 'wav' : 'mp4a.40.2'}`,
        name: `audio.${fileType}`,
      } as any);
      
      // Set language for Whisper
      formData.append('language', this.currentLanguage === 'ur' ? 'ur' : 'en');
      formData.append('model', 'whisper-1');

      console.log(`[VoiceService] Sending audio to Whisper (${this.currentLanguage})...`);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Whisper API error: ${error.error.message}`);
      }

      const data = await response.json();
      const transcription = data.text.trim().toLowerCase();

      console.log(`[VoiceService] Transcribed: "${transcription}"`);
      return transcription;
    } catch (error) {
      console.error('[VoiceService] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Match transcribed text to available commands using fuzzy matching
   */
  matchCommand(transcription: string): VoiceCommand | null {
    const commands = this.currentLanguage === 'ur' ? URDU_COMMANDS : AVAILABLE_COMMANDS;
    const text = transcription.toLowerCase().trim();

    // Exact match first
    for (const command of commands) {
      for (const alias of command.aliases) {
        if (text === alias.toLowerCase()) {
          return command;
        }
      }
    }

    // Fuzzy match - check if transcription contains any alias
    for (const command of commands) {
      for (const alias of command.aliases) {
        const aliasLower = alias.toLowerCase();
        
        // Check various matching strategies
        if (text.includes(aliasLower)) {
          return command; // Contains exact alias
        }

        // Levenshtein-like simple check (at least 70% similarity)
        const similarity = this.calculateSimilarity(text, aliasLower);
        if (similarity > 0.7) {
          return command;
        }
      }
    }

    return null;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: this.currentLanguage === 'ur' ? 'ur-PK' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('[VoiceService] TTS error:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('[VoiceService] Stop speaking error:', error);
    }
  }

  /**
   * Get all available commands for current language
   */
  getAvailableCommands(): VoiceCommand[] {
    return this.currentLanguage === 'ur' ? URDU_COMMANDS : AVAILABLE_COMMANDS;
  }
}

export const voiceCommandService = new VoiceCommandService();
export default voiceCommandService;
