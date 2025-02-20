import { useState, useRef, useEffect } from "react";
import { Drawer, Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import Epub from "epubjs";

import { ArrowLeftOutlined } from "@ant-design/icons";

import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
import MenuTocItem from "./MenuTocItem";
import { getItemKey } from "./MenuTocItem";

const EpubRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef
}) => {
  // Local state
  const [currentChapter, setCurrentChapter] = useState('');
    // Reader state
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

  const [readerTheme, setReaderTheme] = useState('light');
  const updateTheme = (value) => {
    setReaderTheme(value);
  }


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

  const bookRef = useRef(null);

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
        });

        // Notify parent about rendition
        eventHandlers.onRenditionReady(rendition);

        // Load and set TOC
        const navigation = await bookRef.current.loaded.navigation;
        eventHandlers.onTocChange(navigation.toc);

        // Restore reading progress
        const savedCfi = localStorage.getItem(`book-progress-${book.name}`);
        rendition.display(savedCfi || undefined);

        // Apply theme settings
        applyThemeSettings(rendition);

        // Set up location change listener
        rendition.on("relocated", handleLocationChange);
      } catch (error) {
        console.error("Error initializing book:", error);
        throw new Error("加载书籍失败，请重试");
      }
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
  }, [readerSettings.fontSize, readerSettings.fontFamily, readerTheme]);

  const applyThemeSettings = (rendition) => {
    rendition.themes.default({
      body: {
        "font-size": `${readerSettings.fontSize}px !important`,
        "font-family": readerSettings.fontFamily,
        "background-color": readerTheme === "light" ? "#fff" : "#1f1f1f",
        color: readerTheme === "light" ? "#000" : "#fff",
      },
    });
  };

  const handleLocationChange = async (location) => {
    // Save progress
    localStorage.setItem(`book-progress-${book.name}`, location.start.cfi);

    // Update current chapter
    const chapter = await bookRef.current.spine.get(location.start.cfi);
    if (chapter) {
      setCurrentChapter(chapter.href);
    }

    // Notify parent
    eventHandlers.onLocationChange(location);
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
      console.log("location", readerState.rendition);

      readerState.rendition?.display(location);
      updateUiState('openToc', false);
    },
    onTocClose: () => {
      updateUiState('openToc', false);
    }
  };

  return (
    <>
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
        <div ref={viewerRef} style={{ width: "100%", height: "100%" }}>
          {/* EPUB 内容将在此处渲染 */}
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
              handlers={navigationHandlers}
              currentChapter={currentChapter} level={0}
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
};

export default EpubRenderer;
