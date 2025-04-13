import { createContext, useContext, useState, useMemo } from 'react';
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

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [bgImage, setBgImage] = useState(false);
  const [customConfig, setCustomConfig] = useState({});
  // 生成 Ant Design 主题配置
  const antdThemeConfig = useMemo(() => {
    // 基础配置
    const baseConfig = {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        ...defaultThemeConfig.token,
        colorText: isDark ? '#ffffff' : '#333333',
      },
      components: {
        Layout: {
          headerBg: !bgImage ? (isDark ? '#000000' : '#efefef') : undefined,
          colorBgLayout: !bgImage ? (isDark ? '#000000' : '#f5f5f5') : undefined,
          siderBg: !bgImage ? (isDark ? '#000000' : '#efefef') : undefined,
          lightSiderBg: !bgImage ? (isDark ? '#000000' : '#ffffff') : undefined,
          footerBg: !bgImage ? (isDark ? '#000000' : '#f8f8f8') : undefined,
        },
        Menu: {
          itemBg: !bgImage ? (isDark ? '#000000' : '#ffffff') : undefined,
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
    
    // 操作方法
    toggleDarkMode: () => setIsDark(!isDark),
    setBackgroundImage: (useImage) => setBgImage(useImage),
    updateThemeConfig: (config) => {
      setCustomConfig(prev => ({ ...prev, ...config }));
    },
    resetThemeConfig: () => setCustomConfig({})
  }), [isDark, bgImage, antdThemeConfig]);

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