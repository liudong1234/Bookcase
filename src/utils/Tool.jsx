import { useEffect } from 'react';
import { appDataDir } from '@tauri-apps/api/path';
const InvertColor = (hexColor) => {
  // 去掉 # 前缀
  hexColor = hexColor.replace(/^#/, '');
  
  // 如果是 3 位 Hex，转换为 6 位
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(c => c + c).join('');
  }
  
  // 解析 RGB 值
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  
  // 取反
  const invertedR = 255 - r;
  const invertedG = 255 - g;
  const invertedB = 255 - b;
  
  // 转换为 Hex
  const invertedHex = `#${(
    (invertedR << 16) |
    (invertedG << 8) |
    invertedB
  ).toString(16).padStart(6, '0')}`;
  
  return invertedHex;
};


export const useKeyboardNavigation = (prevPage, nextPage) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 忽略输入框中的按键
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPage, nextPage]);
};

export const useScrollNavigation = (containerRef, options = {}) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const step = options.step || 100; // 默认每次滚动100px
    const smooth = options.smooth !== false; // 默认启用平滑滚动

    const handleKeyDown = (e) => {
      // 忽略输入框中的按键
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      let scrollTo;
      switch(e.key) {
        case 'ArrowUp':
          scrollTo = container.scrollTop - step;
          break;
        case 'ArrowDown':
          scrollTo = container.scrollTop + step;
          break;
        default:
          return;
      }

      // 阻止默认滚动行为
      e.preventDefault();
      
      // 执行滚动
      if (smooth) {
        container.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = scrollTo;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, options.step, options.smooth]);
};


export const directory = await appDataDir();
export default InvertColor;