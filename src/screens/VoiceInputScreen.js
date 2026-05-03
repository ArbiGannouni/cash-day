import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Modal, FlatList } from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme } from '../hooks/ThemeContext';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Mic, Square, Sparkles, Check, RotateCcw, DollarSign, Tag, FileText, ChevronDown, Volume2 } from 'lucide-react-native';
import { apiClient } from '../api/client';
import { GoogleGenerativeAI } from "@google/generative-ai";

const VoiceInputScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [recording, setRecording] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [transcript, setTranscript] = useState('');

    // Editable states
    const [allCats, setAllCats] = useState([]);
    const [isCatModalVisible, setIsCatModalVisible] = useState(false);

    const speak = (text) => {
        Speech.speak(text.toString(), { language: 'ar-TN' });
    };

    useEffect(() => {
        loadCats();
    }, []);

    const loadCats = async () => {
        try {
            const cats = await apiClient.getCategories();
            setAllCats(cats);
        } catch (e) { console.error(e); }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
        } catch (err) { Alert.alert('Error', 'Failed to start recording'); }
    };

    const stopRecording = async () => {
        setRecording(null);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        processAudio(uri);
    };

    const processAudio = async (uri) => {
        setIsProcessing(true);
        setTranscript('');
        setResult(null);

        try {
            const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const response = await apiClient.processVoice(base64Audio);

            if (response && response.transcription) {
                setResult(response);
                setTranscript(response.transcription);
            } else {
                throw new Error('AI could not understand audio. Try speaking in Tunisian Darija.');
            }
        } catch (e) { 
            Alert.alert('AI Error', 'Could not process audio. Please try again or enter manually.');
            console.error(e);
        }
        finally { setIsProcessing(false); }
    };

    const [isManuallyEdited, setIsManuallyEdited] = useState(false);

    const handleSave = async () => {
        if (!result) return;
        
        const cat = allCats.find(c => c.name.toLowerCase() === (result.category || '').toLowerCase()) 
                  || allCats.find(c => c.name === 'Others') 
                  || allCats[allCats.length - 1];
        
        try {
            await apiClient.addExpense({
                amount: parseFloat(result.amount) || 0,
                categoryId: cat?._id,
                description: result.description || transcript,
                originalText: transcript,
                aiConfidence: result.confidence || 0,
                isManuallyEdited: isManuallyEdited,
                tags: result.tags || [],
                paymentMethod: result.paymentMethod || 'Cash',
                date: new Date().toISOString()
            });
            Alert.alert('Saved', 'Transaction added successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to save transaction');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>AI Voice Assistant</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Speak in Tunisian Arabic</Text>
            </View>

            <View style={styles.main}>
                {!result && !isProcessing && (
                    <TouchableOpacity
                        style={[styles.micBox, { backgroundColor: recording ? theme.colors.error + '10' : theme.colors.primary + '10' }]}
                        onPress={recording ? stopRecording : startRecording}
                    >
                        <View style={[styles.micCircle, { backgroundColor: recording ? theme.colors.error : theme.colors.primary }]}>
                            {recording ? <Square color="#fff" size={40} /> : <Mic color="#fff" size={40} />}
                        </View>
                        <Text style={[styles.statusText, { color: recording ? theme.colors.error : theme.colors.primary }]}>
                            {recording ? 'Stop Recording' : 'Start Speaking'}
                        </Text>
                    </TouchableOpacity>
                )}

                {isProcessing && (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Analyzing audio...</Text>
                    </View>
                )}

                {result && (
                    <ScrollView style={{ width: '100%' }}>
                        <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.transcriptBox}>
                                <Text style={[styles.transLabel, { color: theme.colors.textSecondary }]}>Heard:</Text>
                                <Text style={[styles.transText, { color: theme.colors.text }]}>{transcript}</Text>
                            </View>

                            {/* Editable Fields */}
                            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Amount (TND)</Text>
                            <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                                <DollarSign size={18} color={theme.colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    value={result.amount.toString()}
                                    onChangeText={(val) => {
                                        setResult({ ...result, amount: val });
                                        setIsManuallyEdited(true);
                                    }}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity onPress={() => speak(result.amount)}>
                                    <Volume2 size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Category</Text>
                            <TouchableOpacity
                                style={[styles.inputContainer, { borderColor: theme.colors.border }]}
                                onPress={() => setIsCatModalVisible(true)}
                            >
                                <Tag size={18} color={theme.colors.primary} />
                                <Text style={[styles.input, { color: theme.colors.text }]}>{result.category}</Text>
                                <ChevronDown size={18} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Description</Text>
                            <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                                <FileText size={18} color={theme.colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    value={result.description}
                                    onChangeText={(val) => {
                                        setResult({ ...result, description: val });
                                        setIsManuallyEdited(true);
                                    }}
                                />
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: '#f1f5f9' }]} onPress={() => setResult(null)}><RotateCcw size={18} color="#64748b" /><Text style={{ color: '#64748b', fontWeight: 'bold' }}>Retry</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={handleSave}><Check size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Category Modal */}
            <Modal visible={isCatModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Choose Category</Text>
                        <FlatList
                            data={allCats}
                            keyExtractor={(item) => item._id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.catItem, { borderBottomColor: theme.colors.border }]}
                                    onPress={() => {
                                        setResult({ ...result, category: item.name });
                                        setIsCatModalVisible(false);
                                        setIsManuallyEdited(true);
                                    }}
                                >
                                    <View style={[styles.catColor, { backgroundColor: item.color }]} />
                                    <Text style={[styles.catName, { color: theme.colors.text }]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCatModalVisible(false)}><Text style={{ color: theme.colors.error }}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 30, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 13, marginTop: 5 },
    main: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
    micBox: { width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center' },
    micCircle: { width: 95, height: 95, borderRadius: 48, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    statusText: { marginTop: 15, fontWeight: 'bold' },
    center: { alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 15 },
    resultCard: { width: '100%', padding: 20, borderRadius: 25, elevation: 5, marginBottom: 20 },
    transcriptBox: { backgroundColor: '#6366f108', padding: 15, borderRadius: 15, marginBottom: 20 },
    transLabel: { fontSize: 11, marginBottom: 5, fontWeight: 'bold' },
    transText: { fontSize: 16, fontStyle: 'italic' },
    editLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 15 },
    input: { flex: 1, marginLeft: 10, fontSize: 15 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    btn: { flex: 1, height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    catItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    catColor: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
    catName: { fontSize: 16 },
    closeBtn: { marginTop: 20, alignItems: 'center' }
});

export default VoiceInputScreen;
