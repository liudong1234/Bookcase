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
  // UI state
  const [uiState, setUiState] = useState({
    isFullscreen: false,
    openSettings: false,
    showToc: false,
  });

  const viewerRef = useRef(null);

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
        uiState={uiState}
        onClose={onClose}
        viewerRef={viewerRef}
      />
    );
  };

  return (
    <Layout
      className="reader-layout"
      style={{
        height: "100vh",
      }}
    >
      <Content style={{ position: "relative", overflow: "hidden" }}>
        {getRenderer()}
      </Content>
    </Layout>
  );
};

export default BookReader;