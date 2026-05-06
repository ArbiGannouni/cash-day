import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { apiClient } from '../api/client';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Car, Home, Heart, Briefcase, Coffee, Music, Camera, Gift, Tag } from 'lucide-react-native';

const CategoryScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3b82f6');
    const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const icons = [
        { name: 'ShoppingCart', Icon: ShoppingCart },
        { name: 'Car', Icon: Car },
        { name: 'Home', Icon: Home },
        { name: 'Heart', Icon: Heart },
        { name: 'Briefcase', Icon: Briefcase },
        { name: 'Coffee', Icon: Coffee },
        { name: 'Music', Icon: Music },
        { name: 'Camera', Icon: Camera },
        { name: 'Gift', Icon: Gift },
    ];

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getCategories();
            setCategories(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleAddCategory = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        try {
            await apiClient.addCategory({
                name: name.trim(),
                color: selectedColor,
                icon: selectedIcon
            });
            setName('');
            loadCategories();
            Alert.alert('Success', 'Category added');
        } catch (e) {
            Alert.alert('Error', 'Failed to add category');
        }
    };

    const getIconComponent = (iconName) => {
        const found = icons.find(i => i.name === iconName);
        return found ? found.Icon : Tag;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
                    <ArrowLeft color={theme.colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Manage Categories</Text>
                <View style={{ width: 45 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.form, { backgroundColor: theme.colors.surface }]}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
                        placeholder="Category Name (e.g. Hobby)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />
                    
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                        {colors.map(color => (
                            <TouchableOpacity 
                                key={color} 
                                style={[styles.colorCircle, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: theme.colors.text }]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
                        {icons.map(({ name: iconName, Icon }) => (
                            <TouchableOpacity 
                                key={iconName} 
                                style={[styles.iconCircle, { backgroundColor: selectedIcon === iconName ? theme.colors.primary + '20' : 'transparent' }]}
                                onPress={() => setSelectedIcon(iconName)}
                            >
                                <Icon size={24} color={selectedIcon === iconName ? theme.colors.primary : theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddCategory}>
                        <Plus color="#fff" size={20} />
                        <Text style={styles.addBtnText}>Create Category</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Existing Categories</Text>
                {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : (
                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        renderItem={({ item }) => {
                            const IconComp = getIconComponent(item.icon);
                            return (
                                <View style={[styles.catItem, { backgroundColor: theme.colors.surface }]}>
                                    <View style={[styles.catIconBox, { backgroundColor: (item.color || theme.colors.primary) + '20' }]}>
                                        <IconComp size={22} color={item.color || theme.colors.primary} />
                                    </View>
                                    <Text style={[styles.catName, { color: theme.colors.text }]}>{item.name}</Text>
                                    <View style={[styles.colorDot, { backgroundColor: item.color || theme.colors.primary }]} />
                                </View>
                            );
                        }}
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
    form: { padding: 20, borderRadius: 22, marginBottom: 30, elevation: 2 },
    input: { height: 50, borderBottomWidth: 1, marginBottom: 20, fontSize: 16 },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    colorRow: { flexDirection: 'row', marginBottom: 20 },
    colorCircle: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
    iconRow: { flexDirection: 'row', marginBottom: 25 },
    iconCircle: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    addBtn: { height: 55, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    catItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 10, elevation: 1 },
    catIconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    catName: { flex: 1, fontWeight: 'bold', fontSize: 16 },
    colorDot: { width: 12, height: 12, borderRadius: 6 }
});

export default CategoryScreen;
