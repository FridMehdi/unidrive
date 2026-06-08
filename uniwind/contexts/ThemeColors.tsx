import { useTheme } from './ThemeContext';

export const useThemeColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    icon: isDark ? 'white' : 'black',
    bg: isDark ? '#1C1C1E' : '#F4F4F5',
    invert: isDark ? '#ffffff' : '#000000',
    secondary: isDark ? '#2C2C2E' : '#ffffff',
    state: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)',
    sheet: isDark ? '#2C2C2E' : '#ffffff',
    highlight: '#00A6F4',    
    lightDark: isDark ? 'black' : 'white',
    border: isDark ? '#38383A' : '#E2E8F0',
    text: isDark ? 'white' : 'black',
    subtext: isDark ? '#98989D' : '#64748B',
    placeholder: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    switch: isDark ? '#39393D' : '#ccc',
    chatBg: isDark ? '#1C1C1E' : '#efefef',
    isDark
  };
};

export default useThemeColors;