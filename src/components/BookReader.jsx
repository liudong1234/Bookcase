import { useState, useRef, useEffect } from 'react';
import { Layout, Button, Drawer, Tooltip, message, Select } from 'antd';
import {
    ArrowLeftOutlined,
    MenuOutlined,
    FontSizeOutlined,
    LeftOutlined,
    RightOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    CiCircleTwoTone
} from '@ant-design/icons';
import Epub from 'epubjs';
import './BookReader.css';

const { Header, Content } = Layout;


// IndexedDB 配置
const DB_NAME = 'BookSettings';
const DB_VERSION = 1;
const STORE_NAMES = {
    FONTSIZE: 'books',
    FONTFAMILY: 'covers'

};


const BookReader = ({ book, onClose }) => {
    const [fontSize, setFontSize] = useState(16);
    const [theme, setTheme] = useState('light');
    const [showToc, setShowToc] = useState(false);
    const [toc, setToc] = useState([]);
    const [currentCfi, setCurrentCfi] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rendition, setRendition] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [readingMode, setReadingMode] = useState('paginated');
    const [managerMode, setManagerMode] = useState('default');
    const viewerRef = useRef(null);
    const bookRef = useRef(null);

    // 生成唯一标识符的辅助函数（根据目录路径）
    const getItemKey = (item, parentPath = '') => {
        const currentPath = `${parentPath}-${item.id || item.label}`;
        return currentPath;
    };
    // 初始化电子书
    useEffect(() => {
        const initBook = async () => {
            try {
                if (!book) return;

                bookRef.current = new Epub(book);

                // 等待书籍加载完成
                await bookRef.current.ready;
                let manger = 'default';
                if (managerMode === 'continuous') {
                    console.log("执行了");
                    manger = 'continuous';
                }
                else if (readingMode === 'scrolled') {
                    manger = 'scrolled';
                }
                else {
                    manger = 'default';
                }

                // 创建渲染器
                const rendition = bookRef.current.renderTo(viewerRef.current, {
                    width: '100%',
                    height: '100%',
                    spread: 'none',
                    flow: readingMode, //paginated  scrolled
                    manager: manger,
                });
                setRendition(rendition);

                // 加载目录
                const navigation = await bookRef.current.loaded.navigation;
                setToc(navigation.toc);

                // 恢复上次阅读位置
                const savedCfi = localStorage.getItem(`book-progress-${book.name}`);
                if (savedCfi) {
                    rendition.display(savedCfi);
                } else {
                    rendition.display();
                }

                // 设置主题
                rendition.themes.default({
                    body: {
                        'font-size': `${fontSize}px`,
                        'background-color': theme === 'light' ? '#fff' : '#1f1f1f',
                        color: theme === 'light' ? '#000' : '#fff'
                    }
                });

                // 监听位置变化(垂直阅读模式)
                rendition.on('relocated', async (location) => {
                    setCurrentCfi(location.start.cfi);
                    localStorage.setItem(`book-progress-${book.name}`, location.start.cfi);
                });


            } catch (error) {
                console.error('Error initializing book:', error);
                message.error('加载书籍失败，请重试');
            }
        };

        initBook();

        return () => {
            if (bookRef.current) {
                bookRef.current.destroy();
            }
        };
    }, [book]);

    // 更新字体大小
    useEffect(() => {
        if (rendition) {
            rendition.themes.default({
                body: { 'font-size': `${fontSize}px !important` }
            });
        }
    }, [fontSize]);

    // 更新主题
    useEffect(() => {
        if (rendition) {
            rendition.themes.default({
                body: {
                    'background-color': theme === 'light' ? '#fff' : '#1f1f1f',
                    color: theme === 'light' ? '#000' : '#fff'
                }
            });
        }
    }, [theme]);

    // 切换全屏
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
        console.log(rendition);
    };

    // 翻页功能
    const handleKeyPress = (e) => {
        if (e.key === 'ArrowLeft') {
            rendition?.prev();
        } else if (e.key === 'ArrowRight') {
            rendition?.next();
        }
    };

    useEffect(() => {
        window.addEventListener('keyup', handleKeyPress);
        return () => {
            window.removeEventListener('keyup', handleKeyPress);
        };
    }, [rendition]);

    // 处理目录点击
    const handleTocSelect = (href) => {
        rendition?.display(href);
        setShowToc(false);
    };

    // 切换阅读模式
    const handleModeChange = (value) => {
        if (value === 'successive') {
            setManagerMode('continuous')
            value = 'scrolled';
        }
        else if (value === 'simulation') {
            setManagerMode('continuous')
            value = 'paginated';
        }
        else {
            setManagerMode('default');
        }
        console.log('manager', managerMode);
        setReadingMode(value);
        rendition?.flow(value);
    };


    // 仿真翻页效果
    const flipPage = (direction) => {
        const viewer = viewerRef.current;
        viewer.classList.add('flip-animation');
        setTimeout(() => {
            if (direction === 'next') {
                rendition?.next();
            } else if (direction === 'prev') {
                rendition?.prev();
            }
            viewer.classList.remove('flip-animation');
        }, 300); // 动画时长 300ms
    };

    const TocItem = ({ item, level = 0, parentPath = '' }) => {
        const itemKey = getItemKey(item, parentPath);
        const hasSubItems = item.subitems?.length > 0;
        const isExpanded = expandedItems[itemKey] || false;

        // 处理目录项点击（支持展开/折叠和跳转）
        const handleItemClick = (e) => {
            e.stopPropagation();

            if (hasSubItems) {
                // 切换展开状态
                setExpandedItems(prev => ({
                    ...prev,
                    [itemKey]: !isExpanded
                }));
            } else {
                // 跳转到对应位置
                handleTocSelect(item.href);
            }
        };

        // 处理子项箭头图标的点击（仅切换展开状态）
        const handleArrowClick = (e) => {
            e.stopPropagation();
            setExpandedItems(prev => ({
                ...prev,
                [itemKey]: !isExpanded
            }));
        };

        return (
            <div className="toc-node">
                <div
                    className="toc-item"
                    style={{
                        padding: '8px 16px',
                        paddingLeft: `${16 + level * 20}px`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.2s',
                        ':hover': {
                            background: theme === 'light' ? '#f5f5f5' : '#262626'
                        }
                    }}
                    onClick={handleItemClick}
                >
                    {/* 展开/折叠箭头 */}
                    {hasSubItems && (
                        <span
                            style={{
                                marginRight: 8,
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s'
                            }}
                            onClick={handleArrowClick}
                        >
                            <CiCircleTwoTone />
                        </span>
                    )}

                    {/* 目录标签 */}
                    <span style={{
                        flex: 1,
                        color: theme === 'light' ? '#000' : '#fff',
                        fontSize: 14 - level * 0.5
                    }}>
                        {item.label}
                    </span>
                </div>

                {/* 递归渲染子目录 */}
                {hasSubItems && isExpanded && (
                    <div className="toc-children">
                        {item.subitems.map((subitem, index) => (
                            <TocItem
                                key={index}
                                item={subitem}
                                level={level + 1}
                                parentPath={itemKey}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Layout
            className="reader-layout"
            style={{ height: '100vh', background: theme === 'light' ? '#fff' : '#1f1f1f' }}
        >
            <Header className="reader-header" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                background: theme === 'light' ? '#fff' : '#1f1f1f',
                borderBottom: '1px solid #e8e8e8'
            }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => { onClose(); }}
                    style={{ marginRight: 16 }}
                />
                <h3 style={{
                    margin: 0,
                    flex: 1,
                    color: theme === 'light' ? '#000' : '#fff'
                }}>
                    {book?.name}
                </h3>
                <div className="reader-tools" style={{ display: 'flex', gap: '8px' }}>
                    <Tooltip title="上一页">
                        <Button icon={<LeftOutlined />} onClick={() => flipPage('prev')} />
                    </Tooltip>
                    <Tooltip title="下一页">
                        <Button icon={<RightOutlined />} onClick={() => flipPage('next')} />
                    </Tooltip>
                    <Tooltip title={`${fontSize}px`}>
                        <Button
                            icon={<FontSizeOutlined />}
                            onClick={() => setFontSize(prev => prev + 1)}
                        />
                    </Tooltip>
                    <Tooltip title="切换主题">
                        <Button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
                            {theme === 'light' ? '🌙' : '☀️'}
                        </Button>
                    </Tooltip>
                    <Tooltip title="阅读模式">
                        <Select defaultValue="平滑" onChange={handleModeChange} style={{ width: 120 }}
                            options={[
                                {
                                    label: <span>水平阅读</span>,
                                    options: [
                                        {
                                            label: <span>平滑</span>,
                                            value: 'paginated',
                                        },
                                        {
                                            label: <span>仿真</span>,
                                            value: 'simulation',
                                        },
                                    ],
                                },
                                {
                                    label: <span>垂直阅读</span>,
                                    options: [
                                        {
                                            label: <span>普通</span>,
                                            value: 'scrolled',
                                        },
                                        {
                                            label: <span>连续</span>,
                                            value: 'successive',
                                        },
                                    ],
                                },
                            ]}
                        />
                    </Tooltip>
                    <Tooltip title="目录">
                        <Button icon={<MenuOutlined />} onClick={() => setShowToc(true)} />
                    </Tooltip>
                    <Tooltip title="全屏">
                        <Button
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            onClick={toggleFullscreen}
                        />
                    </Tooltip>
                </div>
            </Header>

            <Content style={{ position: 'relative', overflow: 'hidden' }}>
                <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />
            </Content>

            <Drawer
                title="目录"
                placement="left"
                open={showToc}
                onClose={() => setShowToc(false)}
                width={300}
                styles={{
                    background: theme === 'light' ? '#fff' : '#1f1f1f'
                }}
                className='my-toc-drawer'
            >
                <div className="toc-list" style={{
                    height: '100%',
                    overflow: 'auto',
                    background: theme === 'light' ? '#fff' : '#1f1f1f'
                }}>
                    {toc.map((item, index) => (
                        <TocItem
                            key={getItemKey(item)}
                            item={item}
                            level={0}
                        />
                    ))}
                </div>
            </Drawer>

        </Layout>
    );
};

export default BookReader;