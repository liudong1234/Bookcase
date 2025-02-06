import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Button, 
  Drawer, 
  Tabs, 
  Card, 
  Slider, 
  Switch, 
  List,
  Typography,
  Space,
  Divider,
  message, 
  Spin
} from 'antd';
import { MenuOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import { Book as EpubBook } from 'epubjs';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const BookReader = ({ bookUrl }) => {
  const viewerRef = useRef(null);
  const readerRef = useRef(null);
  const [rendition, setRendition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [bookmarks, setBookmarks] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [toc, setToc] = useState([]);
  const [currentCfi, setCurrentCfi] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookTitle, setBookTitle] = useState('');

  // 创建一个单独的容器元素用于渲染 epub 内容
  const [readerContainer] = useState(() => {
    const div = document.createElement('div');
    div.style.height = '100%';
    div.style.width = '100%';
    return div;
  });

  // 初始化 EPUB 阅读器
  useEffect(() => {
    if (!bookUrl) {
      setError('未提供电子书地址');
      setIsLoading(false);
      return;
    }

    const initializeReader = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 确保 viewer 容器已经准备好
        if (!viewerRef.current) return;
        
        // 清空之前的内容
        viewerRef.current.innerHTML = '';
        // 添加新的容器
        viewerRef.current.appendChild(readerContainer);

        // 创建新的 EPUB 实例
        const epubBook = new EpubBook(bookUrl);
        readerRef.current = epubBook;

        // 等待书籍打开
        await epubBook.open(bookUrl);
        
        // 等待书籍加载完成
        await new Promise((resolve) => {
          epubBook.ready.then(() => {
            resolve();
          }).catch(err => {
            throw new Error('Book loading failed: ' + err.message);
          });
        });

        // 获取书籍元数据
        const metadata = await epubBook.loaded.metadata;
        setBookTitle(metadata.title);

        // 创建渲染器
        const rendition = epubBook.renderTo(readerContainer, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
        });
        
        setRendition(rendition);

        // 显示初始页面
        await rendition.display();

        // 获取目录
        const navigation = await epubBook.loaded.navigation;
        if (navigation && navigation.toc) {
          setToc(navigation.toc);
        }

        // 设置字体大小
        rendition.themes.fontSize(`${fontSize}px`);

        // 设置主题
        rendition.themes.register('light', {
          body: { 
            color: '#000', 
            background: '#fff' 
          }
        });
        rendition.themes.register('dark', {
          body: { 
            color: '#fff', 
            background: '#1f1f1f' 
          }
        });
        
        // 监听页面变化
        rendition.on('relocated', (location) => {
          setCurrentCfi(location.start.cfi);
          setCurrentPage(location.start.location);
          if (epubBook.locations && epubBook.locations.total) {
            setTotalPages(epubBook.locations.total);
          }
        });

        // 生成页面位置
        await epubBook.locations.generate();

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing reader:', error);
        setError(`加载电子书失败: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeReader();

    // 清理函数
    return () => {
      if (readerRef.current) {
        readerRef.current.destroy();
      }
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }
    };
  }, [bookUrl]);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>正在加载电子书...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '20px'
      }}>
        <Text type="danger" style={{ marginBottom: '20px' }}>{error}</Text>
        <Button type="primary" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  }

  // ... 其他功能代码（书签、导航等）保持不变 ...

  return (
    <Layout className={isDarkMode ? 'dark' : ''}>
      <Header style={{ 
        background: isDarkMode ? '#1f1f1f' : '#fff',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
        />
        <Text style={{ color: isDarkMode ? '#fff' : 'inherit' }}>
          {currentPage} / {totalPages || '?'}
        </Text>
      </Header>

      <Drawer
        title={bookTitle || '电子书阅读器'}
        placement="left"
        width={320}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Tabs items={drawerItems} />
      </Drawer>

      <Content style={{
        height: 'calc(100vh - 128px)',
        background: isDarkMode ? '#1f1f1f' : '#fff',
        position: 'relative',
        overflow: 'hidden' // 防止内容溢出
      }}>
        <div 
          ref={viewerRef} 
          style={{ 
            height: '100%',
            width: '100%',
            position: 'relative'
          }}
        />
      </Content>

      <Footer style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        padding: 16,
        background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Button onClick={() => rendition?.prev()}>
          上一页
        </Button>
        <Button onClick={() => rendition?.next()}>
          下一页
        </Button>
      </Footer>
    </Layout>
  );
};

export default BookReader;