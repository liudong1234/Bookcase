// BookReader.jsx
import { useState, useRef, useEffect } from "react";
import {
  Layout,
  Button,
  Drawer,
  Tooltip,
  Row,
  Col,
  Select,
  Modal,
  Slider,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CiCircleTwoTone,
  SettingTwoTone,
} from "@ant-design/icons";
import "./BookReader.css";
import useEpubReader from "../utils/bookParserContent/EpubReader";
import usePdfReader from "../utils/bookParserContent/PdfReader";
const { Header, Content } = Layout;

const BookReader = ({ book, onClose }) => {
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("SimSun");
  const [theme, setTheme] = useState("light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingMode, setReadingMode] = useState("paginated");
  const [managerMode, setManagerMode] = useState("default");
  const [openResponsive, setOpenResponsive] = useState(false);

  const [showToc, setShowToc] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const PdfRender = null;
  const viewerRef = useRef(null);
  const fileType = getFileType(book);

  const {toc, currentCfi, rendition, currentChapter, setCurrentCfi, setCurrentChapter, }
   = useEpubReader(book, readingMode, managerMode, theme, fontSize, fontFamily, viewerRef);
  const {toc2,
    currentCfi2,
    rendition2,
    currentChapter2,
    setCurrentCfi2,
    setCurrentChapter2,
    renderPDF,
    currentPage,
    totalPages} =
 usePdfReader(
          book,
          readingMode,
          PdfRender,
          theme,
          fontSize,
          fontFamily,
          viewerRef
        );
  // 生成唯一标识符的辅助函数（根据目录路径）
  const getItemKey = (item, parentPath = "") => {
    const currentPath = `${parentPath}-${item.id || item.label}`;
    return currentPath;
  };

  useEffect(() => {
    window.addEventListener("keyup", handleKeyPress);
    return () => {
      window.removeEventListener("keyup", handleKeyPress);
    };
  }, [rendition]);

  useEffect(() => {
    if (showToc && currentChapter) {
      const timer = setTimeout(() => {
        const currentElement = document.querySelector(
          '[data-current-chapter="true"]'
        );
        if (currentElement) {
          currentElement.scrollIntoView({ block: "nearest", behavior: "auto" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showToc, currentChapter, expandedItems]);

  // 在打开目录时强制更新展开状态
  useEffect(() => {
    if (showToc && currentChapter) {
      const expanded = {};
      expandParentItems(toc, currentChapter, "", expanded);
      setExpandedItems((prev) => ({ ...prev, ...expanded }));
    }
  }, [showToc, currentChapter, toc]);

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleNextPage = () => {
    rendition?.next();
  };

  const handlePrevPage = () => {
    rendition?.prev();
  };

  // 翻页功能
  const handleKeyPress = (e) => {
    if (e.key === "ArrowLeft") {
      handlePrevPage();
    } else if (e.key === "ArrowRight") {
      handleNextPage();
    }
  };

  // 处理目录点击
  const handleTocSelect = (href) => {
    rendition?.display(href);
    setShowToc(false);
  };

  // 切换阅读模式
  const handleModeChange = (value) => {
    if (value === "successive") {
      setManagerMode("continuous");
      value = "scrolled";
    } else if (value === "simulation") {
      setManagerMode("continuous");
      value = "paginated";
    } else {
      setManagerMode("default");
    }
    setReadingMode(value);
    rendition?.flow(value);
  };

  // Function to find TOC item by href
  const findTocItemByHref = (items, href) => {
    for (const item of items) {
      if (item.href === href) {
        return item;
      }
      if (item.subitems?.length > 0) {
        const found = findTocItemByHref(item.subitems, href);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to expand parent items of current chapter
  const expandParentItems = (items, href, parentPath = "", expanded = {}) => {
    for (const item of items) {
      const itemKey = getItemKey(item, parentPath);

      if (item.href === href) {
        // 展开所有父路径
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
        handleTocSelect(item.href);
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
              ? theme === "light"
                ? "#e6f4ff"
                : "#111d2c"
              : "transparent",
            ":hover": {
              background: theme === "light" ? "#f5f5f5" : "#262626",
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
                ? theme === "light"
                  ? "#1890ff"
                  : "#40a9ff"
                : theme === "light"
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

  const onChangeFontSize = (newValue) => {
    setFontSize(newValue);
  };
  const onChangeFontFamily = (newValue) => {
    setFontFamily(newValue);
  };
  return (
    <Layout
      className="reader-layout"
      style={{
        height: "100vh",
        background: theme === "light" ? "#fff" : "#1f1f1f",
      }}
    >
      <Header
        className="reader-header"
        style={{
          background: theme === "light" ? "#fff" : "#1f1f1f",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            onClose();
          }}
          style={{ marginRight: 16 }}
        />
        <h3
          style={{
            margin: 0,
            flex: 1,
            color: theme === "light" ? "#000" : "#fff",
          }}
        >
          {book?.name}
        </h3>
        <div className="reader-tools" style={{ display: "flex", gap: "8px" }}>
          <Tooltip title="上一页">
            <Button icon={<LeftOutlined />} onClick={() => handlePrevPage()} />
          </Tooltip>
          <Tooltip title="下一页">
            <Button icon={<RightOutlined />} onClick={() => handleNextPage()} />
          </Tooltip>
          <Tooltip title="切换主题">
            <Button
              onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? "🌙" : "☀️"}
            </Button>
          </Tooltip>
          <Tooltip title="目录">
            <Button icon={<MenuOutlined />} onClick={() => setShowToc(true)} />
          </Tooltip>
          <Tooltip title="全屏">
            <Button
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={toggleFullscreen}
            />
          </Tooltip>
          <Tooltip title="设置">
            <Button
              icon={<SettingTwoTone />}
              onClick={() => setOpenResponsive(true)}
            />
          </Tooltip>
        </div>
      </Header>
      {fileType === 'epub' && (
          <Content style={{ position: "relative", overflow: "hidden" }}>
            <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
          </Content>
        )}
      {fileType === "pdf" && (
          <Content>
            <PdfRender></PdfRender>
          </Content>
        )}

      <Drawer
        title="目录"
        placement="left"
        open={showToc}
        onClose={() => setShowToc(false)}
        width={300}
        styles={{
          background: theme === "light" ? "#fff" : "#1f1f1f",
        }}
        className="my-toc-drawer"
      >
        <div
          className="toc-list"
          style={{
            height: "100%",
            overflow: "auto",
            background: theme === "light" ? "#fff" : "#1f1f1f",
          }}
        >
          {toc.map((item, index) => (
            <TocItem key={getItemKey(item)} item={item} level={0} />
          ))}
        </div>
      </Drawer>

      <Modal
        title="页面设置"
        centered
        open={openResponsive}
        onOk={() => setOpenResponsive(false)}
        onCancel={() => setOpenResponsive(false)}
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
          <span style={{ fontSize: "14px", marginRight: "10px" }}>
            阅读模式
          </span>
          <Tooltip title="阅读模式">
            <Select
              defaultValue="平滑"
              onChange={handleModeChange}
              style={{ width: 120 }}
              options={[
                {
                  label: <span>水平阅读</span>,
                  options: [
                    {
                      label: <span>平滑</span>,
                      value: "paginated",
                    },
                    {
                      label: <span>仿真</span>,
                      value: "simulation",
                    },
                  ],
                },
                {
                  label: <span>垂直阅读</span>,
                  options: [
                    {
                      label: <span>普通</span>,
                      value: "scrolled",
                    },
                    {
                      label: <span>连续</span>,
                      value: "successive",
                    },
                  ],
                },
              ]}
            />
          </Tooltip>
        </Row>
        <Row>
          <span style={{ fontSize: "14px", marginRight: "10px" }}>字体</span>
          <Tooltip title="阅读模式">
            <Select
              defaultValue="SimSun"
              onChange={onChangeFontFamily}
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
          </Tooltip>
        </Row>
        <Row>
          <Col span={12}>
            <Slider
              min={12}
              max={50}
              onChange={onChangeFontSize}
              value={typeof fontSize === "number" ? fontSize : 12}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              min={12}
              max={50}
              style={{
                margin: "0 16px",
              }}
              value={fontSize}
              onChange={onChangeFontSize}
            />
          </Col>
        </Row>
        <Row></Row>
      </Modal>
    </Layout>
  );
};

// 判断不同文件类型
const getFileType = (file) => {
  if (file?.name?.endsWith(".epub")) {
    return "epub";
  } else if (file?.name?.endsWith(".pdf")) {
    return "pdf";
  }
  return null;
};

export default BookReader;
