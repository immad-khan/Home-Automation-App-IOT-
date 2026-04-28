import React, { FC, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    Animated,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../services/firebase';
import PageHeader from '../../components/PageHeader';
import DeviceCard from '../../components/DeviceCard';
import { useSettings } from '@/context/settingsContext';
import { useScale } from '@/hooks/useScale';

const BLUE_PRIMARY = '#008080';

const Dashboard: FC = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // --- Toast Animation State ---
    const [toastMsg, setToastMsg] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Hooks
    const { addHistoryItem } = useSettings();
    const { sText, sIcon } = useScale();

    useEffect(() => {
        const dbRef = ref(database, 'vista_iot');
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const mappedDevices: any[] = [
                    { 
                        id: 'bulb1', path: 'relays/bulb1', name: 'Bulb 1', type: 'bulb', 
                        status: data.relays?.bulb1 ? 'online' : 'offline', 
                        details: data.relays?.bulb1 ? 'Active' : 'Inactive', value: data.relays?.bulb1 
                    },
                    { 
                        id: 'bulb2', path: 'relays/bulb2', name: 'Bulb 2', type: 'tube-light', 
                        status: data.relays?.bulb2 ? 'online' : 'offline', 
                        details: data.relays?.bulb2 ? 'Active' : 'Inactive', value: data.relays?.bulb2 
                    },
                    { 
                        id: 'fan1_speed', path: 'fans/fan1_speed', name: 'Fan 1', type: 'fan', 
                        status: data.fans?.fan1_speed > 0 ? 'online' : 'offline', 
                        details: `Speed: ${data.fans?.fan1_speed || 0}%`, 
                        value: data.fans?.fan1_speed,
                        memoryValue: data.fans?.fan1_speed_memory || 50 
                    },
                    { 
                        id: 'fan2_speed', path: 'fans/fan2_speed', name: 'Fan 2', type: 'fan', 
                        status: data.fans?.fan2_speed > 0 ? 'online' : 'offline', 
                        details: `Speed: ${data.fans?.fan2_speed || 0}%`, 
                        value: data.fans?.fan2_speed,
                        memoryValue: data.fans?.fan2_speed_memory || 50 
                    },
                    { 
                        id: 'angle', path: 'servo/angle', name: 'Main Gate', type: 'main gate', 
                        status: data.servo?.angle > 0 ? 'online' : 'offline', 
                        details: data.servo?.angle > 0 ? `Open (${data.servo?.angle}°)` : 'Closed', value: data.servo?.angle 
                    }
                ];
                setDevices(mappedDevices);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const triggerToast = (message: string) => {
        setToastMsg(message);
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start(() => setToastMsg(''));
    };

    const updateSpeed = async (device: any, increment: boolean) => {
        const fullPath = `vista_iot/${device.path}`;
        const currentVal = Number(device.value) || 30;
        let newVal = increment ? currentVal + 10 : currentVal - 10;
        if (newVal > 100) newVal = 100;
        if (newVal < 30) newVal = 30; 
        if (newVal === currentVal) return;

        const updates: any = {};
        updates[fullPath] = newVal;
        updates[`vista_iot/${device.path}_memory`] = newVal;

        try {
            await update(ref(database), updates);
            addHistoryItem(`${device.name} speed set to ${newVal}%`, "Manual Control", 'speedometer-outline');
            triggerToast(`${device.name} speed updated to ${newVal}%`);
        } catch (error) {
            triggerToast("Error updating speed");
        }
    };

    const handleToggle = async (device: any) => {
        try {
            const fullPath = `vista_iot/${device.path}`;
            let newVal: any;
            let statusLabel = "";

            if (device.path === 'servo/angle') {
                newVal = device.value === 0 ? 90 : 0;
                statusLabel = newVal === 90 ? "Opened" : "Closed";
            } else if (device.path.includes('relays')) {
                newVal = !device.value;
                statusLabel = newVal ? 'Turned ON' : 'Turned OFF';
            } else if (device.path.includes('fans')) {
                newVal = device.value === 0 ? (device.memoryValue || 50) : 0;
                statusLabel = newVal > 0 ? 'Turned ON' : 'Turned OFF';
            }

            await update(ref(database), { [fullPath]: newVal });
            addHistoryItem(`${device.name} ${statusLabel}`, "Manual Control", 'flash-outline');
            triggerToast(`${device.name} successfully ${statusLabel.toLowerCase()}`);
        } catch (error) {
            triggerToast("Connection failed");
        }
    };

    const onlineCount = devices.filter(d => d.status === 'online').length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BLUE_PRIMARY} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE_PRIMARY} translucent={true} />
            
            <PageHeader 
                icon={<Ionicons name="home" size={sIcon(30)} color="#fff" />}
                title="VISTA" 
                subtitle="Smart Home Dashboard" 
            />

            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.contentWrapper}>
                    <LinearGradient colors={['#59bfcaff', '#008080']} style={styles.statsCardWrapper}>
                        <View style={styles.statsCardInner}>
                            <Text style={[styles.statsTitle, { fontSize: sText(18) }]}>Device Status</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="power" size={sIcon(24)} color={BLUE_PRIMARY} />
                                    <Text style={[styles.statLabel, { fontSize: sText(12) }]}>Active</Text>
                                    <Text style={[styles.statNumber, { fontSize: sText(20) }]}>{onlineCount}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="wifi" size={sIcon(24)} color="#4CAF50" />
                                    <Text style={[styles.statLabel, { fontSize: sText(12) }]}>Online</Text>
                                    <Text style={[styles.statNumber, { fontSize: sText(20) }]}>{`${onlineCount}/${devices.length}`}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="hardware-chip" size={sIcon(24)} color="#FF6B35" />
                                    <Text style={[styles.statLabel, { fontSize: sText(12) }]}>Total</Text>
                                    <Text style={[styles.statNumber, { fontSize: sText(20) }]}>{devices.length}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.devicesSection}>
                        <Text style={[styles.sectionTitle, { fontSize: sText(20) }]}>Connected Devices</Text>
                        {devices.map((device) => (
                            <DeviceCard 
                                key={device.id} 
                                device={device}
                                gradientStart="#59bfcaff" 
                                gradientEnd="#008080"
                                cardBackground="#FFFFFF"
                                iconName={
                                    device.type === 'bulb' || device.type === 'tube-light' ? 'bulb-outline' : 
                                    device.type === 'fan' ? 'snow-outline' : 
                                    device.type === 'main gate' ? 'key-outline' : 'help-outline'
                                }
                                iconColor="#fff" 
                                iconBgColor={BLUE_PRIMARY}
                                toggleOnColor={BLUE_PRIMARY} 
                                toggleOffColor="#CCCCCC"
                                onToggle={() => handleToggle(device)}
                            >
                                {device.type === 'fan' && device.value > 0 && (
                                    <View style={styles.speedRow}>
                                        <TouchableOpacity 
                                            onPress={() => updateSpeed(device, false)}
                                            disabled={device.value <= 30}
                                            style={{ opacity: device.value <= 30 ? 0.3 : 1 }}
                                        >
                                            <Ionicons name="remove-circle-outline" size={sIcon(28)} color={BLUE_PRIMARY} />
                                        </TouchableOpacity>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={[styles.speedLabel, { fontSize: sText(10) }]}>SPEED CONTROL</Text>
                                            <Text style={[styles.speedValue, { fontSize: sText(18) }]}>{device.value}%</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => updateSpeed(device, true)}
                                            disabled={device.value >= 100}
                                            style={{ opacity: device.value >= 100 ? 0.3 : 1 }}
                                        >
                                            <Ionicons name="add-circle-outline" size={sIcon(28)} color={BLUE_PRIMARY} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </DeviceCard>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {toastMsg !== '' && (
                <Animated.View style={[styles.toastWrapper, { opacity: fadeAnim }]}>
                    <View style={styles.toastInner}>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.toastText}>{toastMsg}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { alignItems: 'center', paddingBottom: 100, paddingHorizontal: 20 },
    contentWrapper: { width: '100%', maxWidth: 400 },
    
    // Bottom Toast Styles
    toastWrapper: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        zIndex: 2000,
        alignItems: 'center',
    },
    toastInner: {
        backgroundColor: BLUE_PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 35,
        width: '100%',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    toastText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '700', 
        marginLeft: 12 
    },

    statsCardWrapper: { borderRadius: 20, padding: 1.5, marginVertical: 20, elevation: 4 },
    statsCardInner: { backgroundColor: '#fff', borderRadius: 18.5, padding: 20 },
    statsTitle: { fontWeight: '700', marginBottom: 15, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', backgroundColor: '#e6f0fa', borderRadius: 12, flex: 1, marginHorizontal: 4, padding: 12 },
    statLabel: { color: '#666', marginTop: 6 },
    statNumber: { fontWeight: 'bold', marginTop: 4 },
    devicesSection: { width: '100%' },
    sectionTitle: { fontWeight: 'bold', marginBottom: 15 },
    speedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginTop: 10 },
    speedLabel: { color: '#888', fontWeight: 'bold' },
    speedValue: { fontWeight: 'bold', color: BLUE_PRIMARY }
});

export default Dashboard;