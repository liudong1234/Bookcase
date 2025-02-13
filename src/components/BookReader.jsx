import { useState, useRef } from "react";
import {
  Layout,
  Button,
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
  SettingTwoTone,
} from "@ant-design/icons";
import "./BookReader.css";
import EpubRenderer from "./Renderer/EpubRenderer";
import PDFRenderer from "./Renderer/PdfRenderer";
import MarkdownRenderer from "./Renderer/MarkdownRenderer";
const { Header, Content } = Layout;

// Define renderer mapping
const RENDERERS = {
  epub: EpubRenderer,
  pdf: PDFRenderer,
  md: MarkdownRenderer,
  txt: MarkdownRenderer,
};

const BookReader = ({ book, onClose }) => {
  // State for reader settings
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: "SimSun",
    theme: "light",
    readingMode: "paginated",
    managerMode: "default",
  });
  
  // UI state
  const [uiState, setUiState] = useState({
    isFullscreen: false,
    openSettings: false,
    showToc: false,
  });
  
  // Reader state
  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });

  const viewerRef = useRef(null);

  // Unified settings update handler
  const updateSettings = (key, value) => {
    setReaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Unified UI state update handler
  const updateUiState = (key, value) => {
    setUiState(prev => ({
      ...prev,
      [key]: value
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
      console.log("location", readerState.rendition);

      readerState.rendition?.display(location);
      updateUiState('showToc', false);
    },
    onTocClose: () => {
     updateUiState('showToc', false);
    }
  };

  // Reader event handlers
  const readerEventHandlers = {
    onRenditionReady: (rendition) => {
      setReaderState(prev => ({ ...prev, rendition }));
    },
    onLocationChange: (location) => {
      setReaderState(prev => ({ ...prev, currentLocation: location }));
    },
    onTocChange: (toc) => {
      setReaderState(prev => ({ ...prev, toc }));
    }
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
      managerMode:managerMode
    }));
  };

  // Get the appropriate renderer based on file type
  const getRenderer = () => {
    const fileType = book?.name?.split('.').pop();
    const Renderer = RENDERERS[fileType];
    if (!Renderer) {
      return <div>不支持的文件类型</div>;
    }
    return (
      <Renderer
        book={book}
        settings={readerSettings}
        handlers={navigationHandlers}
        eventHandlers={readerEventHandlers}
        uiState={uiState}
        readerState={readerState}
        viewerRef={viewerRef}
      />
    );
  };

  return (
    <Layout
      className="reader-layout"
      style={{
        height: "100vh",
        background: readerSettings.theme === "light" ? "#fff" : "#1f1f1f",
      }}
    >
      <Header
        className="reader-header"
        style={{
          background: readerSettings.theme === "light" ? "#fff" : "#1f1f1f",
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
            color: readerSettings.theme === "light" ? "#000" : "#fff",
          }}
        >
          {book?.name}
        </h3>
        <ReaderToolbar
          settings={readerSettings}
          uiState={uiState}
          navigationHandlers={navigationHandlers}
          onSettingsClick={() => updateUiState('openSettings', true)}
          onTocClick={() => updateUiState('showToc', true)}
          onThemeToggle={() => updateSettings('theme', readerSettings.theme === 'light' ? 'dark' : 'light')}
        />
      </Header>

      <Content style={{ position: "relative", overflow: "hidden" }}>
        { getRenderer() }
      </Content>

      <SettingsModal
        open={uiState.openSettings}
        settings={readerSettings}
        onSettingChange={updateSettings}
        onModeChange={handleModeChange}
        onClose={() => updateUiState('openSettings', false)}
      />
    </Layout>
  );
};

// Separate components for better organization
const ReaderToolbar = ({ 
  settings, 
  uiState, 
  navigationHandlers, 
  onSettingsClick, 
  onTocClick, 
  onThemeToggle 
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
          icon={ document.fullscreenElement ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();} }
        />
      </Tooltip>
      <Tooltip title="设置">
        <Button icon={<SettingTwoTone />} onClick={onSettingsClick} />
      </Tooltip>
    </div>
  );
};

const SettingsModal = ({ open, settings, onSettingChange, onModeChange, onClose }) => {
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
        <span style={{ fontSize: "14px", marginRight: "10px" }}>
          阅读模式
        </span>
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
          onChange={(value) => onSettingChange('fontFamily', value)}
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
            onChange={(value) => onSettingChange('fontSize', value)}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={12}
            max={50}
            style={{ margin: "0 16px" }}
            value={settings.fontSize}
            onChange={(value) => onSettingChange('fontSize', value)}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default BookReader;