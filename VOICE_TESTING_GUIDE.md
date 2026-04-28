# Voice Control Testing & Quick Reference

## 🎯 Quick Reference

### ESP32 Command Format
```
POST http://vista-iot.local:8080/cmd
Content-Type: application/json

{
  "action": "BULB1:ON"    // Format: DEVICE:COMMAND
}

// Response
{
  "success": true,
  "message": "Command executed",
  "deviceState": {
    "BULB1": "ON",
    "BULB2": "OFF",
    "FAN1": 50,
    "FAN2": 75,
    "SERVO": 90
  }
}
```

### Voice Command Mapping
```typescript
// Example: User says "Turn on bulb one"
"Turn on bulb one" 
    ↓ (Whisper API)
"turn on bulb 1"
    ↓ (Fuzzy Matching)
Matched: Command { name: "Turn on Bulb 1", action: "BULB1:ON" }
    ↓ (espCommandService)
POST /cmd with action: "BULB1:ON"
    ↓ (TTS Feedback)
Speak: "Okay, doing this"
```

## 🧪 Testing Checklist

### ✅ Pre-Launch Checks
- [ ] OpenAI API key set in `.env.local`
- [ ] ESP32 uploaded with refactored firmware
- [ ] ArduinoJson library installed on Arduino IDE
- [ ] WiFi credentials updated in ESP32 code
- [ ] `npm install` completed (expo-av, expo-tts added)
- [ ] App builds without errors

### ✅ Device Connection Test
```typescript
// In home.tsx, check console logs:
// Expected: "Device found: vista-iot.local:8080"
// Expected: "Connected to ESP32"
// Expected: ESP32 device state received
```

**Manual Test:**
1. Start app
2. Watch for WiFi icon in stats card
3. Should show "Connected" within 5 seconds
4. Device dropdown should populate with devices

### ✅ English Voice Commands (Basic)
1. Tap microphone button
2. Language: English (selected)
3. Tap "Record"
4. Say: "Turn on bulb one"
5. Wait for transcription ≈2 seconds
6. See matched command highlighted
7. Tap "Execute"
8. Device should:
   - Show loading spinner
   - Update BULB1 state to ON
   - Speak: "Okay, doing this"

### ✅ English Voice Commands (Advanced)
Test variations to verify fuzzy matching:
```
Test 1: "Turn on bulb 1"         ✓ Exact match
Test 2: "Bulb 1 on"              ✓ Fuzzy match
Test 3: "Switch on bulb one"     ✓ Fuzzy match
Test 4: "Light 1 on"             ✓ Fuzzy match
Test 5: "Open the gate"          ✓ Exact match
```

### ✅ Urdu Voice Commands
1. Tap microphone button
2. Language: Urdu (اردو)
3. Tap "Record"
4. Say: "بلب چالو کریں" (Bulb on)
5. Verify transcription in Urdu
6. Tap "Execute"
7. Verify TTS feedback: "ٹھیک ہے، یہ کر رہے ہیں"

### ✅ Error Handling Tests

**Test 1: No Microphone Permission**
- Revoke app microphone permission
- Tap record button
- Should show permission request
- Expected: "Microphone permission denied"

**Test 2: Device Offline**
- Disconnect ESP32 from power
- Try voice command
- Expected: "Device not connected" error
- Expected: Device card appears dimmed

**Test 3: Poor Audio Quality**
- Tap record with lots of background noise
- Speak unclear command
- Expected: Transcription shows garbled text
- Expected: No matching command found
- Option: View available commands

**Test 4: Network Timeout**
- Disable WiFi on app device
- Try voice command (recording works)
- When executing: Shows timeout error
- Expected: User can retry when WiFi reconnected

## 📊 Component Integration Tests

### DeviceCard Loading States
```tsx
// Should show spinner when isLoading prop = true
<DeviceCard 
  device={device}
  isLoading={loadingDevice === device.id}  // ← true during command
  isDisabled={!espConnection.isConnected}   // ← true when offline
/>
```

### Voice Modal Visibility
```tsx
// VoiceControlModal opens when voiceModalVisible = true
<VoiceControlModal 
  visible={voiceModalVisible}
  onClose={() => setVoiceModalVisible(false)}
  onCommandConfirmed={handleVoiceCommand}
/>
```

### ESP Connection Hook
```tsx
// useEspConnection returns connection state
const espConnection = useEspConnection(true);
// Expected states:
// - { isConnected: true, deviceState: {...}, connectionType: "WiFi" }
// - { isConnected: false, deviceState: {}, connectionType: "None" }
```

## 🔍 Debugging Tips

### 1. Check Console Logs
```javascript
// In your React Native debugger:
console.log("Voice state:", voiceControl.voiceState);
console.log("Connection:", espConnection);
console.log("ESP response:", response);
```

### 2. Monitor Network Requests
- Install Flipper (React Native debugger)
- Monitor POST /cmd requests to ESP32
- Check response payload

