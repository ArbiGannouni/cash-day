import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme } from '../hooks/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { DollarSign, Trash2, Volume2 } from 'lucide-react-native';
import { deleteExpenseDb } from '../database/db';
import { useSQLiteContext } from 'expo-sqlite';

const HistoryScreen = () => {
    const { theme } = useTheme();
    const db = useSQLiteContext();
    const { expenses, refreshExpenses } = useExpenses();

    const speak = (text) => {
        Speech.speak(text.toString(), { language: 'ar-TN' });
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteExpenseDb(db, id);
                        refreshExpenses();
                        Alert.alert('Deleted', 'Expense has been removed successfully.');
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={expenses}
                keyExtractor={(item) => (item.id || Math.random()).toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    if (!item) return null;
                    return (
                        <View style={[styles.transactionCard, { backgroundColor: theme.colors.surface }]}>
                            <View style={[styles.categoryIcon, { backgroundColor: (item.categoryColor || theme.colors.primary) + '20' }]}>
                                <DollarSign size={20} color={item.categoryColor || theme.colors.primary} />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionCategory, { color: theme.colors.text }]}>{item.categoryName || 'General Expense'}</Text>
                                <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>{item.date?.split('T')[0]}</Text>
                                <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => speak(item.amount.toFixed(3))} style={{ marginRight: 8 }}>
                                        <Volume2 size={16} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.transactionAmount, { color: theme.colors.error }]}>-{item.amount?.toFixed(3)}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginTop: 8 }}>
                                    <Trash2 size={16} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 25 },
    transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2 },
    categoryIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    transactionInfo: { flex: 1 },
    transactionCategory: { fontWeight: 'bold', fontSize: 16 },
    transactionDate: { fontSize: 11, marginTop: 2 },
    desc: { fontSize: 12, marginTop: 2 },
    transactionAmount: { fontWeight: 'bold', fontSize: 16 },
});

export default HistoryScreen;
