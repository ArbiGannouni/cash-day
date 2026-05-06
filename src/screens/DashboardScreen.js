import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme } from '../hooks/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { apiClient } from '../api/client';
import { Plus, Mic, TrendingUp, TrendingDown, DollarSign, Trash2, Sparkles, ChevronRight, Volume2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { expenses, totalSpent, spentToday, salary, remainingBalance, loading, refreshExpenses } = useExpenses();
    const [aiAdvice, setAiAdvice] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshExpenses();
            loadName();
        });
        return unsubscribe;
    }, [navigation, refreshExpenses]);

    const loadName = async () => {
        try {
            const nameData = await apiClient.getSetting('user_name');
            setUserName(nameData?.value || 'User');
        } catch (e) {
            setUserName('User');
        }
    }

    useEffect(() => {
        if (!aiAdvice) setAiAdvice("Tip: Track your daily expenses to stay in control!");
    }, []);

    const fetchAIAdvice = async () => {
        // AI advice can now be fetched from backend insights if needed, 
        // but for now we keep it simple or use the backend insights route
        setLoadingAI(true);
        try {
            const insights = await apiClient.getAiInsights();
            if (insights && insights.recommendation) {
                setAiAdvice(insights.recommendation);
            }
        } catch (e) { 
            setAiAdvice("Tip of the day: Track your spending to stay in control!"); 
        } finally { 
            setLoadingAI(false); 
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Transaction",
            "This will permanently delete this record. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Now",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiClient.deleteExpense(id);
                            refreshExpenses();
                            Alert.alert("Success", "Record deleted.");
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete record.");
                        }
                    }
                }
            ]
        );
    };

    const speak = (text) => {
        if (!text) return;
        Speech.speak(text.toString(), { language: 'ar-TN' });
    };

    if (loading) return <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image 
                            source={require('../../assets/logo.png')} 
                            style={{ width: 45, height: 45, borderRadius: 22.5, marginRight: 12 }} 
                            defaultSource={require('../../assets/icon.png')}
                        />
                        <View>
                            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Welcome, {userName}</Text>
                            <Text style={[styles.title, { color: theme.colors.text }]}>Masroufi</Text>
                        </View>
                    </View>
                </View>

                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.balanceLabel}>Spent this Month</Text>
                    <Text style={styles.balanceAmount}>{(totalSpent || 0).toFixed(3)} TND</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View>
                                <View style={styles.statHead}>
                                    <View style={[styles.statIcon, { backgroundColor: '#ffffff20' }]}><TrendingUp size={16} color="#fff" /></View>
                                    <Text style={styles.statLabel}>Available</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Income')} style={{ marginLeft: 5 }}><Plus size={14} color="#ffffff80" /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => speak((remainingBalance || 0).toFixed(3))} style={{ marginLeft: 5 }}><Volume2 size={16} color="#ffffff80" /></TouchableOpacity>
                                </View>
                                <Text style={styles.statValue}>{(remainingBalance || 0).toFixed(3)}</Text>
                            </View>
                        </View>

                        <View style={styles.statItem}>
                            <View>
                                <View style={styles.statHead}>
                                    <View style={[styles.statIcon, { backgroundColor: '#ffffff20' }]}><TrendingDown size={16} color="#fff" /></View>
                                    <Text style={styles.statLabel}>Spent Today</Text>
                                    <TouchableOpacity onPress={() => speak((spentToday || 0).toFixed(3))}><Volume2 size={16} color="#ffffff80" style={{ marginLeft: 5 }} /></TouchableOpacity>
                                </View>
                                <Text style={styles.statValue}>{(spentToday || 0).toFixed(3)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* AI Tip */}
                {(aiAdvice || loadingAI) && (
                    <TouchableOpacity onPress={fetchAIAdvice} style={[styles.aiTipContainer, { backgroundColor: theme.colors.surface }]}>
                        <Sparkles size={16} color={theme.colors.secondary} />
                        {loadingAI ? <ActivityIndicator size="small" /> : <Text style={[styles.aiTipText, { color: theme.colors.textSecondary }]}>{aiAdvice}</Text>}
                    </TouchableOpacity>
                )}

                <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('AddExpense')}>
                        <Plus color="#fff" size={24} /><Text style={styles.actionTxt}>Manual Entry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.secondary }]} onPress={() => navigation.navigate('VoiceInput')}>
                        <Mic color="#fff" size={24} /><Text style={styles.actionTxt}>Voice AI</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent History</Text>
                    <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('History')}>
                        <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>All History</Text>
                        <ChevronRight size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {expenses.length === 0 ? <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No transactions yet</Text> :
                    expenses.slice(0, 15).map((item) => {
                        if (!item) return null;
                        return (
                            <View key={item._id || Math.random()} style={[styles.tCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.tIcon, { backgroundColor: theme.colors.primary + '20' }]}><DollarSign size={18} color={theme.colors.primary} /></View>
                                <View style={styles.tInfo}>
                                    <Text style={[styles.tCat, { color: theme.colors.text }]}>{item.categoryId?.name || 'Expense'}</Text>
                                    <Text style={[styles.tDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.description || 'No description'}</Text>
                                    <Text style={styles.tDate}>{item.date?.split('T')[0]}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => speak((item.amount || 0).toFixed(3))}><Volume2 size={14} color={theme.colors.textSecondary} style={{ marginRight: 5 }} /></TouchableOpacity>
                                        <Text style={[styles.tAmt, { color: theme.colors.error }]}>-{(item.amount || 0).toFixed(3)}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.tDel}><Trash2 size={13} color={theme.colors.error} /></TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                }
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 25 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 40 },
    greeting: { fontSize: 13 },
    title: { fontSize: 24, fontWeight: 'bold' },
    profileFallback: { width: 40, height: 40, borderRadius: 20 },
    balanceCard: { borderRadius: 28, padding: 25, marginBottom: 20, elevation: 10 },
    balanceLabel: { color: '#e0e7ff', fontSize: 14, marginBottom: 5 },
    balanceAmount: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ffffff20', paddingTop: 15 },
    statItem: { flex: 1 },
    statHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    statIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    statLabel: { color: '#e0e7ff', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    aiTipContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 25, elevation: 2, gap: 10 },
    aiTipText: { fontSize: 14, fontStyle: 'italic', flex: 1 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    actionBtn: { width: (width - 70) / 2, height: 90, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    actionTxt: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
    seeAllText: { fontSize: 14, fontWeight: 'bold', marginRight: 4 },
    tCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, marginBottom: 12, elevation: 2 },
    tIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    tInfo: { flex: 1 },
    tCat: { fontWeight: 'bold', fontSize: 15 },
    tDesc: { fontSize: 12, marginTop: 2 },
    tDate: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
    tAmt: { fontWeight: 'bold', fontSize: 15 },
    tDel: { marginTop: 8 },
    empty: { textAlign: 'center', marginTop: 30 }
});

export default DashboardScreen;