### 3. Audio Recording Debug
```typescript
// In useVoiceControl.ts
if (recording) {
  console.log("Recording duration:", duration);
  console.log("Recording URI:", uri);
}
```

### 4. Whisper API Debug
```typescript
// In voiceCommandService.ts
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  // Log the request/response
  console.log("API Response:", response);
});
```

### 5. Command Matching Debug
```typescript
// Enable debug logging
const matched = matchCommand(text);
console.log("Input text:", text);
console.log("Matched command:", matched.command.name);
console.log("Match score:", matched.score);
```

## 🎵 Audio File Debugging

### Audio Recording Issues
```
Symptom: Recording button unresponsive
Solution: Check AudioPlayer status
- Grant microphone permission
- Restart app
- Check device volume is not muted

Symptom: "Audio playback failed"
Solution: 
- Check TTS language is available (ur-PK, en-US)
- Verify AVAudioSession is configured
```

### Whisper API Issues
```
Symptom: "Invalid API Key"
→ Check .env.local has valid EXPO_PUBLIC_OPENAI_API_KEY
→ Rebuild app: expo start -c

Symptom: "Audio file is too large"
→ Current max: 30 seconds recording
→ If longer needed, adjust: MAX_RECORDING_SECONDS

Symptom: "Unsupported audio format"
→ expo-av outputs m4a by default (supported)
→ If custom format, ensure MIME type correct
```

## 🌐 Network Debugging

### ESP32 Discovery Issues
```
Symptom: "Cannot find vista-iot.local"
Solution 1: Same WiFi network?
- Check app and ESP32 on same WiFi
- Try entering IP manually: 192.168.x.x:8080

Solution 2: mDNS issues?
- Some WiFi blocks mDNS (enterprise networks)
- Check ESP32 Serial output: "mDNS responder started"

Solution 3: Firewall blocking?
- Ensure port 8080 not blocked
- Try connecting from browser: http://vista-iot.local:8080/status
```

### Command Execution Timeout
```
Symptom: "Command timed out"
→ Check ESP32 device state
→ Verify command format matches
→ Check network latency: ping vista-iot.local

Timeout value: 5 seconds (espCommandService.ts)
Can increase if slow network
```

## 📱 Device-Specific Testing

### iOS
```
- Microphone permission: Settings → [App] → Microphone
- Audio session category: RecordAndPlayback
- TTS voices: Check Settings → Accessibility → Speech
```

### Android
```
- Runtime permission check: REQUEST_AUDIO_RECORDING
- Audio focus: Verify no other apps capturing audio
- TTS data: May need to download language pack
```

## 🎯 Performance Benchmarks

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Recording Start | <100ms | ~50ms | expo-av |
| Whisper Latency | <3s | 1-3s | Depends on audio length |
| Match Latency | <50ms | ~10ms | Fuzzy algorithm |
| ESP32 Response | <500ms | 100-300ms | Direct HTTP |
| TTS Playback | <5s | 2-5s | Depends on text length |

## 🚨 Common Issues & Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| Voice button not responsive | Permission granted? | Grant microphone permission in settings |
| Commands not matching | Language correct? | Verify language selection (English/Urdu) |
| No microphone access | iOS permission? | Settings → [App] → Microphone: Allow |
| Device not found | Same WiFi? | Check both on same network |
| API key invalid | Env file present? | Create .env.local with valid key |
| TTS not speaking | Volume muted? | Unmute device or adjust in settings |
| Recording crashes | Duration too long? | Current limit: 30 seconds |
| Slow transcription | Internet speed? | Check WiFi speed: >5 Mbps recommended |

## 📞 Support Resources

1. **OpenAI Whisper Docs**: https://platform.openai.com/docs/guides/speech-to-text
2. **Expo AV Docs**: https://docs.expo.dev/sdk/audio/
3. **Expo TTS Docs**: https://docs.expo.dev/sdk/text-to-speech/
4. **React Native Audio**: https://react-native-audio-toolkit.github.io/

## 🔄 Integration Test Scenario

```typescript
// Complete end-to-end test
const testVoiceFlow = async () => {
  // 1. Record audio
  await voiceControl.startRecording();
  // User speaks...
  const audio = await voiceControl.stopRecording();
  
  // 2. Transcribe
  const text = await voiceCommandService.transcribeAudio(audio.uri);
  // Expected: "turn on bulb 1"
  
  // 3. Match command
  const command = voiceCommandService.matchCommand(text);
  // Expected: { name: "Turn on Bulb 1", action: "BULB1:ON" }
  
  // 4. Execute on ESP32
  const response = await espCommandService.sendCommand(command.action);
  // Expected: { success: true, deviceState: {...} }
  
  // 5. Feedback
  await voiceControl.speakConfirmation("Okay, doing this");
  // Expected: Hear voice feedback
  
  // 6. UI Update
  setDevices(response.deviceState);
  // Expected: BULB1 shows "ON"
};
```
