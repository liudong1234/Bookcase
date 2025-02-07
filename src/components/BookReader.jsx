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

const BookReader = ({ bookUrl, containerRef }) => {
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

    // 处理字体大小变化
    const handleFontSizeChange = (value) => {
        setFontSize(value);
        rendition?.themes.fontSize(`${value}px`);
    };

    const handlePageChange = async (direction) => {
        if (!rendition) return;

        try {
            if (direction === 'prev') {
                await rendition.prev();
            } else {
                await rendition.next();
            }
        } catch (error) {
            console.error('Page change error:', error);
            message.error('页面切换失败');
        }
    };

    const handleChapterClick = async (href) => {
        if (!rendition) return;

        try {
            console.log('Navigating to chapter:', href);
            await rendition.display(href);
            setDrawerVisible(false);
        } catch (error) {
            console.error('Chapter navigation error:', error);
            message.error('章节跳转失败');
        }
    };

    // 处理主题切换
    const handleThemeChange = (checked) => {
        setIsDarkMode(checked);
        rendition?.themes.select(checked ? 'dark' : 'light');
    };

    // 添加书签
    const addBookmark = () => {
        if (currentCfi) {
            const newBookmark = {
                cfi: currentCfi,
                text: `第 ${currentPage} 页`,
                timestamp: new Date().toLocaleString()
            };
            setBookmarks(prev => [...prev, newBookmark]);
            message.success('书签添加成功');
        }
    };

    // 跳转到书签位置
    const goToBookmark = (cfi) => {
        rendition?.display(cfi);
        setDrawerVisible(false);
    };

    // 删除书签
    const removeBookmark = (cfiToRemove) => {
        setBookmarks(prev => prev.filter(b => b.cfi !== cfiToRemove));
        message.success('书签删除成功');
    };

    // 定义抽屉内容
    const drawerItems = [
        {
            key: '1',
            label: '目录',
            children: (
                <List
                    dataSource={toc}
                    renderItem={item => (
                        <List.Item
                            onClick={() => handleChapterClick(item.href)}
                            style={{
                                cursor: 'pointer',
                                padding: '8px 16px'
                            }}
                        >
                            <span style={{
                                display: 'block',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {item.label}
                            </span>
                        </List.Item>
                    )}
                />
            )
        },
        {
            key: '2',
            label: '书签',
            children: (
                <div>
                    <Button
                        type="primary"
                        icon={<BookOutlined />}
                        onClick={addBookmark}
                        style={{ marginBottom: 16, width: '100%' }}
                    >
                        添加书签
                    </Button>
                    <List
                        dataSource={bookmarks}
                        renderItem={bookmark => (
                            <Card
                                size="small"
                                style={{ marginBottom: 8 }}
                                actions={[
                                    <DeleteOutlined key="delete" onClick={() => removeBookmark(bookmark.cfi)} />
                                ]}
                            >
                                <Card.Meta
                                    title={bookmark.text}
                                    description={bookmark.timestamp}
                                    onClick={() => goToBookmark(bookmark.cfi)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </Card>
                        )}
                    />
                </div>
            )
        },
        {
            key: '3',
            label: '设置',
            children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Title level={5}>字体大小</Title>
                        <Slider
                            min={12}
                            max={32}
                            value={fontSize}
                            onChange={handleFontSizeChange}
                        />
                    </div>
                    <Divider />
                    <div>
                        <Title level={5}>夜间模式</Title>
                        <Switch
                            checked={isDarkMode}
                            onChange={handleThemeChange}
                        />
                    </div>
                </Space>
            )
        }
    ];

    // 创建一个单独的容器元素用于渲染 epub 内容
    const [readerContainer] = useState(() => {
        const div = document.createElement('div');
        div.style.height = '100%';
        div.style.width = '100%';
        return div;
    });

    // 检查 URL 是否为 Blob URL
    const isBlobUrl = (url) => {
        try {
            return url.startsWith('blob:');
        } catch {
            return false;
        }
    };

    // 检查是否为 File 对象
    const isFileObject = (obj) => {
        return obj instanceof File;
    };

    // 从 URL 或 File 对象加载电子书
    const loadBook = async (source) => {
        try {
            let book;
            let bookData;

            if (typeof source === 'string' && !isBlobUrl(source)) {
                console.log('Loading book from URL:', source);
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error(`Failed to fetch book: ${response.statusText}`);
                }
                bookData = await response.arrayBuffer();
                console.log('Book data fetched, size:', bookData.byteLength);
            } else if (isFileObject(source)) {
                console.log('Loading book from File object');
                bookData = await source.arrayBuffer();
            } else if (source instanceof Blob) {
                console.log('Loading book from Blob');
                bookData = await source.arrayBuffer();
            } else if (isBlobUrl(source)) {
                console.log('Loading book from Blob URL');
                const response = await fetch(source);
                bookData = await response.arrayBuffer();
            } else {
                throw new Error('Unsupported book source type');
            }

            // 使用 arrayBuffer 创建 book 实例
            book = new EpubBook(bookData);

            // 添加事件监听器来帮助调试
            book.on('book:ready', () => {
                console.log('Book ready event fired');
            });

            book.on('book:error', (error) => {
                console.error('Book error event:', error);
            });

            return book;
        } catch (error) {
            console.error('Error in loadBook:', error);
            throw error;
        }
    };

    // 初始化函数修改
    const initializeReader = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!viewerRef.current) {
                throw new Error('Viewer reference not found');
            }

            if (!bookUrl) {
                throw new Error('Book source is required');
            }

            console.log('Starting reader initialization');

            // 清空之前的内容
            viewerRef.current.innerHTML = '';
            viewerRef.current.appendChild(readerContainer);

            // 加载电子书
            console.log('Loading book...');
            const epubBook = await loadBook(bookUrl);
            readerRef.current = epubBook;

            // 设置超时检查
            const readyTimeout = setTimeout(() => {
                console.warn('Book ready state timeout - attempting to continue anyway');
                proceedWithRendering(epubBook);
            }, 5000); // 5秒超时

            try {
                console.log('Waiting for book ready state...');
                await Promise.race([
                    new Promise((resolve, reject) => {
                        epubBook.ready
                            .then(() => {
                                console.log('Book ready promise resolved');
                                clearTimeout(readyTimeout);
                                resolve();
                            })
                            .catch(err => {
                                console.error('Book ready promise error:', err);
                                reject(new Error('Book loading failed: ' + err.message));
                            });
                    }),
                    new Promise((resolve) => setTimeout(resolve, 5000)) // 5秒后自动继续
                ]);
            } catch (error) {
                console.warn('Ready state error, attempting to continue:', error);
            }

            await proceedWithRendering(epubBook);

        } catch (error) {
            console.error('Error in initializeReader:', error);
            setError(`加载电子书失败: ${error.message}`);
            setIsLoading(false);
        }
    };

    // 将渲染逻辑分离到单独的函数
    const proceedWithRendering = async (epubBook) => {
        try {
            console.log('Loading metadata...');
            const metadata = await epubBook.loaded.metadata;
            console.log('Metadata loaded:', metadata);
            setBookTitle(metadata.title || 'Untitled Book');

            console.log('Creating rendition...');
            const rendition = epubBook.renderTo(readerContainer, {
                width: '100%',
                height: '100%',
                spread: 'none',
                flow: 'paginated',
                manager: 'default',
                minSpreadWidth: 800,
                allowScriptedContent: true,
            });

            setRendition(rendition);

            // 设置键盘事件监听
            rendition.on('keyup', (event) => {
                const kc = event.keyCode || event.which;
                if (kc == 37) {
                    handlePageChange('prev');
                }
                if (kc == 39) {
                    handlePageChange('next');
                }
            });

            // 确保有一个默认章节可以显示
            const initialLocation = epubBook.spine.get(0)?.href || undefined;
            console.log('Displaying initial content at:', initialLocation);
            await rendition.display(initialLocation);

            try {
                console.log('Loading navigation...');
                const navigation = await epubBook.loaded.navigation;
                if (navigation && navigation.toc) {
                    console.log('TOC loaded:', navigation.toc);
                    setToc(navigation.toc);
                }
            } catch (navError) {
                console.warn('Navigation loading error:', navError);
                // 继续执行，不让导航错误影响整体功能
            }

            rendition.themes.fontSize(`${fontSize}px`);
            rendition.themes.register('light', {
                body: { color: '#000', background: '#fff' }
            });
            rendition.themes.register('dark', {
                body: { color: '#fff', background: '#1f1f1f' }
            });

            rendition.on('relocated', (location) => {
                setCurrentCfi(location.start.cfi);
                setCurrentPage(location.start.location);
                if (epubBook.locations && epubBook.locations.total) {
                    setTotalPages(epubBook.locations.total);
                }
            });

            try {
                console.log('Generating locations...');
                await epubBook.locations.generate();
            } catch (locError) {
                console.warn('Locations generation error:', locError);
                // 继续执行，不让位置生成错误影响整体功能
            }

            console.log('Reader initialization complete');
            setIsLoading(false);
        } catch (error) {
            console.error('Error in proceedWithRendering:', error);
            throw error;
        }
    };

    useEffect(() => {
        initializeReader();
        return () => {
            if (readerRef.current) {
                readerRef.current.destroy();
            }
            if (viewerRef.current) {
                viewerRef.current.innerHTML = '';
            }
        };
    }, [bookUrl]);

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

    return (
        <Layout
            className={isDarkMode ? 'dark' : ''}
            style={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Header style={{
                background: isDarkMode ? '#1f1f1f' : '#fff',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f0f0f0',
                height: '48px',
                lineHeight: '48px'
            }}>
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setDrawerVisible(true)}
                />
                <span style={{
                    color: isDarkMode ? '#fff' : 'inherit'
                }}>
                    {currentPage} / {totalPages || '?'}
                </span>
            </Header>

            <Content style={{
                height: 'calc(100% - 96px)',
                background: isDarkMode ? '#1f1f1f' : '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div
                    ref={viewerRef}
                    style={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                />
            </Content>

            <Footer style={{
                height: '48px',
                padding: '8px 16px',
                background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Button onClick={() => handlePageChange('prev')}>
                    上一页
                </Button>
                <Button onClick={() => handlePageChange('next')}>
                    下一页
                </Button>
            </Footer>

            {containerRef?.current && (
                <Drawer
                    title={bookTitle || '电子书阅读器'}
                    placement="left"
                    width={320}
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    getContainer={containerRef.current}
                    style={{
                        position: 'absolute'
                    }}
                >
                    <Tabs items={drawerItems} />
                </Drawer>
            )}
        </Layout>
    );
};

export default BookReader;