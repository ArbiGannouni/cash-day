import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { useSQLiteContext } from 'expo-sqlite';
import { getCategories, addExpense } from '../database/db';
import { Calendar, Tag, FileText, IndianRupee, Save, ArrowLeft } from 'lucide-react-native';

const AddExpenseScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const db = useSQLiteContext();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await getCategories(db);
        setCategories(cats);
    };

    const handleSave = async () => {
        if (!amount || isNaN(amount)) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        if (!categoryId) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        try {
            await addExpense(db, parseFloat(amount), categoryId, description, new Date().toISOString());
            Alert.alert('Success', 'Expense saved successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to save expense');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Add Expense</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <View style={[styles.inputGroup, { backgroundColor: theme.colors.surface }]}>
                        <IndianRupee size={20} color={theme.colors.primary} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text }]}
                            placeholder="0.000"
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: theme.colors.surface }]}>
                        <FileText size={20} color={theme.colors.primary} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text }]}
                            placeholder="Description (Optional)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Select Category</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryBtn,
                                    { backgroundColor: categoryId === cat.id ? theme.colors.primary : theme.colors.surface }
                                ]}
                                onPress={() => setCategoryId(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    { color: categoryId === cat.id ? '#fff' : theme.colors.text }
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
                        <Save color="#fff" size={20} />
                        <Text style={styles.saveBtnText}>Save Expense</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 25 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 15, marginBottom: 20, height: 60, elevation: 2 },
    input: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: '600' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    categoryBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 2, minWidth: '28%', alignItems: 'center' },
    categoryText: { fontWeight: 'bold', fontSize: 13 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 18, gap: 10, marginTop: 10, elevation: 5 },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddExpenseScreen;
