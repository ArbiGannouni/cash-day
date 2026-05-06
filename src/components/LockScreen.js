import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useSecurity } from '../hooks/SecurityContext';
import { useTheme } from '../hooks/ThemeContext';
import { Lock, Delete, Fingerprint } from 'lucide-react-native';

const LockScreen = () => {
    const { theme } = useTheme();
    const { unlock, authenticateBiometrics, isBiometricEnabled } = useSecurity();
    const [enteredPin, setEnteredPin] = useState('');

    useEffect(() => {
        if (isBiometricEnabled) {
            authenticateBiometrics();
        }
    }, []);

    const handlePress = (num) => {
        if (enteredPin.length < 4) {
            const newPin = enteredPin + num;
            setEnteredPin(newPin);
            
            if (newPin.length === 4) {
                setTimeout(() => {
                    if (!unlock(newPin)) {
                        Alert.alert('Wrong PIN', 'Please try again');
                        setEnteredPin('');
                    }
                }, 100);
            }
        }
    };

    const handleDelete = () => {
        setEnteredPin(enteredPin.slice(0, -1));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Lock color={theme.colors.primary} size={40} />
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Enter PIN</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Secure access to Masroufi</Text>
            </View>

            <View style={styles.pinDisplay}>
                {[1, 2, 3, 4].map((i) => (
                    <View 
                        key={i} 
                        style={[
                            styles.dot, 
                            { 
                                backgroundColor: enteredPin.length >= i ? theme.colors.primary : 'transparent',
                                borderColor: theme.colors.border
                            }
                        ]} 
                    />
                ))}
            </View>

            <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity 
                        key={num} 
                        style={[styles.key, { backgroundColor: theme.colors.surface }]}
                        onPress={() => handlePress(num.toString())}
                    >
                        <Text style={[styles.keyText, { color: theme.colors.text }]}>{num}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity 
                    style={[styles.key, { backgroundColor: isBiometricEnabled ? theme.colors.surface : 'transparent' }]}
                    onPress={() => isBiometricEnabled && authenticateBiometrics()}
                >
                    {isBiometricEnabled && <Fingerprint color={theme.colors.primary} size={32} />}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.key, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handlePress('0')}
                >
                    <Text style={[styles.keyText, { color: theme.colors.text }]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.key, { backgroundColor: 'transparent' }]}
                    onPress={handleDelete}
                >
                    <Delete color={theme.colors.text} size={24} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 50 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16 },
    pinDisplay: { flexDirection: 'row', gap: 20, marginBottom: 60 },
    dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 20 },
    key: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    keyEmpty: { width: 70, height: 70 },
    keyText: { fontSize: 28, fontWeight: '600' }
});

export default LockScreen;
