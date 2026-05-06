import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { TrendingUp, TrendingDown, BrainCircuit, Sparkles, Target, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const InsightsScreen = () => {
    const { theme } = useTheme();
    const [report, setReport] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // Generate last 6 months dynamically
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
            label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
            value: d.toISOString().slice(0, 7)
        };
    });

    const fetchReport = async () => {
        setLoading(true);
        setAiInsights(null);
        try {
            const data = await apiClient.getStatsReport(selectedMonth);
            setReport(data);
        } catch (e) {
            console.error('Failed to fetch report:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiAdvice = async () => {
        setAiLoading(true);
        try {
            const data = await apiClient.getAiInsights(selectedMonth);
            setAiInsights(data);
        } catch (e) {
            console.error('Failed to fetch AI insights:', e);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [selectedMonth]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading Statistics...</Text>
            </View>
        );
    }

    const totalSpent = report?.totalSpent || 0;
    const lastMonthTotal = report?.lastMonthTotal || 0;
    const diff = totalSpent - lastMonthTotal;
    const diffPercent = lastMonthTotal ? (diff / lastMonthTotal) * 100 : 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Insights</Text>
                <TouchableOpacity onPress={fetchReport} style={[styles.refreshBtn, { backgroundColor: theme.colors.surface }]}>
                    <RefreshCw size={18} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
                    {months.map((m) => (
                        <TouchableOpacity 
                            key={m.value} 
                            style={[
                                styles.monthChip, 
                                { backgroundColor: selectedMonth === m.value ? theme.colors.primary : theme.colors.surface }
                            ]}
                            onPress={() => setSelectedMonth(m.value)}
                        >
                            <Text style={[
                                styles.monthText, 
                                { color: selectedMonth === m.value ? '#fff' : theme.colors.textSecondary }
                            ]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Stats Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
                    <View style={styles.summaryHeader}>
                        <BarChart2 color="#fff" size={24} />
                        <Text style={styles.summaryLabel}>Total Spent this Month</Text>
                    </View>
                    <Text style={styles.trendValue}>{totalSpent.toFixed(3)} TND</Text>
                    <View style={styles.trendChip}>
                        {diffPercent <= 0 ? <ArrowDownRight size={16} color="#4ade80" /> : <ArrowUpRight size={16} color="#fb7185" />}
                        <Text style={styles.trendPercent}>{Math.abs(diffPercent).toFixed(1)}% vs last month</Text>
                    </View>
                </View>

                {/* AI Advice Button */}
                {!aiInsights ? (
                    <TouchableOpacity 
                        style={[styles.aiButton, { backgroundColor: theme.colors.secondary }]} 
                        onPress={fetchAiAdvice}
                        disabled={aiLoading}
                    >
                        {aiLoading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Sparkles color="#fff" size={20} />
                                <Text style={styles.aiButtonText}>Ask AI for Analysis</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.adviceCard, { backgroundColor: theme.colors.secondary + '15', borderColor: theme.colors.secondary + '30' }]}>
                        <View style={styles.adviceHeader}>
                            <BrainCircuit size={20} color={theme.colors.secondary} />
                            <Text style={[styles.adviceTitle, { color: theme.colors.secondary }]}>AI Recommendation</Text>
                        </View>
                        <Text style={[styles.adviceText, { color: theme.colors.text }]}>{aiInsights.recommendation}</Text>
                        <Text style={[styles.forecastText, { color: theme.colors.textSecondary }]}>
                            Forecast for next month: <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{(aiInsights.next_month_forecast || 0).toFixed(3)} TND</Text>
                        </Text>
                    </View>
                )}

                {/* Category Breakdown (Visual) */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Category Breakdown</Text>
                {(!report?.categories || report.categories.length === 0) ? (
                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 20 }}>No expenses recorded for this month.</Text>
                ) : report.categories.map((item, index) => (
                    <View key={index} style={styles.catRow}>
                        <View style={styles.catInfo}>
                            <Text style={[styles.catName, { color: theme.colors.text }]}>{item.name}</Text>
                            <Text style={[styles.catAmount, { color: theme.colors.textSecondary }]}>{(item.total || 0).toFixed(3)} TND</Text>
                        </View>
                        <View style={[styles.progressBg, { backgroundColor: theme.colors.surface }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${totalSpent > 0 ? (item.total / totalSpent) * 100 : 0}%`,
                                        backgroundColor: item.color || theme.colors.primary 
                                    }
                                ]} 
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 14, fontWeight: 'bold' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60, paddingBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold' },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    monthSelector: { marginBottom: 10, paddingHorizontal: 25 },
    monthScroll: { gap: 10 },
    monthChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 1 },
    monthText: { fontSize: 13, fontWeight: 'bold' },
    scrollContent: { padding: 25, paddingTop: 10 },
    summaryCard: { borderRadius: 30, padding: 25, marginBottom: 20, elevation: 8 },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    summaryLabel: { color: '#ffffff90', fontSize: 14, fontWeight: 'bold' },
    trendValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 15 },
    trendChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', gap: 5 },
    trendPercent: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    aiButton: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 25, elevation: 4 },
    aiButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    adviceCard: { borderRadius: 22, padding: 20, marginBottom: 30, borderWidth: 1 },
    adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    adviceTitle: { fontSize: 16, fontWeight: 'bold' },
    adviceText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
    forecastText: { marginTop: 15, fontSize: 13 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    catRow: { marginBottom: 18 },
    catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    catName: { fontWeight: 'bold', fontSize: 15 },
    catAmount: { fontSize: 13 },
    progressBg: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 }
});

export default InsightsScreen;
