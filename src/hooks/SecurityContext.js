import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const SecurityContext = createContext();

const PIN_KEY = '@app_pin';
const BIO_KEY = '@biometric_enabled';

export const SecurityProvider = ({ children }) => {
    const [pin, setPin] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    useEffect(() => {
        checkBiometrics();
        loadSecuritySettings();
    }, []);

    const checkBiometrics = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricSupported(hasHardware && isEnrolled);
        } catch (e) { console.log('Biometrics not supported'); }
    };

    const loadSecuritySettings = async () => {
        try {
            const savedPin = await AsyncStorage.getItem(PIN_KEY);
            if (savedPin) {
                setPin(savedPin);
                setIsSecurityEnabled(true);
                setIsLocked(true);
            }

            const savedBio = await AsyncStorage.getItem(BIO_KEY);
            if (savedBio === 'true') {
                setIsBiometricEnabled(true);
            }
        } catch (e) {
            console.error('Failed to load security settings', e);
        }
    };

    const savePin = async (newPin) => {
        try {
            if (newPin) {
                await AsyncStorage.setItem(PIN_KEY, newPin);
                setPin(newPin);
                setIsSecurityEnabled(true);
            } else {
                await AsyncStorage.removeItem(PIN_KEY);
                await AsyncStorage.removeItem(BIO_KEY);
                setPin(null);
                setIsSecurityEnabled(false);
                setIsBiometricEnabled(false);
                setIsLocked(false);
            }
        } catch (e) {
            console.error('Failed to save PIN', e);
            throw e;
        }
    };

    const setBiometric = async (enabled) => {
        try {
            await AsyncStorage.setItem(BIO_KEY, enabled ? 'true' : 'false');
            setIsBiometricEnabled(enabled);
        } catch (e) {
            console.error('Failed to save biometric setting', e);
        }
    };

    const authenticateBiometrics = async () => {
        if (!isBiometricEnabled || !isBiometricSupported) return false;
        
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Masroufi',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                setIsLocked(false);
                return true;
            }
        } catch (e) { console.log('Biometric auth failed'); }
        return false;
    };

    const unlock = (enteredPin) => {
        if (enteredPin === pin) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const lock = () => {
        if (isSecurityEnabled) {
            setIsLocked(true);
        }
    };

    return (
        <SecurityContext.Provider value={{ 
            pin, isLocked, isSecurityEnabled, isBiometricSupported, isBiometricEnabled,
            savePin, unlock, lock, setIsLocked, setBiometric, authenticateBiometrics 
        }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => useContext(SecurityContext);
