import { useState, useRef, useEffect } from "react";
import { Drawer, Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";

import { ArrowLeftOutlined } from "@ant-design/icons";

import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
import MenuTocItem from "./MenuTocItem";
import { getItemKey } from "./MenuTocItem";
import MobiParser from "../../utils/bookParser/MobiParser";
import ReadingIndicator from "../../utils/ReadingIndicator";
import '../BookReader.css'

//TODO 连续阅读模式，有待实现，
//TODO 保存阅读记录
const MobiRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef
}) => {
  const [mobibook, setMobiBook] = useState();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState();
  const [sectionUrl, setSectionUrl] = useState(null);
  const [readerTheme, setReaderTheme] = useState('light');
  const [title, setTitle] = useState('');
  const [toolBar, setToolBar] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [extraToc, setExtraToc] = useState([]);
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
  }, []);

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
    const loadSection = async () => {
      if (!mobibook || !mobibook.sections || !mobibook.sections[currentSectionIndex]) return;

      try {
        const url = await mobibook.sections[currentSectionIndex].load();
        setSectionUrl(url);
      } catch (e) {
        console.error('Error loading section:', e);
      }
    };

    if (mobibook) {
      loadSection();
    }
  }, [mobibook, currentSectionIndex]);

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
  }, [readerSettings.fontSize, readerSettings.fontFamily, readerTheme]);

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
          });
        `;
        iframeDoc.body.appendChild(script);
      } catch (error) {
        console.error("无法访问iframe内容:", error);
      }
    }, 500);
  };
  
  // 在父窗口监听消息
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'toggleToolbar') {
        setToolBar(prev => !prev);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const applyThemeSettings = () => {
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    const body = iframeDoc.body;
    body.style.fontSize = `${readerSettings.fontSize}px`;
    body.style.fontFamily = readerSettings.fontFamily;
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
          <Header
            className="reader-header"
            style={{
              background: readerTheme === "light" ? "#fff" : "#1f1f1f",
              borderBottom: "1px solid #e8e8e8",
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
              {title}
            </h3>
            <ReaderToolbar
              readerTheme={readerTheme}
              navigationHandlers={navigationHandlers}
              onSettingsClick={() => updateUiState('openSettings', true)}
              onTocClick={() => updateUiState('openToc', true)}
              onThemeToggle={() => updateTheme(readerTheme === 'light' ? 'dark' : 'light')}
            />
          </Header>
        )
      }

      <Content style={{ position: "relative", overflow: "hidden" }}>
        <ReadingIndicator currentPage={currentSectionIndex} totalPages={totalPages} />
        <div ref={viewerRef} className="mobi-iframe-container" >
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
      <Drawer
        title="目录"
        placement="left"
        open={uiState.openToc}
        onClose={() => handleTocClose()}
        width={300}
        styles={{
          background: readerTheme === "light" ? "#fff" : "#1f1f1f",
        }}
        className="my-toc-drawer"
      >
        <div
          className="toc-list"
          style={{
            height: "100%",
            overflow: "auto",
            background: readerTheme === "light" ? "#fff" : "#1f1f1f",
          }}
        >
          {readerState.toc.map((item, index) => (
            <MenuTocItem
              key={getItemKey(item)}
              readerTheme={readerTheme}
              item={item}
              tocSelectHandler={navigationHandlers.handleTocSelect}
              currentChapter={currentChapter} level={0}
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
        onModeChange={handleModeChange}
        onClose={() => updateUiState('openSettings', false)}
      />

    </>
  );
}


export default MobiRenderer;