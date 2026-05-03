import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, Tag, FileText, IndianRupee, Save, ArrowLeft, Camera } from 'lucide-react-native';

const AddExpenseScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const editingExpense = route.params?.expense;

    const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
    const [description, setDescription] = useState(editingExpense?.description || '');
    const [categoryId, setCategoryId] = useState(editingExpense?.categoryId?._id || editingExpense?.categoryId || null);
    const [date, setDate] = useState(editingExpense?.date ? editingExpense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to scan receipts.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setIsScanning(true);
            try {
                const response = await apiClient.processReceipt(result.assets[0].base64);
                if (response.amount) {
                    setAmount(response.amount.toString());
                    setDescription(response.description || '');
                    const cat = categories.find(c => c.name.toLowerCase() === response.category?.toLowerCase());
                    if (cat) setCategoryId(cat._id);
                }
            } catch (e) {
                Alert.alert('OCR Error', 'Failed to read receipt. Please enter details manually.');
            } finally {
                setIsScanning(false);
            }
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await apiClient.getCategories();
            setCategories(cats);
        } catch (e) {
            console.error('Load categories error:', e);
        }
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

        setLoading(true);
        try {
            const expenseAmount = parseFloat(amount);
            
            // Safe Date Handling
            let finalDate = new Date();
            if (date) {
                const parsedDate = new Date(date);
                if (!isNaN(parsedDate.getTime())) {
                    finalDate = parsedDate;
                }
            }

            const expenseData = {
                amount: expenseAmount,
                categoryId,
                description,
                date: finalDate.toISOString()
            };

            if (editingExpense) {
                await apiClient.updateExpense(editingExpense._id, expenseData);
            } else {
                await apiClient.addExpense(expenseData);
            }

            // Budget Alert Logic (Only for new expenses)
            if (!editingExpense) {
                try {
                    const salary = await apiClient.getSalary();
                    const stats = await apiClient.getCategoryStats();
                    const cat = categories.find(c => c._id === categoryId);
                    const catStat = stats.find(s => s._id === categoryId);
                    const spentInCat = (catStat?.total || 0) + expenseAmount;
                    
                    const categoryBudget = 200; 
                    const percentage = (spentInCat / categoryBudget) * 100;

                    if (percentage >= 80) {
                        const alertData = await apiClient.getBudgetAlert({
                            category: cat?.name || 'Category',
                            budget: categoryBudget,
                            spent: spentInCat,
                            percentage: percentage.toFixed(1),
                            language: 'English'
                        });

                        Alert.alert(
                            alertData.title || 'Budget Alert',
                            `${alertData.body}\n\n💡 Tip: ${alertData.tip}`,
                            [{ text: 'Got it!', onPress: () => navigation.goBack() }]
                        );
                        return;
                    }
                } catch (alertErr) {
                    console.error('Alert logic error:', alertErr);
                }
            }

            Alert.alert('Success', editingExpense ? 'Expense updated' : 'Expense saved successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            console.error('Save Expense Error:', e);
            Alert.alert('Error', `Failed to save expense: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
                        <ArrowLeft color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Add Expense</Text>
                    <TouchableOpacity 
                        onPress={pickImage} 
                        style={[styles.scanBtn, { backgroundColor: theme.colors.primary + '15' }]}
                        disabled={isScanning}
                    >
                        {isScanning ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Camera color={theme.colors.primary} size={20} />}
                    </TouchableOpacity>
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

                    <View style={[styles.inputGroup, { backgroundColor: theme.colors.surface }]}>
                        <Calendar size={20} color={theme.colors.primary} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={date}
                            onChangeText={setDate}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Select Category</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Category')}>
                            <Tag size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[
                                    styles.categoryBtn,
                                    { backgroundColor: categoryId === cat._id ? theme.colors.primary : theme.colors.surface }
                                ]}
                                onPress={() => setCategoryId(cat._id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    { color: categoryId === cat._id ? '#fff' : theme.colors.text }
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
    backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    scanBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
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
