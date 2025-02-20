import { useState, useEffect, useRef } from "react";
import { Drawer } from "antd";
import ReactMarkdown from "react-markdown";
import { CiCircleTwoTone } from "@ant-design/icons";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const MarkdownRenderer = ({
  book,
  settings,
  handlers,
  eventHandlers,
  uiState,
  readerState,
  viewerRef,
}) => {
  // const [toc, setToc] = useState([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [markdownContent, setMarkdownContent] = useState(''); // Changed to string
  const markdownRef = useRef(null);
  
  const generateToc = (text) => {
    const headers = [];
    const usedIds = new Set(); // 用于追踪已使用的ID
  
    // 生成唯一ID的函数
    const generateUniqueId = (base) => {
      let id = base;
      let counter = 1;
      // 如果ID已存在，添加数字后缀
      while (usedIds.has(id)) {
        id = `${base}-${counter}`;
        counter++;
      }
      usedIds.add(id);
      return id;
    };
  
    // 更简单的正则表达式，主要匹配#号和标题内容
    const regex = /^(#{1,6})\s+(.+?)$/gm;
    let match;
  
    while ((match = regex.exec(text)) !== null) {
      const level = match[1].length;
      const label = match[2].trim();
      
      // 为每个标题生成一个基于序号的唯一ID
      const baseId = `heading-${headers.length + 1}`;
      const id = generateUniqueId(baseId);
  
      const header = {
        level,
        label,
        id,
        index: headers.length
      };
  
      headers.push(header);
    }
    eventHandlers.onTocChange(headers);
  };
  
  useEffect(() => {
    if (markdownRef.current) {
      markdownRef.current.style.fontSize = `${settings.fontSize}px`;
      markdownRef.current.style.fontFamily = settings.fontFamily;
      markdownRef.current.style.backgroundColor = settings.theme === "light" ? "#fff" : "#1f1f1f";
      markdownRef.current.style.color = settings.theme === "light" ? "#000" : "#fff";
    }
    eventHandlers.onRenditionReady(rendition);
  }, [settings]);

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
    eventHandlers.onRenditionReady(rendition);
  }, [book]);

  const scrollToHeader = (headerId) => {

    if (!viewerRef.current) return;
    const headerElement = viewerRef.current.querySelector(`#${headerId}`);
    console.log("执行", viewerRef.current);
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
        console.log("滚动到", index);
        const targetChapter = readerState.toc[index];
        console.log(targetChapter);
        scrollToHeader(targetChapter.id);
      }
    },
    current: () => currentChapter,
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    // Headers with ID generation for TOC linking
    h1: ({ node, ...props }) => (
      <h1
        id={props.children.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
        style={{
          borderBottom: '1px solid #eaecef',
          paddingBottom: '.3em',
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '2em',
          color: settings.theme === "light" ? "#24292e" : "#ffffff"
        }}
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        id={props.children.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
        style={{
          borderBottom: '1px solid #eaecef',
          paddingBottom: '.3em',
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '1.5em',
          color: settings.theme === "light" ? "#24292e" : "#ffffff"
        }}
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        id={props.children.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
        style={{
          marginTop: '24px',
          marginBottom: '16px',
          fontSize: '1.25em',
          color: settings.theme === "light" ? "#24292e" : "#ffffff"
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
            backgroundColor: settings.theme === "light" ? '#f6f8fa' : '#2f3542',
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
            backgroundColor: settings.theme === "light" ? '#f6f8fa' : '#2f3542',
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

  // TOC related utilities
  const getItemKey = (item, parentPath = "") => {
    return `${parentPath}-${item.id || item.label}`;
  };
  const TocItem = ({ item, level = 0, parentPath = "" }) => {
    const itemKey = getItemKey(item, parentPath);
    const hasSubItems = item.subitems?.length > 0;
    const isExpanded = expandedItems[itemKey] || false;
    const isCurrentChapter = item.index === currentChapter;

    // 处理目录项点击（支持展开/折叠和跳转）
    const handleItemClick = (e) => {
      e.stopPropagation();
      if (hasSubItems) {
        // 切换展开状态
        setExpandedItems((prev) => ({
          ...prev,
          [itemKey]: !isExpanded,
        }));
      } else {
        // 跳转到对应位置
        handlers.handleTocSelect(item.index);
      }
    };

    // 处理子项箭头图标的点击（仅切换展开状态）
    const handleArrowClick = (e) => {
      e.stopPropagation();
      setExpandedItems((prev) => ({
        ...prev,
        [itemKey]: !isExpanded,
      }));
    };

    return (
      <div className="toc-node">
        <div
          className="toc-item"
          data-current-header={isCurrentChapter ? "true" : undefined}
          style={{
            padding: "8px 16px",
            paddingLeft: `${16 + level * 20}px`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            background: isCurrentChapter ? "#e6f4ff" : "transparent",
          }}
          onClick={handleItemClick}
        >
          {item.level > 1 && (
            <span
              style={{
                marginRight: 8,
                transform: isExpanded ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}
              onClick={handleArrowClick}
            >
              <CiCircleTwoTone />
            </span>
          )}

          <span
            style={{
              flex: 1,
              color: isCurrentChapter ? "#1890ff" : settings.theme === "light" ? "#000" : "#fff",
              fontSize: 14 - level * 0.5,
              fontWeight: isCurrentChapter ? 500 : 400,
            }}
          >
            {item.label}
          </span>
        </div>

        {item.level > 1 && isExpanded && (
          <div className="toc-children">
            {readerState.toc
              .filter(subitem => subitem.level === item.level + 1)
              .map((subitem, index) => (
                <TocItem
                  key={index}
                  item={subitem}
                  level={level + 1}
                  parentPath={itemKey}
                />
              ))
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div ref={viewerRef} style={{ width: "100%", height: "100%", padding: "16px", overflowY: "auto" }}>
        <div ref={markdownRef}>
          <ReactMarkdown
            children={markdownContent}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          />
        </div>
      </div>

      <Drawer
        title="目录"
        placement="left"
        open={uiState.showToc}
        onClose={() => handlers.onTocClose?.()}
        width={300}
        style={{
          background: settings.theme === "light" ? "#fff" : "#1f1f1f",
        }}
        className="my-toc-drawer"
      >
        <div
          className="toc-list"
          style={{
            height: "100%",
            overflow: "auto",
            background: settings.theme === "light" ? "#fff" : "#1f1f1f",
          }}
        >
          {readerState.toc.map((item, index) => (
            <TocItem key={index} item={item} level={item.level} />
          ))}
        </div>
      </Drawer>
    </>
  );
};

export default MarkdownRenderer;