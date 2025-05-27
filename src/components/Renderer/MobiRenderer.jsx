import { useState, useRef, useEffect } from "react";
import { Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { theme } from 'antd';
const { useToken } = theme;
import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
import CustomDrawer from "../CustomDrawer";
import MobiParser from "../../utils/bookParser/MobiParser";
import ReadingIndicator from "../../utils/ReadingIndicator";
import { useTheme } from "../../contexts/ThemeContext";

import '../BookReader.css'
import { useKeyboardNavigation, useScrollNavigation } from "../../utils/Tool";

//TODO 连续阅读模式，有待实现，
//TODO 保存阅读记录
const MobiRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef,
}) => {
  const [mobibook, setMobiBook] = useState();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState();
  const [sectionUrl, setSectionUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [toolBar, setToolBar] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useToken();
  const { isDark } = useTheme();
  const lastScrollTime = useRef(0);

  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });
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
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: "",
    readingMode: "paginated",
    managerMode: "default",
    lineHeight: "1.4",
    marginSpace: {
      left: "2",   // 左侧边距（单位%）
      right: "2",  // 右侧边距
    },
    //
  })
  const updateSettings = (key, value) => {
    setReaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reading mode handler
  const handleModeChange = (value) => {
    let managerMode = "default";
    if (["successive", "simulation"].includes(value)) {
      managerMode = "continuous";
      value = value === "successive" ? "scrolled" : "paginated";
    }

    setReaderSettings(prev => ({
      ...prev,
      readingMode: value,
      managerMode: managerMode
    }));
  };
  const eventHandlers = {
    onTocChange: (toc) => {
      setReaderState(prev => ({ ...prev, toc }));
    },
    onLeftClose: onLeftCloseHandler,
  };
  const iframeRef = useRef(null);
  const bookRef = useRef(null);
  const scrollTimeoutId = useRef(null);

  const loadSection = async () => {
    if (!mobibook || !mobibook.sections || !mobibook.sections[currentSectionIndex]) return;

    try {
      const url = await mobibook.sections[currentSectionIndex].load();
      setSectionUrl(url);
    } catch (e) {
      console.error('Error loading section:', e);
    }
  };

  useEffect(() => {
    const loadBook = async () => {
      try {
        const mobi = new MobiParser();
        bookRef.current = await mobi.parse(book);
        const toc = bookRef.current.toc;
        const t = bookRef.current.metadata?.title;
        eventHandlers.onTocChange(toc);
        setMobiBook(bookRef.current);
        setTitle(t);
        setTotalPages(bookRef.current.sections.length - 1);
      }
      catch (e) {
        console.error('Error loading MOBI file:', e);
      }
    }
    if (book)
      loadBook();

    if (mobibook) {
      loadSection();
    }

    const handleMessage = (event) => {
      if (event.data.type === 'toggleToolbar') {
        setToolBar(prev => !prev);
      }
    };
    
        const iframe = iframeRef.current;
    if (!iframe) return;
    let contentWindow;
    const handleWheel = (event) => {
      const direction = event.deltaY > 0 ? 'down' : 'up';
      
      const iframeDoc = contentWindow.document;
      const { clientHeight } = iframeDoc.documentElement;
      const { scrollY, innerHeight} = contentWindow;
      const isAtBottom = scrollY + innerHeight >= clientHeight;
      const isAtTop = scrollY <= 0;
      
      if (direction === 'down' && isAtBottom) {
        goToNextSection();
      } else if (direction === 'up' && isAtTop) {
        goToPreviousSection();
      }
    };

    const attachWheelListener = () => {
      contentWindow = iframe.contentWindow;
      if (!contentWindow) return;
  
      contentWindow.addEventListener('wheel', handleWheel);
    };
  
    const detachWheelListener = () => {
      contentWindow?.removeEventListener('wheel', handleWheel);
    };
  
    iframe.addEventListener('load', attachWheelListener);
  
    // 如果 iframe 已加载完成，直接绑定
    if (iframe.contentDocument?.readyState === 'complete') {
      attachWheelListener();
    }
    

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
            iframe.removeEventListener('load', attachWheelListener);
      detachWheelListener();
    }
    
    
  }, []);
  
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let contentWindow;
    const handleWheel = (event) => {
      const direction = event.deltaY > 0 ? 'down' : 'up';
      
      const iframeDoc = contentWindow.document;
      const { clientHeight } = iframeDoc.documentElement;
      const { scrollY, innerHeight} = contentWindow;
      const isAtBottom = scrollY + innerHeight >= clientHeight;
      const isAtTop = scrollY <= 0;
      
      if (direction === 'down' && isAtBottom) {
        goToNextSection();
      } else if (direction === 'up' && isAtTop) {
        goToPreviousSection();
      }
    };

    const attachWheelListener = () => {
      contentWindow = iframe.contentWindow;
      if (!contentWindow) return;
  
      contentWindow.addEventListener('wheel', handleWheel);
    };
  
    const detachWheelListener = () => {
      contentWindow?.removeEventListener('wheel', handleWheel);
    };
  
    iframe.addEventListener('load', attachWheelListener);
  
    // 如果 iframe 已加载完成，直接绑定
    if (iframe.contentDocument?.readyState === 'complete') {
      attachWheelListener();
    }
  
    return () => {
      iframe.removeEventListener('load', attachWheelListener);
      detachWheelListener();
    };

  }, [])
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      const contentWindow = iframe.contentWindow;

      // 滚动监听处理
      const handleScroll = () => {

        if (toolBar) {
          setToolBar(false);
        }
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        // 为所有内部链接添加点击事件
        const links = iframeDoc.querySelectorAll('a[id]');
        const nonEmptyIds = Array.from(links)
          .map(link => link.id.replace(/\D/g, ''))
          .filter(id => id.trim() !== ''); // 过滤空值

        clearTimeout(scrollTimeoutId.current);
        scrollTimeoutId.current = setTimeout(() => {
          const scrollY = contentWindow.scrollY;
          localStorage.setItem(`book-progress-scroll-${title}`, scrollY);
          localStorage.setItem(`book-progress-${title}`, 'filepos:' + nonEmptyIds[0]);
          setCurrentChapter('filepos:' + nonEmptyIds[0]);
        }, 100);
      
      };
 
      contentWindow.addEventListener('scroll', handleScroll);


      return () => {
        contentWindow.removeEventListener('scroll', handleScroll);
      };
    };

    iframe.addEventListener('load', handleLoad);
    // 立即处理已加载的iframe
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [currentSectionIndex, title]); // 依赖章节变化和书名

  // 加载章节内容
  useEffect(() => {
    if (mobibook) {
      loadSection();
    }
  }, [currentSectionIndex]);

  useEffect(() => {
    const savedSection = localStorage.getItem(`book-progress-${title}`);
    if (savedSection !== null) {
      navigateToHref(savedSection);
    }

    // 恢复滚动位置
    setTimeout(() => {
      const savedScroll = localStorage.getItem(`book-progress-scroll-${title}`);
      if (savedScroll !== null) {
        const iframeWindow = iframeRef.current?.contentWindow;
        iframeWindow.scrollTo(0, savedScroll);
      }
    }, 100);
  }, [mobibook])

  // 处理内部导航链接
  useEffect(() => {
    const handleIframeLoad = () => {
      if (!iframeRef.current || !mobibook) return;

      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      // 为所有内部链接添加点击事件
      const links = iframeDoc.querySelectorAll('a[href^="filepos:"]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          navigateToHref(href);
        });
      });
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [book, sectionUrl, currentChapter]);

  useEffect(() => {
    if (iframeRef.current) {
      applyThemeSettings();
    }
  }, [readerSettings.fontSize, readerSettings.fontFamily, readerSettings.lineHeight, readerSettings.marginSpace, isDark]);

  const handleIframeLoad = () => {
    setTimeout(() => {
      try {
        const iframe = iframeRef.current; // 添加这一行
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const script = iframeDoc.createElement('script');
        script.textContent = `
          document.addEventListener('click', function(e) {
            // 检查是否有文本被选中
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
              return;
            }
            // 向父窗口发送消息
            window.parent.postMessage({ type: 'toggleToolbar' }, '*');
            window.focus();
          });
        `;
        iframeDoc.body.appendChild(script);
        applyThemeSettings();
      } catch (error) {
        console.error("无法访问iframe内容:", error);
      }
    }, 500);
  };

  const applyThemeSettings = () => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      const body = iframeDoc.body;
      body.style.fontSize = `${readerSettings.fontSize}px`;
      body.style.fontFamily = readerSettings.fontFamily;
      body.style.color = token.colorText;
      body.style.lineHeight = readerSettings.lineHeight;
      body.style.marginLeft = `${readerSettings.marginSpace.left}%`;
      body.style.marginRight = `${readerSettings.marginSpace.right}%`;
    }
  };

  // 导航到指定href
  const navigateToHref = (href) => {
    if (!mobibook || !href) return;
    try {
      const { index, anchor } = mobibook.resolveHref(href);

      if (index !== currentSectionIndex) {
        setCurrentSectionIndex(index);
        setCurrentChapter(href);
      } else if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const element = anchor(iframeDoc);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };
  
  // 上一页/下一页导航
  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const goToNextSection = () => {
    if (mobibook && currentSectionIndex < mobibook.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };
  
  useKeyboardNavigation(goToPreviousSection, goToNextSection);
  useScrollNavigation(viewerRef, 100);
  const navigationHandlers = {
    handlePrevPage: () => {
      goToPreviousSection();
    },
    handleNextPage: () => {
      goToNextSection();
    },
    handleTocSelect: (href) => {
      navigateToHref(href.href)
    }
  }

  const handleTocClose = () => {
    setUiState('openToc', false);
  }

  return (
    <>
      {
        toolBar && (
          <Header className="reader-header" >
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={eventHandlers.onLeftClose}
              style={{ marginRight: 16 }}
            />
            <h3
              style={{
                margin: 0,
                flex: 1,
              }}
            >
              {title}
            </h3>
            <ReaderToolbar
              navigationHandlers={navigationHandlers}
              onSettingsClick={() => updateUiState('openSettings', true)}
              onTocClick={() => updateUiState('openToc', true)}
            />
          </Header>
        )
      }

      <Content style={{ position: "relative", overflow: "hidden" }}>
        <ReadingIndicator currentPage={currentSectionIndex} totalPages={totalPages} />
        <div ref={viewerRef} tabIndex={0} className="mobi-iframe-container" >
          {sectionUrl && (
            <iframe
              ref={iframeRef}
              src={sectionUrl}
              title={`Section ${currentSectionIndex + 1}`}
              className="mobi-content-iframe"
              sandbox="allow-same-origin allow-scripts allow-forms"
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </Content>

      <CustomDrawer 
        toc={readerState.toc}
        currentChapter={currentChapter}
        openToc={uiState.openToc}
        onClose={handleTocClose}
        onSelect={navigationHandlers.handleTocSelect}
      />
      <SettingsModal
        open={uiState.openSettings}
        settings={readerSettings}
        onSettingChange={updateSettings}
        onModeChange={handleModeChange}
        onClose={() => updateUiState('openSettings', false)}
      />

    </>
  );
}


export default MobiRenderer;