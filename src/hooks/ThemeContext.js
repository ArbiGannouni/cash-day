import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../theme/theme';
import { getSettingDb } from '../database/db';
import { useSQLiteContext } from 'expo-sqlite';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const db = useSQLiteContext();
    const [themeMode, setThemeMode] = useState('light');

    useEffect(() => {
        loadSavedTheme();
    }, []);

    const loadSavedTheme = async () => {
        try {
            const savedTheme = await getSettingDb(db, 'theme_mode', 'light');
            setThemeMode(savedTheme);
        } catch (e) { console.error('Theme load error:', e); }
    };

    const theme = themeMode === 'dark' ? darkTheme : lightTheme;

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
