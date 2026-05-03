import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { ArrowLeft, Plus, Minus, DollarSign, Trash2, TrendingUp, Calendar } from 'lucide-react-native';

const IncomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const loadIncomes = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getIncomes();
            setIncomes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIncomes();
    }, []);

    const handleEdit = (item) => {
        setAmount(Math.abs(item.amount).toString());
        setDescription(item.description);
        setDate(item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setEditingId(item._id);
    };

    const handleAddIncome = async (isReduction = false) => {
        if (!amount || isNaN(amount)) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setAdding(true);
        try {
            const finalAmount = isReduction ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
            const incomeData = {
                amount: finalAmount,
                description: description || (isReduction ? 'Reduction' : 'Income'),
                date: new Date(date).toISOString()
            };

            if (editingId) {
                await apiClient.updateIncome(editingId, incomeData);
                setEditingId(null);
            } else {
                await apiClient.addIncome(incomeData);
            }

            setAmount('');
            setDescription('');
            loadIncomes();
            Alert.alert('Success', 'Balance updated');
        } catch (e) {
            Alert.alert('Error', 'Failed to update balance');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    await apiClient.deleteIncome(id);
                    loadIncomes();
                }
            }
        ]);
    };

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
                    <ArrowLeft color={theme.colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Income Management</Text>
                <View style={{ width: 45 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.balanceLabel}>Total Added Income</Text>
                    <Text style={styles.balanceValue}>{totalIncome.toFixed(3)} TND</Text>
                </View>

                <View style={[styles.form, { backgroundColor: theme.colors.surface }]}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
                        placeholder="Amount (e.g. 500)"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
                        placeholder="Description (e.g. Bonus)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 25 }}>
                        <Calendar size={18} color={theme.colors.primary} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderBottomWidth: 0, marginBottom: 0, flex: 1, marginLeft: 10 }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={date}
                            onChangeText={setDate}
                        />
                    </View>

                    <View style={styles.btnRow}>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#4ade80' }]} 
                            onPress={() => handleAddIncome(false)}
                            disabled={adding}
                        >
                            <Plus color="#fff" size={20} />
                            <Text style={styles.btnText}>{editingId ? 'Update' : 'Add'}</Text>
                        </TouchableOpacity>
                        {!editingId && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#fb7185' }]} 
                                onPress={() => handleAddIncome(true)}
                                disabled={adding}
                            >
                                <Minus color="#fff" size={20} />
                                <Text style={styles.btnText}>Reduce</Text>
                            </TouchableOpacity>
                        )}
                        {editingId && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: theme.colors.textSecondary }]} 
                                onPress={() => { setEditingId(null); setAmount(''); setDescription(''); }}
                            >
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Entries</Text>
                {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : (
                    <FlatList
                        data={incomes}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.incomeItem, { backgroundColor: theme.colors.surface, borderWidth: editingId === item._id ? 1 : 0, borderColor: theme.colors.primary }]}
                                onPress={() => handleEdit(item)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? '#4ade8020' : '#fb718520' }]}>
                                    <TrendingUp size={20} color={item.amount > 0 ? '#4ade80' : '#fb7185'} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemDesc, { color: theme.colors.text }]}>{item.description}</Text>
                                    <Text style={[styles.itemDate, { color: theme.colors.textSecondary }]}>{item.date.split('T')[0]}</Text>
                                </View>
                                <Text style={[styles.itemAmt, { color: item.amount > 0 ? '#4ade80' : '#fb7185' }]}>
                                    {item.amount > 0 ? '+' : ''}{item.amount.toFixed(3)}
                                </Text>
                                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.delBtn}>
                                    <Trash2 size={16} color={theme.colors.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 25, flex: 1 },
    balanceCard: { borderRadius: 25, padding: 25, marginBottom: 25, elevation: 5 },
    balanceLabel: { color: '#ffffff90', fontSize: 14, fontWeight: 'bold' },
    balanceValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
    form: { padding: 20, borderRadius: 22, marginBottom: 30, elevation: 2 },
    input: { height: 50, borderBottomWidth: 1, marginBottom: 15, fontSize: 16 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    actionBtn: { flex: 1, height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    incomeItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 10, elevation: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemDesc: { fontWeight: 'bold', fontSize: 15 },
    itemDate: { fontSize: 11, marginTop: 2 },
    itemAmt: { fontWeight: 'bold', fontSize: 15, marginRight: 15 },
    delBtn: { padding: 5 }
});

export default IncomeScreen;
