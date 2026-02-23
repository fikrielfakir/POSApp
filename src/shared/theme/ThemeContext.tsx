import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from './theme';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode; forceDark?: boolean }> = ({
  children,
  forceDark,
}) => {
  const scheme = useColorScheme();
  const isDark = forceDark !== undefined ? forceDark : scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
