// src/utils/generateMenuItems.js
import React from 'react';
import { BookOutlined } from '@ant-design/icons';

export const generateMenuItems = (file, toc, bookmarks) => {
  return [
    {
      key: 'file',
      icon: <BookOutlined />,
      label: file,
    },
    {
      key: 'toc',
      label: 'Chapters',
      children: toc.map((item, index) => ({
        key: `toc-${index}`,
        label: item.label,
        onClick: () => {
          // 处理点击事件，更新全局状态
        },
      })),
    },
    {
      key: 'bookmarks',
      label: 'Bookmarks',
      children: bookmarks.map((item, index) => ({
        key: `bookmark-${index}`,
        label: `Bookmark ${index + 1}`,
        onClick: () => {
          // 处理点击事件，更新全局状态
        },
      })),
    },
  ];
};