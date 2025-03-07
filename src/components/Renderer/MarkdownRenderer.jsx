import { useState, useEffect, useRef } from "react";
import { Drawer, Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import MenuTocItem, { getItemKey } from "./MenuTocItem";
import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
const MarkdownRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef,
}) => {
  const [currentChapter, setCurrentChapter] = useState('');
  const [markdownContent, setMarkdownContent] = useState(''); // Changed to string
  const [readerTheme, setReaderTheme] = useState('light');
  const scrollTimeout = useRef(null)
  const updateTheme = (value) => {
    setReaderTheme(value);
  }
  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });
  
  const eventHandlers = {
    onRenditionReady: (rendition) => {
      setReaderState(prev => ({ ...prev, rendition }));
    },
    onLocationChange: (location) => {
      setReaderState(prev => ({ ...prev, currentLocation: location }));
    },
    onTocChange: (toc) => {
      setReaderState(prev => ({ ...prev, toc }));
    },
    onLeftClose: onLeftCloseHandler,
  };
  const markdownRef = useRef(null);
  

  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;
  
    const handleScroll = () => {
      // 防抖处理
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        // 保存滚动位置
        // setLastScrollPos(container.scrollTop);
        
        // 查找最近的标题
        const headingElements = readerState.toc
          .map(h => document.getElementById(h.href))
          .filter(Boolean);
        
        const closest = headingElements.reduce((closest, el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < 100 && rect.top > closest.top 
            ? { el, top: rect.top } 
            : closest;
        }, { el: null, top: -Infinity });
  
        if (closest.el) {
          setCurrentChapter(closest.el.id);
          localStorage.setItem(`book-progress-${book.name}`, closest.el.id);
        }
      }, 200);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [readerState.toc]);

  //设置参数
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: "SimSun",
    readingMode: "paginated",
    managerMode: "default",
    //
  })
  const updateSettings = (key, value) => {
    setReaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const [uiState, setUiState] = useState({
    isFullscreen: false, // 全屏
    openSettings: false, // 页面设置菜单
    openToc: false, //目录的显示与否
  })
  const updateUiState = (key, value) => {
    setUiState(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const navigationHandlers = {
    handlePrevPage: () => {
      readerState.rendition?.prev();
    },
    handleNextPage: () => {
      readerState.rendition?.next();
    },
    handleTocSelect: (location) => {
      readerState.rendition?.display(location.href);
      updateUiState('openToc', false);
    },
    onTocClose: () => {
      updateUiState('openToc', false);
    }
  };
  
  const generateToc = (text) => {
    const headers = [];
    const levelCounters = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    const generateId = (level) => {
      levelCounters[level]++;
      return `heading-${level}-${levelCounters[level]}`;
    };

    const regex = /^(#{1,6})\s+(.+?)$/gm;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const level = match[1].length;
      const label = match[2].trim();
      const href = generateId(level);

      headers.push({
        level,
        label,
        href,
        index: headers.length
      });
    }

    setReaderState(prev => ({ ...prev, toc: headers }));
  };

  useEffect(() => {
    if (markdownRef.current) {
      markdownRef.current.style.fontSize = `${readerSettings.fontSize}px`;
      markdownRef.current.style.fontFamily = readerSettings.fontFamily;
      markdownRef.current.style.color = readerTheme === "light" ? "#000" : "#fff";
    }
    eventHandlers.onRenditionReady(rendition);
  }, [readerSettings]);
  
  useEffect(() => {
    if (markdownRef.current) {
      markdownRef.current.style.backgroundColor = readerTheme === "light" ? "#fff" : "#000";
      markdownRef.current.style.color = readerTheme === "light" ? "#000" : "#fff";
    }
  }, [readerTheme])

  useEffect(() => {
    if (book instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setMarkdownContent(content);
        generateToc(content);
      };
      reader.readAsText(book);
    } else if (typeof book === 'string') {
      setMarkdownContent(book);
      generateToc(book);
    }
    const savedCfi = localStorage.getItem(`book-progress-${book.name}`);

    setCurrentChapter(savedCfi);
    setTimeout(() => {
      scrollToHeader(savedCfi);
    }, 500);
    eventHandlers.onRenditionReady(rendition);
  }, [book]);

  const scrollToHeader = (headerId) => {

    if (!viewerRef.current) return;
    const headerElement = viewerRef.current.querySelector(`#${headerId}`);
    if (headerElement) {
      // Get the viewer's scrollTop position
      const viewerScrollTop = viewerRef.current.scrollTop;
      // Get the header's position relative to the viewer
      const headerTop = headerElement.offsetTop;

      viewerRef.current.scrollTo({
        top: headerTop,
        behavior: 'smooth'
      });

      // Update current chapter
      setCurrentChapter(headerId);
    }
  };
  // Rendition object for page navigation
  const rendition = {
    next: () => {
      const currentIndex = readerState.toc.findIndex(item => item.index === currentChapter);
      if (currentIndex < readerState.toc.length - 1) {
        const nextChapter = readerState.toc[currentIndex + 1];
        scrollToHeader(nextChapter.index);
      }
    },
    prev: () => {
      const currentIndex = readerState.toc.findIndex(item => item.index === currentChapter);
      if (currentIndex > 0) {
        const prevChapter = readerState.toc[currentIndex - 1];
        scrollToHeader(prevChapter.index);
      }
    },
    display: (index) => {
      if (index !== '') {
        scrollToHeader(index);
      }
    },
    current: () => currentChapter,
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    // Headers with ID generation for TOC linking
    h1: ({ node, ...props }) => (
      <h1
        id={`${readerState.toc.find(item => 
          item.level === 1 && item.label === props.children.toString())?.href}`}
        style={{
          borderBottom: '1px solid #eaecef',
          paddingBottom: '.3em',
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '2em',
        }}
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        id={`${readerState.toc.find(item => 
          item.level === 2 && item.label === props.children.toString())?.href}`}
        style={{
          borderBottom: '1px solid #eaecef',
          paddingBottom: '.3em',
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '1.5em',
        }}
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        id={`${readerState.toc.find(item => 
          item.level === 3 && item.label === props.children.toString())?.href}`}
        style={{
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '1.25em',
        }}
        {...props}
      />
    ),
    h4: ({ node, ...props }) => (
      <h4
        id={`${readerState.toc.find(item => 
          item.level === 4 && item.label === props.children.toString())?.href}`}
        style={{
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '1.0em',
        }}
        {...props}
      />
    ),
    // Paragraphs
    p: ({ node, ...props }) => (
      <p
        style={{
          marginTop: '0',
          marginBottom: '16px',
          lineHeight: '1.6'
        }}
        {...props}
      />
    ),
    // Lists
    ul: ({ node, ...props }) => (
      <ul
        style={{
          paddingLeft: '2em',
          marginBottom: '16px'
        }}
        {...props}
      />
    ),
    ol: ({ node, ...props }) => (
      <ol
        style={{
          paddingLeft: '2em',
          marginBottom: '16px'
        }}
        {...props}
      />
    ),
    li: ({ node, ...props }) => (
      <li
        style={{
          marginTop: '0.25em'
        }}
        {...props}
      />
    ),
    // Links
    a: ({ node, ...props }) => (
      <a
        style={{
          color: '#0366d6',
          textDecoration: 'none',
          ':hover': {
            textDecoration: 'underline'
          }
        }}
        {...props}
      />
    ),
    // Code blocks
    code: ({ node, inline, ...props }) => (
      inline ? (
        <code
          style={{
            padding: '0.2em 0.4em',
            margin: 0,
            fontSize: '85%',
            backgroundColor: readerTheme === "light" ? '#f6f8fa' : '#2f3542',
            borderRadius: '3px'
          }}
          {...props}
        />
      ) : (
        <code
          style={{
            display: 'block',
            padding: '16px',
            overflow: 'auto',
            fontSize: '85%',
            lineHeight: '1.45',
            backgroundColor: readerTheme === "light" ? '#f6f8fa' : '#2f3542',
            borderRadius: '3px'
          }}
          {...props}
        />
      )
    ),
    // Blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote
        style={{
          padding: '0 1em',
          color: '#6a737d',
          borderLeft: '0.25em solid #dfe2e5',
          marginBottom: '16px'
        }}
        {...props}
      />
    ),
    // Tables
    table: ({ node, ...props }) => (
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          marginBottom: '16px'
        }}
        {...props}
      />
    ),
    th: ({ node, ...props }) => (
      <th
        style={{
          padding: '6px 13px',
          border: '1px solid #dfe2e5'
        }}
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        style={{
          padding: '6px 13px',
          border: '1px solid #dfe2e5'
        }}
        {...props}
      />
    ),
    // Emphasis
    em: ({ node, ...props }) => (
      <em
        style={{
          fontStyle: 'italic'
        }}
        {...props}
      />
    ),
    // Strong emphasis
    strong: ({ node, ...props }) => (
      <strong
        style={{
          fontWeight: '600'
        }}
        {...props}
      />
    ),
    // Horizontal rule
    hr: ({ node, ...props }) => (
      <hr
        style={{
          height: '0.25em',
          padding: 0,
          margin: '24px 0',
          backgroundColor: '#e1e4e8',
          border: 0
        }}
        {...props}
      />
    ),
  };

  const handleTocClose = () => {
    setUiState('openToc', false);
  }

  return (
    <>
      <Header
        className="reader-header"
        style={{
          borderBottom: "1px solid #e8e8e8",
          backgroundColor: readerTheme === 'light'?'#f5f5f5':'#373536',
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={eventHandlers.onLeftClose}
          style={{ marginRight: 16 }}
        />
        <h3
          style={{
            margin: 0,
            flex: 1,
            color: readerTheme === "light" ? "#000" : "#fff",
          }}
        >
          {book?.name}
        </h3>
        <ReaderToolbar
          readerTheme={readerTheme}
          navigationHandlers={navigationHandlers}
          onSettingsClick={() => updateUiState('openSettings', true)}
          onTocClick={() => updateUiState('openToc', true)}
          onThemeToggle={() => updateTheme(readerTheme === 'light' ? 'dark' : 'light')}
        />
      </Header>

      <Content style={{ position: "relative", overflow: "hidden" }}>
        <div ref={viewerRef} style={{ 
          width: "100%", height: "100%", 
          padding: "16px", overflowY: "auto", 
          background: readerTheme === "light" ? "#fff" : "#1f1f1f",
        }}>
          <div ref={markdownRef}>
            <ReactMarkdown
              children={markdownContent}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            />
          </div>
        </div>
      </Content>
      <Drawer
        className="my-toc-drawer"
        title="目录"
        placement="left"
        open={uiState.openToc}
        onClose={() => handleTocClose()}
        width={300}
        style={{
          background: readerTheme === "light" ? "#fff" : "#1f1f1f",
          color: readerTheme == 'light' ? "#1f1f1f" : "#fff",
        }}
      >
        <div
          className="toc-list"
        >
          {readerState.toc.map((item, index) => (
            <MenuTocItem
              key={getItemKey(item)}
              readerTheme={readerTheme}
              item={item}
              tocSelectHandler={navigationHandlers.handleTocSelect}
              currentChapter={currentChapter}
              level={item.level}
              allTocItems={readerState.toc}
            />
          ))}
        </div>
      </Drawer>
      <SettingsModal
        readerTheme={readerTheme}
        open={uiState.openSettings}
        settings={readerSettings}
        onSettingChange={updateSettings}
        onClose={() => updateUiState('openSettings', false)}
      />
    </>
  );
};

export default MarkdownRenderer;