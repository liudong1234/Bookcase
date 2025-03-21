import {BaseDirectory } from "@tauri-apps/plugin-fs";

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
export const directory = BaseDirectory.AppData;
export default InvertColor;