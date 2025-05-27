import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

const defaultThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorInfo: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    borderRadius: 10,
  },
  components: {
    Layout: {
      headerBg: undefined,
      colorBgLayout: undefined,
      siderBg: undefined,
      lightSiderBg: undefined,
      footerBg: undefined,
    },
    Menu: {
      itemBg: undefined,
    }
  }
};

const ThemeContext = createContext();


// 读取 LocalStorage 中的主题配置
const loadThemeFromStorage = () => {
  try {
    const saved = localStorage.getItem('themeConfig');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('读取主题配置失败:', error);
    return null;
  }
};

// 保存主题配置到 LocalStorage
const saveThemeToStorage = (config) => {
  try {
    localStorage.setItem('themeConfig', JSON.stringify(config));
  } catch (error) {
    console.error('保存主题配置失败:', error);
  }
};

export const ThemeProvider = ({ children }) => {

  const savedConfig = loadThemeFromStorage();

  const [isDark, setIsDark] = useState(savedConfig?.isDark || false);
  const [bgImage, setBgImage] = useState(savedConfig?.bgImage || false);
  const [colorText, setColorText] = useState(savedConfig?.colorText || '');
  const [bgColor, setBgColor] = useState(savedConfig?.bgColor || '')
  const [customConfig, setCustomConfig] = useState(savedConfig?.customConfig || {});

  useEffect(() => {
    const currentConfig = {
      isDark,
      bgImage,
      bgColor,
      colorText,
      customConfig
    };
    saveThemeToStorage(currentConfig);
  }, [isDark, bgImage, bgColor, colorText, customConfig]);

  // 生成 Ant Design 主题配置
  const antdThemeConfig = useMemo(() => {
    // 基础配置
    const baseConfig = {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        ...defaultThemeConfig.token,
        colorText: isDark ? '#ffffff' : (colorText ? colorText : '#333333'),
        colorBgBase: isDark ? '333333' : (bgColor ? bgColor : '#ffffff'),
      },
      components: {
        Layout: {
          headerBg: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#efefef') : undefined,
          colorBgLayout: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#f5f5f5') : undefined,
          siderBg: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#efefef') : undefined,
          lightSiderBg: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#ffffff') : undefined,
          footerBg: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#f8f8f8') : undefined,
        },
        Menu: {
          itemBg: !bgImage ? (isDark ? '#000000' : bgColor ? bgColor : '#ffffff') : undefined,
        }
      }
    };

    // 深度合并自定义配置
    const deepMerge = (target, source) => {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };

    return deepMerge(baseConfig, customConfig);
  }, [isDark, bgImage, customConfig]);

  // 上下文值
  const contextValue = useMemo(() => ({
    // 状态
    isDark,
    bgImage,
    themeConfig: antdThemeConfig,
    bgColor,
    colorText,

    // 操作方法
    toggleDarkMode: () => setIsDark(!isDark),
    setBackgroundImage: (useImage) => setBgImage(useImage),
    setBackgroundColor: (color) => setBgColor(color),
    setTextColor: (color) => setColorText(color),
    updateThemeConfig: (config) => {
      setCustomConfig(prev => ({ ...prev, ...config }));
    },
    resetThemeConfig: () => setCustomConfig({})
  }), [isDark, bgImage, antdThemeConfig, bgColor, colorText]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={antdThemeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// 3. 创建自定义 Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};