import { useState, useRef, useEffect } from "react";
import { Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import Epub from "epubjs";
import { ArrowLeftOutlined } from "@ant-design/icons";

import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
import ReadingIndicator from "../../utils/ReadingIndicator";
import CustomDrawer from "../CustomDrawer";
import { theme } from 'antd';
import { useKeyboardNavigation, useScrollNavigation } from "../../utils/Tool";
const { useToken } = theme;
import { useTheme } from "../../contexts/ThemeContext";
const EpubRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef,
}) => {
  // Local state

  const [currentChapter, setCurrentChapter] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [toolBar, setToolBar] = useState(true);
  const { token } = useToken();
  const { isDark } = useTheme();
  // Reader state
  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });

  const bookRef = useRef(null);
  //设置参数
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: "SimSun",
    readingMode: "paginated",
    managerMode: "default",
    lineHeight: "1.5",
    marginSpace: {
      left: "5",   // 左侧边距（单位%）
      right: "5",  // 右侧边距
    },
    //
  })

  useEffect(() => {
    const initBook = async () => {
      try {
        if (!book) return;

        bookRef.current = new Epub(book);
        await bookRef.current.ready;

        const rendition = bookRef.current.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: readerSettings.readingMode,
          manager: readerSettings.managerMode,
          allowScriptedContent:true,
        });

        // Notify parent about rendition
        readerEventHandlers.onRenditionReady(rendition);
        // Load and set TOC
        const navigation = await bookRef.current.loaded.navigation;
        readerEventHandlers.onTocChange(navigation.toc);
        setTotalChapters(navigation.length);
        // Restore reading progress
        const savedCfi = localStorage.getItem(`book-progress-${book.name}`);
        rendition.display(savedCfi || undefined);

        // 在内容加载完成后绑定事件监听器
        rendition.on('rendered', (section) => {
          // Get all iframes (there could be multiple in continuous mode)
          const iframes = viewerRef.current.querySelectorAll('iframe');

          // Attach click handler to each iframe's document
          iframes.forEach(iframe => {
            if (iframe && iframe.contentDocument) {
              const iframeDocument = iframe.contentDocument;

              // Remove any existing click listeners to prevent duplicates
              const oldHandler = iframe._clickHandler;
              if (oldHandler) {
                iframeDocument.removeEventListener('click', oldHandler);
              }

              const clickHandler = (event) => {
                const selection = iframeDocument.getSelection();
                if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
                  return; 
                }
                setToolBar(prev => !prev);
                window.focus();
              };
              // Store the handler reference for potential cleanup
              iframe._clickHandler = clickHandler;

              // Add the event listener
              iframeDocument.addEventListener('click', clickHandler);
            }
          });
        });
        // Apply theme settings
        applyThemeSettings(rendition);

        //加载记录
        // Set up location change listener
        rendition.on("relocated", handleLocationChange);
      } catch (error) {
        console.error("Error initializing book:", error);
        throw new Error("加载书籍失败，请重试");
      }

      // 组件卸载时销毁 EPUB 实例
      return () => {
        if (bookRef.current) {
          bookRef.current.destroy();

          // Clean up any remaining event handlers
          const iframes = viewerRef.current?.querySelectorAll('iframe');
          if (iframes) {
            iframes.forEach(iframe => {
              if (iframe && iframe.contentDocument && iframe._clickHandler) {
                iframe.contentDocument.removeEventListener('click', iframe._clickHandler);
              }
            });
          }
        }
      };
    };

    initBook();

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [book, readerSettings.readingMode, readerSettings.managerMode]);

  // Apply theme settings when they change
  useEffect(() => {
    if (bookRef.current?.rendition) {
      applyThemeSettings(bookRef.current.rendition);
    }
  }, [readerSettings.fontSize, readerSettings.fontFamily, isDark]);

  useEffect(() => {
    if (bookRef.current?.rendition) {
      changeLineheight(bookRef.current.rendition);
    }
  }, [readerSettings.lineHeight])

  const changeLineheight = (rendition) => {
    rendition.themes.default({
      body: {
        "line-height": `${readerSettings.lineHeight} !important`
      },
    });
  }

  useEffect(() => {
    if (bookRef.current?.rendition) {
      changeMarginSpace(bookRef.current.rendition);
    }
  }, [readerSettings.marginSpace])

  const changeMarginSpace = (rendition) => {
    rendition.themes.default({
      p: {
        "margin-left": `${readerSettings.marginSpace.left}%`,
        "margin-right": `${readerSettings.marginSpace.right}%`,
      }
    });
  }


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

  // Reader event handlers
  const readerEventHandlers = {
    onRenditionReady: (rendition) => {
      setReaderState((prev) => ({ ...prev, rendition }));
    },
    onLocationChange: (location) => {
      setReaderState((prev) => ({ ...prev, currentLocation: location }));
    },
    onTocChange: (toc) => {
      setReaderState((prev) => ({ ...prev, toc }));
    },
  };

  const applyThemeSettings = (rendition) => {
    rendition.themes.default({
      body: {
        "font-size": `${readerSettings.fontSize}px !important`,
        "font-family": readerSettings.fontFamily,
        // "background-color": token.colorBgContainer,
        "color": token.colorText,
        "line-height": `${readerSettings.lineHeight} !important`
      },

    });
  };

  const handleLocationChange = async (location) => {
    // updateProgress(location);
    setCurrentPage(location.start.index)
    //保存在了浏览器中的localStorege   //后期应添加到数据库中。。。
    localStorage.setItem(`book-progress-${book.name}`, location.start.cfi);
    // Update current chapter
    const chapter = await bookRef.current.spine.get(location.start.cfi);
    if (chapter) {
      setCurrentChapter(chapter.href);
    }

    // Notify parent
    readerEventHandlers.onLocationChange(location);
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

  const handleTocClose = () => {
    setUiState('openToc', false);
  }

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
  useKeyboardNavigation(navigationHandlers.handlePrevPage, navigationHandlers.handleNextPage);
  useScrollNavigation(viewerRef, 100);
  return (
    <>
      {toolBar && (
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
            {book?.name}
          </h3>
          <ReaderToolbar
            navigationHandlers={navigationHandlers}
            onSettingsClick={() => updateUiState('openSettings', true)}
            onTocClick={() => updateUiState('openToc', true)}
          />
        </Header>
      )}
      <Content style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
          <ReadingIndicator currentPage={currentPage} totalPages={totalChapters} />
        </div>
        <div
          ref={viewerRef}
          style={{ width: "100%", height: "100%" }}>
          {/* EPUB 内容将在此处渲染 */}
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
};

export default EpubRenderer;
