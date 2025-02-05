import React, { useState, useEffect, useRef } from 'react';
import { Button, Empty } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import ePub from 'epubjs';

const BookReader = ({ bookPath, theme, navigation }) => {
    const [book, setBook] = useState(null);
    const [rendition, setRendition] = useState(null);
    const [progress, setProgress] = useState(0);
    const readerRef = useRef(null);
  
    useEffect(() => {
      if (navigation?.selectedChapter) {
        // 如果选择了特定章节，跳转到该章节
        if (rendition) {
            console.log('跳转',navigation.selectedChapter.href);
          rendition.display(navigation.selectedChapter.href);
          book.renderTo(navigation.href);
          setBook(book)
        //   message.success(`已跳转到：${navigation.selectedChapter.label}`);
        }
      }
    }, [navigation?.selectedChapter]);

    useEffect(() => {
        // 重置阅读状态
        if (readerRef.current && bookPath) {
            // 清除之前的渲染
            if (rendition) {
                rendition.destroy();
            }

            // 初始化新的电子书
            const newBook = ePub(`/books/${bookPath}`);
            setBook(newBook);

            // 渲染电子书内容
            const newRendition = newBook.renderTo(readerRef.current, {
                flow: 'scrolled',
                width: '100%',
                height: '100%'
            });

            // 设置主题
            newRendition.themes.default({
                'body': {
                    'color': theme === 'dark' ? '#fff' : '#000',
                    'background-color': theme === 'dark' ? '#333' : '#fff',
                    'line-height': '1.6',
                    'max-width': '800px',
                    'margin': '0 auto',
                    'padding': '20px'
                }
            });
            // 应用主题
            newRendition.themes.select(theme);

            // 监听滚动进度
            const handleScroll = () => {
                const currentLocation = newRendition.currentLocation();
                if (currentLocation) {
                    const progress = Math.floor(
                        (currentLocation.start.percentage) * 100
                    );
                    setProgress(progress);
                }
            };

            // 恢复之前的阅读进度
            const savedLocation = localStorage.getItem(`book-${bookPath}-location`);
            if (savedLocation) {
                try {
                    newRendition.display(savedLocation);
                } catch (error) {
                    console.error('Failed to restore location:', error);
                }
            }

            // 滚动事件监听
            newRendition.on('scroll', handleScroll);
            
            setRendition(newRendition);

            // 清理函数
            return () => {
                if (newRendition) {
                    newRendition.destroy();
                }
                if (newBook) {
                    newBook.destroy();
                }
            };
        }
    }, [bookPath, theme, navigation]);

    const handleSaveProgress = () => {
        if (rendition && bookPath) {
            const currentLocation = rendition.currentLocation();
            if (currentLocation) {
                localStorage.setItem(
                    `book-${bookPath}-location`, 
                    currentLocation.start.cfi
                );
            }
        }
    };

    const openFullScreen = () => {
        if (readerRef.current) {
            if (readerRef.current.requestFullscreen) {
                readerRef.current.requestFullscreen();
            } else if (readerRef.current.mozRequestFullScreen) { // Firefox
                readerRef.current.mozRequestFullScreen();
            } else if (readerRef.current.webkitRequestFullscreen) { // Chrome, Safari and Opera
                readerRef.current.webkitRequestFullscreen();
            } else if (readerRef.current.msRequestFullscreen) { // Internet Explorer/Edge
                readerRef.current.msRequestFullscreen();
            }
        }
    };

    if (!bookPath) {
        return (
            <div style={{ 
                height: '90vh', display: 'flex', alignContent: 'center', justifyContent:'center', 
                alignItems: 'center'
                }} >
                <Empty
                    description="请选择要阅读的书籍"
                />
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                zIndex: 10
            }}>
                <div>
                    阅读进度：{progress}%
                </div>
                <div>
                    <Button 
                        type="link" 
                        onClick={handleSaveProgress}
                    >
                        保存进度
                    </Button>
                    <Button 
                        type="link" 
                        onClick={openFullScreen}
                    >
                        全屏阅读
                    </Button>
                </div>
            </div>
            
            <div 
                ref={readerRef} 
                style={{
                    height: 'calc(100% - 50px)', 
                    marginTop: '50px',
                    overflowY: 'auto'
                }} 
            />
        </div>
    );
};

export default BookReader;