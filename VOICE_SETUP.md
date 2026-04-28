# MyVISTA Voice Control - Environment Configuration

## OpenAI API Key Setup

To enable voice control with OpenAI Whisper model, you need to:

### 1. Get OpenAI API Key
- Visit: https://platform.openai.com/account/api-keys
- Sign in or create an account
- Create a new API key
- Copy the key (you won't be able to see it again)

### 2. Add to Environment Variables

Create a `.env.local` file in the project root:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Load Environment Variables

The app will automatically load this key from the environment.

## Voice Control Features

### Supported Languages
- **English (en)** - Full support with 100+ command variations
- **Urdu (اردو)** - Full support with commands in Urdu

### Available Voice Commands

#### English Commands
- *Bulbs*: "Turn on Bulb 1/2", "Turn off Bulb 1/2", "Switch on/off Bulb 1/2"
- *Fans*: "Turn on Fan 1/2", "Turn off Fan 1/2", "Fan 1/2 maximum", "Fan 1/2 medium"
- *Gate*: "Open Gate", "Close Gate", "Open Door", "Lock Gate"

#### Urdu Commands (اردو کمانڈز)
- *بلب*: "بلب 1 چالو کریں", "بلب 1 بند کریں", "بلب 2 چالو کریں", "بلب 2 بند کریں"
- *فین*: "فین 1 چالو کریں", "فین 1 بند کریں", "فین 2 چالو کریں", "فین 2 بند کریں"
- *گیٹ*: "گیٹ کھولیں", "گیٹ بند کریں", "دروازہ کھولیں", "دروازہ بند کریں"

### How to Use

1. **Open Voice Control**: Tap the microphone icon in the dashboard header
2. **Select Language**: Choose English (🇺🇸) or Urdu (🇵🇰)
3. **Start Recording**: Tap the "Record" button and speak your command
4. **Review**: The app will display what it heard and the matched command
5. **Execute**: Tap "Execute" to run the command
6. **Confirmation**: The device will speak a confirmation message

### Fuzzy Matching

The voice system uses fuzzy matching to understand:
- Slight variations in pronunciation
- Different word orders
- Abbreviations

Example: The following will all trigger "Turn on Bulb 1":
- "Turn on Bulb 1"
- "Bulb 1 on"
- "Switch on bulb one"
- "Light 1 on"

### Maximum Recording Time

- Maximum recording duration: **30 seconds**
- Automatic timeout: Yes
- Manual stop: Tap the "Stop" button

### Error Handling

If the app doesn't recognize your command:
1. Check the provided transcript
2. View the available commands list
3. Try speaking more clearly
4. Ensure you're using English or Urdu phonetically

### Troubleshooting

**Voice not recognized:**
- Make sure you're connected to the ESP32 device
- Speak clearly and at normal pace
- Check API key is correctly set

**API Errors:**
- Verify OpenAI API key is valid
- Check you have sufficient API credits
- Ensure internet connection is active

**Microphone Permission:**
- Grant microphone permission when the app asks
- Check device settings if permission was denied

## Advanced Features

### Voice History
All voice commands are logged in the "History" tab with timestamp and command details.

### Offline Support
- Voice recording works offline
- Transcription requires internet connection
- Command execution requires ESP32 connection

### Performance
- Recording to API: ~2-5 seconds
- Transcription time: ~1-3 seconds
- Total latency: ~3-8 seconds from stop recording to command execution
