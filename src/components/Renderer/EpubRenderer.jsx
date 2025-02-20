import { useState, useRef, useEffect } from "react";
import { Drawer, Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import Epub from "epubjs";
import { Header, Content } from "antd/es/layout/layout";

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

  const [settings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: "SimSun",
    theme: "light",
    readingMode: "paginated",
    managerMode: "default",
  });

  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });

  const updateSettings = (key, value) => {
    setReaderSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateUiState = (key, value) => {
    setUiState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Navigation handlers
  const navigationHandlers = {
    handlePrevPage: () => {
      readerState.rendition?.prev();
    },
    handleNextPage: () => {
      readerState.rendition?.next();
    },
    handleTocSelect: (location) => {
      readerState.rendition?.display(location);
      updateUiState("showToc", false);
    },
    onTocClose: () => {
      updateUiState("showToc", false);
    },
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

  // Reading mode handler
  const handleModeChange = (value) => {
    let managerMode = "default";
    if (["successive", "simulation"].includes(value)) {
      managerMode = "continuous";
      value = value === "successive" ? "scrolled" : "paginated";
    }

    setReaderSettings((prev) => ({
      ...prev,
      readingMode: value,
      managerMode: managerMode,
    }));
  };

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
        readerEventHandlers.onRenditionReady(rendition);

        // Load and set TOC
        const navigation = await bookRef.current.loaded.navigation;
        readerEventHandlers.onTocChange(navigation.toc);

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

const ReaderToolbar = ({
  settings,
  uiState,
  navigationHandlers,
  onSettingsClick,
  onTocClick,
  onThemeToggle,
}) => {
  return (
    <div className="reader-tools" style={{ display: "flex", gap: "8px" }}>
      <Tooltip title="上一页">
        <Button
          icon={<LeftOutlined />}
          onClick={navigationHandlers.handlePrevPage}
        />
      </Tooltip>
      <Tooltip title="下一页">
        <Button
          icon={<RightOutlined />}
          onClick={navigationHandlers.handleNextPage}
        />
      </Tooltip>
      <Tooltip title="切换主题">
        <Button onClick={onThemeToggle}>
          {settings.theme === "light" ? "🌙" : "☀️"}
        </Button>
      </Tooltip>
      <Tooltip title="目录">
        <Button icon={<MenuOutlined />} onClick={onTocClick} />
      </Tooltip>
      <Tooltip title="全屏">
        <Button
          icon={
            document.fullscreenElement ? (
              <FullscreenExitOutlined />
            ) : (
              <FullscreenOutlined />
            )
          }
          onClick={() => {
            document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen();
          }}
        />
      </Tooltip>
      <Tooltip title="设置">
        <Button icon={<SettingTwoTone />} onClick={onSettingsClick} />
      </Tooltip>
    </div>
  );
};

const SettingsModal = ({
  open,
  settings,
  onSettingChange,
  onModeChange,
  onClose,
}) => {
  return (
    <Modal
      title="页面设置"
      centered
      open={open}
      onOk={onClose}
      onCancel={onClose}
      width={{
        xs: "90%",
        sm: "80%",
        md: "70%",
        lg: "60%",
        xl: "50%",
        xxl: "40%",
      }}
    >
      <Row>
        <span style={{ fontSize: "14px", marginRight: "10px" }}>阅读模式</span>
        <Select
          defaultValue="平滑"
          onChange={onModeChange}
          style={{ width: 120 }}
          options={[
            {
              label: <span>水平阅读</span>,
              options: [
                { label: <span>平滑</span>, value: "paginated" },
                { label: <span>仿真</span>, value: "simulation" },
              ],
            },
            {
              label: <span>垂直阅读</span>,
              options: [
                { label: <span>普通</span>, value: "scrolled" },
                { label: <span>连续</span>, value: "successive" },
              ],
            },
          ]}
        />
      </Row>
      <Row>
        <span style={{ fontSize: "14px", marginRight: "10px" }}>字体</span>
        <Select
          value={settings.fontFamily}
          onChange={(value) => onSettingChange("fontFamily", value)}
          style={{ width: 150 }}
          options={[
            { label: "微软雅黑", value: "Microsoft YaHei" },
            { label: "宋体", value: "SimSun" },
            { label: "黑体", value: "SimHei" },
            { label: "楷体", value: "KaiTi" },
            { label: "华文行楷", value: "华文行楷" },
            { label: "仿宋", value: "FangSong" },
            { label: "幼圆", value: "YouYuan" },
            { label: "隶书", value: "LiSu" },
          ]}
        />
      </Row>
      <Row>
        <Col span={12}>
          <Slider
            min={12}
            max={50}
            value={settings.fontSize}
            onChange={(value) => onSettingChange("fontSize", value)}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={12}
            max={50}
            style={{ margin: "0 16px" }}
            value={settings.fontSize}
            onChange={(value) => onSettingChange("fontSize", value)}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default EpubRenderer;
