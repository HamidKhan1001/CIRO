import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: S, 1: M, 2: L

  const fontScales = [0.85, 1, 1.25];
  const currentScale = fontScales[fontSizeIndex];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const dm = await AsyncStorage.getItem('darkMode');
    const fs = await AsyncStorage.getItem('fontSizeIndex');
    if (dm !== null) setDarkMode(dm === 'true');
    if (fs !== null) setFontSizeIndex(parseInt(fs));
  };

  const updateDarkMode = async (val) => {
    setDarkMode(val);
    await AsyncStorage.setItem('darkMode', val.toString());
  };

  const updateFontSize = async (val) => {
    setFontSizeIndex(val);
    await AsyncStorage.setItem('fontSizeIndex', val.toString());
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      fontSizeIndex, 
      currentScale, 
      updateDarkMode, 
      updateFontSize 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
