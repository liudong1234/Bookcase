import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import BookReader from './BookReader';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

// 创建一个独立的阅读器页面组件
const ReaderPage = ({ book }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const containerRef = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(book);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url); // 清理 URL，防止内存泄漏
  }, [book]);

  if (!blobUrl) return <p>加载中...</p>;
  return (
    <ConfigProvider>
      <div ref={containerRef} style={{ height: '100vh', width: '100vw' }}>
        <BookReader bookUrl={blobUrl} containerRef={containerRef} theme="light" navigation={{}} />
      </div>
    </ConfigProvider>
  );
};

// 导出用于打开新窗口的函数
export const openReaderWindow = (book) => {
  // 打开新窗口
  const readerWindow = window.open('', '_blank', 'width=1024,height=768');
  
  if (!readerWindow) {
    alert('请允许打开弹窗以查看书籍');
    return;
  }

  // 写入基础 HTML 结构
  readerWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>电子书阅读器</title>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; }
          #reader-root { height: 100vh; }
        </style>
      </head>
      <body>
        <div id="reader-root"></div>
      </body>
    </html>
  `);

  // 复制当前页面的样式表
  const styleSheets = [...document.styleSheets];
  styleSheets.forEach(styleSheet => {
    if (styleSheet.href) {
      const link = readerWindow.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleSheet.href;
      readerWindow.document.head.appendChild(link);
    }
  });

  // 等待样式表加载完成
  setTimeout(() => {
    // 创建 React root 并渲染组件
    const root = ReactDOM.createRoot(readerWindow.document.getElementById('reader-root'));
    root.render(
      <React.StrictMode>
        <ReaderPage book={book} />
      </React.StrictMode>
    );

    // 处理窗口关闭
    readerWindow.onbeforeunload = () => {
      root.unmount();
    };
  }, 100);

  return readerWindow;
};