import { useRef } from "react";
import { Layout } from "antd";
import "./BookReader.css";
import EpubRenderer from "./Renderer/EpubRenderer";
import PDFRenderer from "./Renderer/PdfRenderer";
import MarkdownRenderer from "./Renderer/MarkdownRenderer";
import MobiRenderer from "./Renderer/MobiRenderer";
// Define renderer mapping
const RENDERERS = {
  epub: EpubRenderer,
  pdf: PDFRenderer,
  md: MarkdownRenderer,
  txt: MarkdownRenderer,
  mobi: MobiRenderer,
};

const BookReader = ({ book, onClose, customThemeHandler }) => {
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
        viewerRef={viewerRef}
        onLeftCloseHandler={onClose}
        customThemeHandler={customThemeHandler}
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
      { getRenderer() }
    </Layout>
  );
};

export default BookReader;