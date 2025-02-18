import { useState, useRef, useEffect } from "react";
import { Drawer, Button, Select, Tooltip  } from "antd";
import { CiCircleTwoTone, ArrowLeftOutlined,LeftOutlined, 
  RightOutlined,MenuOutlined,FullscreenOutlined, SettingTwoTone,FullscreenExitOutlined       } from "@ant-design/icons";
import Epub from "epubjs";
import { Header, Content } from "antd/es/layout/layout";

const EpubRenderer = ({ book, uiState, onClose, viewerRef }) => {
  // Local state
  const [currentChapter, setCurrentChapter] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
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
          flow: settings.readingMode,
          manager: settings.managerMode,
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
  }, [book, settings.readingMode, settings.managerMode]);

  // Apply theme settings when they change
  useEffect(() => {
    if (bookRef.current?.rendition) {
      applyThemeSettings(bookRef.current.rendition);
    }
  }, [settings.fontSize, settings.fontFamily, settings.theme]);

  const applyThemeSettings = (rendition) => {
    rendition.themes.default({
      body: {
        "font-size": `${settings.fontSize}px !important`,
        "font-family": settings.fontFamily,
        "background-color": settings.theme === "light" ? "#fff" : "#1f1f1f",
        color: settings.theme === "light" ? "#000" : "#fff",
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

  // TOC related utilities
  const getItemKey = (item, parentPath = "") => {
    return `${parentPath}-${item.id || item.label}`;
  };

  const expandParentItems = (items, href, parentPath = "", expanded = {}) => {
    for (const item of items) {
      const itemKey = getItemKey(item, parentPath);

      if (item.href === href) {
        let currentPath = parentPath;
        while (currentPath) {
          expanded[currentPath] = true;
          currentPath = currentPath.substring(0, currentPath.lastIndexOf("-"));
        }
        return true;
      }

      if (item.subitems?.length > 0) {
        const found = expandParentItems(
          item.subitems,
          href,
          getItemKey(item, parentPath),
          expanded
        );
        if (found) {
          expanded[itemKey] = true;
          return true;
        }
      }
    }
    return false;
  };

  const TocItem = ({ item, level = 0, parentPath = "" }) => {
    const itemKey = getItemKey(item, parentPath);
    const hasSubItems = item.subitems?.length > 0;
    const isExpanded = expandedItems[itemKey] || false;
    const isCurrentChapter = item.href === currentChapter;

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
        handlers.handleTocSelect(item.href);
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
          data-current-chapter={isCurrentChapter ? "true" : undefined}
          style={{
            padding: "8px 16px",
            paddingLeft: `${16 + level * 20}px`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "background 0.2s",
            background: isCurrentChapter
              ? settings.theme === "light"
                ? "#e6f4ff"
                : "#111d2c"
              : "transparent",
            ":hover": {
              background: settings.theme === "light" ? "#f5f5f5" : "#262626",
            },
          }}
          onClick={handleItemClick}
        >
          {/* 展开/折叠箭头 */}
          {hasSubItems && (
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

          {/* 目录标签 */}
          <span
            style={{
              flex: 1,
              color: isCurrentChapter
                ? settings.theme === "light"
                  ? "#1890ff"
                  : "#40a9ff"
                : settings.theme === "light"
                ? "#000"
                : "#fff",
              fontSize: 14 - level * 0.5,
              fontWeight: isCurrentChapter ? 500 : 400,
            }}
          >
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
    <>
      <Header
        className="reader-header"
        style={{
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onClose}
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
      </Header>
      <ReaderToolbar
          settings={settings}
          uiState={uiState}
          navigationHandlers={navigationHandlers}
          onSettingsClick={() => updateUiState('openSettings', true)}
          onTocClick={() => updateUiState('showToc', true)}
          onThemeToggle={() => updateSettings('theme', readerSettings.theme === 'light' ? 'dark' : 'light')}
        />
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }}>
        {/* EPUB 内容将在此处渲染 */}
      </div>
      <Drawer
        title="目录"
        placement="left"
        open={uiState.showToc}
        onClose={() => handlers.onTocClose()}
        width={300}
        styles={{
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
            <TocItem key={getItemKey(item)} item={item} level={0} />
          ))}
        </div>
      </Drawer>
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
