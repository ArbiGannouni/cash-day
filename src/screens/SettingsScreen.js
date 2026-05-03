import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { Settings as SettingsIcon, User, Palette, Bell, Shield, HelpCircle, LogOut, ChevronRight, Save, Trash2 } from 'lucide-react-native';

const SettingsScreen = ({ navigation }) => {
    const { theme, themeMode, toggleTheme } = useTheme();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const nameData = await fetch('http://10.0.2.2:5000/api/settings/user_name').then(res => res.json());
            setUserName(nameData?.value || 'User');
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSaveName = async () => {
        if (!userName.trim()) return Alert.alert('Error', 'Name cannot be empty');
        setSaving(true);
        try {
            await fetch('http://10.0.2.2:5000/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'user_name', value: userName })
            });
            Alert.alert('Success', 'Profile updated!');
        } catch (e) { Alert.alert('Error', 'Failed to update name'); }
        finally { setSaving(false); }
    };

    const handleResetData = () => {
        Alert.alert(
            "Security Check",
            "This will delete data on the server. This cannot be undone!",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: async () => {
                        // In a real app, you'd have a reset endpoint
                        Alert.alert("Notice", "Reset functionality should be implemented on the backend.");
                    }
                }
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

                {/* Appearance (Theming) */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Palette color={theme.colors.primary} size={20} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
                    </View>
                    <View style={styles.settingItem}>
                        <View>
                            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Dark Mode</Text>
                            <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Switch to dark interface</Text>
                        </View>
                        <Switch
                            value={themeMode === 'dark'}
                            onValueChange={async (val) => {
                                toggleTheme();
                                try {
                                    await fetch('http://10.0.2.2:5000/api/settings', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ key: 'theme_mode', value: val ? 'dark' : 'light' })
                                    });
                                } catch (e) { console.error(e); }
                            }}
                            trackColor={{ false: '#cbd5e1', true: theme.colors.secondary }}
                        />
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
    version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10, marginBottom: 30 }
});

export default SettingsScreen;
