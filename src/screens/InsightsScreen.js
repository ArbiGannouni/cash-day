import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { useSQLiteContext } from 'expo-sqlite';
import { updateSalaryDb } from '../database/db';
import { Sparkles, TrendingUp, PieChart, Info, RefreshCcw, Edit3, Wallet } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const API_KEY = "AIzaSyCQrBisI5Lh4OVYiws6e4hdNOTFJFUJcYk";

export default function InsightsScreen({ navigation }) {
    const { theme } = useTheme();
    const db = useSQLiteContext();
    const { expenses, totalSpent, salary, remainingBalance, refreshExpenses } = useExpenses();

    const [analysis, setAnalysis] = useState('');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newSalary, setNewSalary] = useState('');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', refreshExpenses);
        return unsubscribe;
    }, [navigation, refreshExpenses]);

    useEffect(() => {
        if (expenses && expenses.length > 0) {
            const categories = {};
            expenses.forEach(e => {
                const cat = e.categoryName || 'General';
                categories[cat] = (categories[cat] || 0) + e.amount;
            });
            setSummary(categories);
        }
    }, [expenses]);

    const handleUpdateSalary = async () => {
        if (!newSalary || isNaN(newSalary)) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        await updateSalaryDb(db, parseFloat(newSalary));
        setIsModalVisible(false);
        refreshExpenses();
    };

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const dataStr = expenses.slice(0, 15).map(e => `${e.amount} TND: ${e.categoryName}`).join(', ');
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
            const prompt = `Financial Expert. Remaining: ${remainingBalance} TND of ${salary} TND. Monthly Data: ${dataStr}. Advice in English. Max 40 words.`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const result = await response.json();
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                setAnalysis(result.candidates[0].content.parts[0].text);
            }
        } catch (e) {
            setAnalysis("Quick tip: Try to cut down on non-essential expenses to finish the month comfortably!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>Finance Analysis</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(true)} style={[styles.editBtn, { backgroundColor: theme.colors.background }]}>
                    <Edit3 color={theme.colors.primary} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.budgetCard, { backgroundColor: theme.colors.primary }]}>
                    <View style={styles.budgetMain}>
                        <Wallet color="#fff" size={24} />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={styles.budgetLabel}>Monthly Budget Status</Text>
                            <Text style={styles.budgetVal}>{remainingBalance.toFixed(3)} TND Left</Text>
                        </View>
                    </View>
                    <View style={styles.budgetFooter}>
                        <Text style={styles.footerText}>Salary: {salary.toFixed(3)}</Text>
                        <Text style={styles.footerText}>Spent: {totalSpent.toFixed(3)}</Text>
                    </View>
                </View>

                <View style={[styles.section, styles.aiSection, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary }]}>
                    <View style={styles.sectionHeader}>
                        <Sparkles size={20} color={theme.colors.secondary} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Expert Advice</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loadingArea}><ActivityIndicator color={theme.colors.secondary} /><Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Analyzing wallet...</Text></View>
                    ) : (
                        <Text style={[styles.analysisText, { color: analysis ? theme.colors.text : theme.colors.textSecondary }]}>
                            {analysis || "Tap to get saving tips based on your spending."}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: theme.colors.secondary }]}
                        onPress={fetchAnalysis}
                        disabled={loading}
                    >
                        <RefreshCcw size={18} color="#fff" />
                        <Text style={styles.aiButtonText}>Generate Analysis</Text>
                    </TouchableOpacity>
                </View>

                {summary && totalSpent > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitleSmall, { color: theme.colors.text }]}>Spending Breakdown</Text>
                        {Object.entries(summary).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                            <View key={cat} style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.catName, { color: theme.colors.textSecondary }]}>{cat}</Text>
                                    <View style={[styles.barBg, { backgroundColor: theme.colors.background }]}><View style={[styles.barFill, { width: `${(amt / totalSpent) * 100}%`, backgroundColor: theme.colors.primary }]} /></View>
                                </View>
                                <Text style={[styles.catAmt, { color: theme.colors.text }]}>{amt.toFixed(3)}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Update Monthly Salary</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="e.g. 1500"
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={newSalary}
                            onChangeText={setNewSalary}
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: theme.colors.textSecondary }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateSalary} style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Budget</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold' },
    editBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 25 },
    budgetCard: { borderRadius: 24, padding: 25, marginBottom: 25, elevation: 10 },
    budgetMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    budgetLabel: { color: '#e0e7ff', fontSize: 13 },
    budgetVal: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
    budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ffffff20', paddingTop: 15 },
    footerText: { color: '#cbd5e1', fontSize: 12 },
    section: { borderRadius: 24, padding: 20, marginBottom: 25, elevation: 3 },
    aiSection: { borderTopWidth: 5 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', marginLeft: 8 },
    loadingArea: { padding: 20, alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 14 },
    analysisText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 20 },
    aiButton: { flexDirection: 'row', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
    aiButtonText: { color: '#fff', fontWeight: 'bold' },
    sectionTitleSmall: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    catName: { fontSize: 14, marginBottom: 4 },
    barBg: { height: 5, borderRadius: 3, width: '100%' },
    barFill: { height: 5, borderRadius: 3 },
    catAmt: { fontSize: 14, fontWeight: 'bold', marginLeft: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', padding: 25, borderRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 16 },
    modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
    cancelBtn: { padding: 10 },
    saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }
});
