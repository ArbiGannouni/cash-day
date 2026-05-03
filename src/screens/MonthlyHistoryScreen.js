import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

const MonthlyHistoryScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMonthlySummary();
    }, []);

    const loadMonthlySummary = async () => {
        try {
            const stats = await apiClient.getMonthlyStats();
            const mapped = stats.map(s => ({
                key: s._id,
                label: format(parseISO(s._id + "-01"), 'MMMM yyyy'),
                total: s.totalSpent,
                count: s.count
            }));
            setMonthlyData(mapped);
        } catch (e) {
            console.error('Monthly summary error:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={monthlyData}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No data available yet</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: theme.colors.surface }]}
                        onPress={() => navigation.navigate('History', { monthFilter: item.key })}
                    >
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Calendar color={theme.colors.primary} size={24} />
                        </View>
                        <View style={styles.info}>
                            <Text style={[styles.monthLabel, { color: theme.colors.text }]}>{item.label}</Text>
                            <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>{item.count} transactions</Text>
                        </View>
                        <View style={styles.right}>
                            <Text style={[styles.totalAmount, { color: theme.colors.error }]}>-{item.total.toFixed(3)}</Text>
                            <ChevronRight color={theme.colors.textSecondary} size={18} />
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 20 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 3 },
    iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    monthLabel: { fontSize: 17, fontWeight: 'bold' },
    countText: { fontSize: 12, marginTop: 4 },
    right: { flexDirection: 'row', alignItems: 'center' },
    totalAmount: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
    empty: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default MonthlyHistoryScreen;
