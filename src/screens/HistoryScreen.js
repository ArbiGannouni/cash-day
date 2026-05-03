import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { DollarSign, Trash2, Volume2, FileSpreadsheet } from 'lucide-react-native';
import { apiClient } from '../api/client';

const HistoryScreen = ({ navigation }) => {
    const { theme } = useTheme();
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
                        try {
                            await apiClient.deleteExpense(id);
                            refreshExpenses();
                            Alert.alert('Deleted', 'Expense has been removed successfully.');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete expense.');
                        }
                    }
                }
            ]
        );
    };

    const exportToCSV = async () => {
        if (expenses.length === 0) {
            Alert.alert('No Data', 'There are no expenses to export.');
            return;
        }

        try {
            const header = 'Date,Category,Amount,Description\n';
            const rows = expenses.map(e => {
                const date = e.date ? e.date.split('T')[0] : 'N/A';
                const cat = e.categoryId?.name || 'General';
                const amt = e.amount || 0;
                const desc = (e.description || '').replace(/,/g, ' '); // Avoid CSV issues
                return `${date},${cat},${amt},${desc}`;
            }).join('\n');

            const csvContent = header + rows;
            const fileName = `flous_chhar_export_${new Date().getTime()}.csv`;
            const filePath = FileSystem.cacheDirectory + fileName;

            await FileSystem.writeAsStringAsync(filePath, csvContent);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to export expenses');
            console.error(e);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transaction History</Text>
                <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.colors.primary + '20' }]} onPress={exportToCSV}>
                    <FileSpreadsheet size={18} color={theme.colors.primary} />
                    <Text style={[styles.exportText, { color: theme.colors.primary }]}>Export CSV</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={expenses}
                keyExtractor={(item) => (item._id || Math.random()).toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    if (!item) return null;
                    return (
                        <TouchableOpacity 
                            style={[styles.transactionCard, { backgroundColor: theme.colors.surface }]}
                            onPress={() => navigation.navigate('AddExpense', { expense: item })}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: (item.categoryId?.color || theme.colors.primary) + '20' }]}>
                                <DollarSign size={20} color={item.categoryId?.color || theme.colors.primary} />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionCategory, { color: theme.colors.text }]}>{item.categoryId?.name || 'General Expense'}</Text>
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
                                <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 8 }}>
                                    <Trash2 size={16} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60, paddingBottom: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    exportBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    exportText: { fontSize: 13, fontWeight: 'bold' },
    listContent: { padding: 25, paddingTop: 0 },
    transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2 },
    categoryIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    transactionInfo: { flex: 1 },
    transactionCategory: { fontWeight: 'bold', fontSize: 16 },
    transactionDate: { fontSize: 11, marginTop: 2 },
    desc: { fontSize: 12, marginTop: 2 },
    transactionAmount: { fontWeight: 'bold', fontSize: 16 },
});

export default HistoryScreen;
