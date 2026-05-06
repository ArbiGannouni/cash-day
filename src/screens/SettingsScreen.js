import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { Settings as SettingsIcon, User, Palette, Bell, Shield, HelpCircle, LogOut, ChevronRight, Save, Trash2, Lock } from 'lucide-react-native';
import { useSecurity } from '../hooks/SecurityContext';
import { Modal } from 'react-native';

const SettingsScreen = ({ navigation }) => {
    const { theme, themeMode, toggleTheme } = useTheme();
    const { isSecurityEnabled, isBiometricSupported, isBiometricEnabled, savePin, setBiometric } = useSecurity();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [newPin, setNewPin] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const nameData = await apiClient.getSetting('user_name');
            setUserName(nameData?.value || 'User');
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSaveName = async () => {
        if (!userName.trim()) return Alert.alert('Error', 'Name cannot be empty');
        setSaving(true);
        try {
            await apiClient.updateSetting('user_name', userName);
            Alert.alert('Success', 'Profile updated!');
        } catch (e) { Alert.alert('Error', 'Failed to update name'); }
        finally { setSaving(false); }
    };

    const handleResetData = () => {
        Alert.alert(
            "Security Check",
            "This will delete ALL your data (expenses, incomes, settings) on the server. This cannot be undone!",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiClient.resetData();
                            Alert.alert("Success", "All data has been cleared.");
                            // Refresh current settings
                            loadSettings();
                        } catch (e) {
                            Alert.alert("Error", "Failed to reset data.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSavePin = async () => {
        if (newPin.length !== 4) return Alert.alert('Error', 'PIN must be 4 digits');
        try {
            console.log('Attempting to save PIN:', newPin);
            await savePin(newPin);
            setPinModalVisible(false);
            setNewPin('');
            Alert.alert('Success', 'PIN set successfully!');
        } catch (e) { 
            console.error('SAVE PIN ERROR:', e);
            Alert.alert('Error', 'Failed to save PIN: ' + e.message); 
        }
    };

    const handleDisablePin = () => {
        Alert.alert(
            "Disable Security",
            "Are you sure you want to disable the PIN lock?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Disable", style: "destructive", onPress: () => savePin(null) }
            ]
        );
    };

    if (loading) return <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <SettingsIcon color={theme.colors.primary} size={24} />
                <Text style={[styles.title, { color: theme.colors.text }]}>Settings & Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <User color={theme.colors.primary} size={20} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Settings</Text>
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Display Name</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveName} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={18} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Security Section */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Shield color={theme.colors.primary} size={20} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security</Text>
                    </View>
                    <View style={styles.settingItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>PIN Lock</Text>
                                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Secure app with 4-digit PIN</Text>
                            </View>
                            <Switch
                                value={isSecurityEnabled}
                                onValueChange={(val) => {
                                    if (val) {
                                        setPinModalVisible(true);
                                    } else {
                                        handleDisablePin();
                                    }
                                }}
                                trackColor={{ false: '#cbd5e1', true: theme.colors.secondary }}
                            />
                        </View>
                        {isSecurityEnabled && (
                            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setPinModalVisible(true)}>
                                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Change PIN</Text>
                            </TouchableOpacity>
                        )}
                        {isSecurityEnabled && isBiometricSupported && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                                <View>
                                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Biometric Lock</Text>
                                    <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Use Fingerprint / Face ID</Text>
                                </View>
                                <Switch
                                    value={isBiometricEnabled}
                                    onValueChange={setBiometric}
                                    trackColor={{ false: '#cbd5e1', true: theme.colors.secondary }}
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Appearance (Theming) */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Palette color={theme.colors.primary} size={20} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
                    </View>
                    <View style={styles.settingItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Dark Mode</Text>
                                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Switch to dark interface</Text>
                            </View>
                            <Switch
                                value={themeMode === 'dark'}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#cbd5e1', true: theme.colors.secondary }}
                            />
                        </View>
                    </View>
                </View>

                {/* Account Actions */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Shield color={theme.colors.error} size={20} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
                    </View>
                    <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
                        <Trash2 color={theme.colors.error} size={18} />
                        <Text style={[styles.dangerText, { color: theme.colors.error }]}>Reset All Data</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Flous Chhar Pro v1.0.2</Text>
            </ScrollView>

            {/* PIN Setup Modal */}
            <Modal visible={pinModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Lock color={theme.colors.primary} size={30} />
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{isSecurityEnabled ? 'Change PIN' : 'Set PIN'}</Text>
                        </View>
                        <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>Enter a 4-digit PIN to secure your app access</Text>
                        
                        <TextInput
                            style={[styles.pinInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            value={newPin}
                            onChangeText={setNewPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            placeholder="****"
                            placeholderTextColor={theme.colors.textSecondary}
                            autoFocus
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPinModalVisible(false); setNewPin(''); }}>
                                <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSavePin}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save PIN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 22, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    section: { borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    settingItem: { marginBottom: 15 },
    label: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, height: 45, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 },
    saveBtn: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { fontSize: 15, fontWeight: '600' },
    settingDesc: { fontSize: 12, marginTop: 2 },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
    dangerText: { fontSize: 15, fontWeight: '600' },
    version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10, marginBottom: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', borderRadius: 25, padding: 30, alignItems: 'center' },
    modalHeader: { alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
    modalDesc: { textAlign: 'center', fontSize: 14, marginBottom: 25 },
    pinInput: { width: '100%', height: 60, borderWidth: 2, borderRadius: 15, textAlign: 'center', fontSize: 30, letterSpacing: 10, marginBottom: 30 },
    modalBtns: { flexDirection: 'row', gap: 15, width: '100%' },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    confirmBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }
});

export default SettingsScreen;
