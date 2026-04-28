import React, { useState, FC } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ViewStyle 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import PageHeader from '../../components/PageHeader'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 

// 1. Import the scale hook
import { useScale } from '@/hooks/useScale';

// --- TYPE DEFINITIONS ---
interface Command {
  title: string;
  example: string;
}

interface IconProps { 
  size?: number;
  color?: string;
}

// 🎨 --- COLORS ---
const BLUE_PRIMARY = '#008080';
const BUTTON_GRADIENT_START = '#00C4CC';
const BUTTON_GRADIENT_END = '#008080';
const BORDER_GRADIENT_START = '#59bfcaff';
const BORDER_GRADIENT_END = '#008080';
const CARD_INNER_BACKGROUND = '#FFFFFF';

const MicrophoneIcon: FC<IconProps> = ({ size = 50, color = BLUE_PRIMARY }) => (
  <Ionicons name="mic" size={size} color={color} />
);

const VoiceMode: FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  
  // 2. Initialize the scaling hook
  const { sText, sIcon, isLarge } = useScale();

  const COMMAND_EXAMPLES: Command[] = [
      { title: "Turn on/off devices", example: '"Turn on the bulb"' },
      { title: "Control AC temperature", example: '"Set AC to 22 degrees"' },
      { title: "Adjust brightness", example: '"Dim the living room lights"' },
      { title: "Open/close blinds", example: '"Close the bedroom blinds"' },
  ];

  return (
    <View style={styles.container}>
      <PageHeader 
        icon={<MicrophoneIcon size={sIcon(30)} color="#fff" />}
        title="Voice Mode"
        subtitle="Control your home with natural voice commands"
      />
      
      <ScrollView contentContainerStyle={styles.contentContainer} style={styles.contentScroll}>

        {/* Top Card */}
        <LinearGradient
            colors={[BORDER_GRADIENT_START, BORDER_GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.micCardGradientWrapper} 
        >
            <View style={styles.micCardInner}>
                <View style={[
                  styles.micCircle, 
                  { 
                    width: sIcon(100), 
                    height: sIcon(100), 
                    borderRadius: sIcon(50) 
                  }
                ]}>
                    <MicrophoneIcon size={sIcon(50)} color={BLUE_PRIMARY} /> 
                </View>
                
                <View style={styles.textContainer}>
                  {!isListening ? (
                    <>
                      <Text style={[styles.instruction, { fontSize: sText(18) }]}>Tap to speak</Text>
                      <Text style={[styles.note, { fontSize: sText(14) }]}>Press and speak your command</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.readyText, { fontSize: sText(20) }]}>Voice Control Ready</Text>
                      <Text style={[styles.instruction, { fontSize: sText(18) }]}>Tap the button below to stop</Text>
                    </>
                  )}
                </View>
            </View>
        </LinearGradient>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.startButtonContainer}
          onPress={() => setIsListening(!isListening)} 
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isListening ? ['#4CAF50', '#6BCB77'] : [BUTTON_GRADIENT_START, BUTTON_GRADIENT_END]} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.startButtonGradient as ViewStyle, { padding: isLarge ? 20 : 16 }]}
          >
            <MicrophoneIcon size={sIcon(20)} color="#fff" />
            <Text style={[styles.startButtonText, { fontSize: sText(16) }]}>
              {isListening ? 'Listening... Tap to stop' : 'Start Voice Control'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.commandPrompt, { fontSize: sText(16) }]}>Try these commands</Text>
        
        {/* Command List */}
        <View style={styles.commandList}>
            {COMMAND_EXAMPLES.map((item: Command, index: number) => (
                <TouchableOpacity key={index} activeOpacity={0.7} style={styles.commandItemOuterWrapper}>
                    <LinearGradient
                        colors={[BORDER_GRADIENT_START, BORDER_GRADIENT_END]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.commandItemGradientBorder}
                    >
                        <View style={styles.commandItemInnerContent}> 
                            <View style={styles.iconWrapper}> 
                                <MicrophoneIcon size={sIcon(20)} color={BLUE_PRIMARY} />
                            </View>

                            <View style={styles.commandTextWrapper}>
                                <Text style={[styles.commandTitle, { fontSize: sText(16) }]}>{item.title}</Text>
                                <Text style={[styles.commandExample, { fontSize: sText(13) }]}>{item.example}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    contentScroll: { flex: 1, paddingHorizontal: 20 },
    contentContainer: { alignItems: 'center', paddingBottom: 40 },
    micCardGradientWrapper: {
        borderRadius: 20, width: '100%', maxWidth: 400, padding: 1.5,
        marginBottom: 20, marginTop: 20, elevation: 4, 
    },
    micCardInner: {
        backgroundColor: CARD_INNER_BACKGROUND, borderRadius: 18.5, 
        paddingVertical: 30, paddingHorizontal: 15, width: '100%', alignItems: 'center',
    },
    micCircle: {
        backgroundColor: '#e6f0fa', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    textContainer: { alignItems: 'center' },
    instruction: { fontWeight: '600', textAlign: 'center', marginBottom: 5, color: '#333' },
    note: { color: '#666', textAlign: 'center' },
    readyText: { fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#4CAF50' },
    startButtonContainer: { width: '100%', maxWidth: 400, borderRadius: 12, overflow: 'hidden', marginBottom: 30 },
    startButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    startButtonText: { color: '#fff', fontWeight: '600', marginLeft: 10 },
    commandPrompt: { color: '#333', textAlign: 'left', width: '100%', maxWidth: 400, marginBottom: 15, fontWeight: 'bold' },
    commandList: { width: '100%', maxWidth: 400 },
    commandItemOuterWrapper: { borderRadius: 15, marginBottom: 10, overflow: 'hidden', elevation: 2 },
    commandItemGradientBorder: { padding: 1, borderRadius: 15 },
    commandItemInnerContent: { 
        backgroundColor: CARD_INNER_BACKGROUND, flexDirection: 'row', 
        alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 14, 
    },
    iconWrapper: { paddingRight: 15, justifyContent: 'center' },
    commandTextWrapper: { flex: 1 }, // Added flex to ensure text wraps correctly in large mode
    commandTitle: { fontWeight: '600', color: '#333' },
    commandExample: { color: '#666', marginTop: 2 },
});

export default VoiceMode;