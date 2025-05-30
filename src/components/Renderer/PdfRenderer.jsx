import { useState, useEffect } from "react";
import React from "react";
import { Viewer, Worker, SpecialZoomLevel, ProgressBar, ScrollMode } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import { scrollModePlugin } from "@react-pdf-viewer/scroll-mode";
import { Drawer, Button, Space, Select, Modal } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ArrowLeftOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";
import ReadingIndicator from "../../utils/ReadingIndicator";
import ReaderToolbar from "./ReaderToolBar";

import { useKeyboardNavigation, useScrollNavigation } from "../../utils/Tool";

const { Option } = Select;

const PDFRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef,
  customThemeHandler,
}) => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [toolBar, setToolBar] = useState(true);
  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });
  const [readerTheme, setReaderTheme] = useState("light");
  const updateTheme = (value) => {
    setReaderTheme(value);
    if (value == "dark"){
      customThemeHandler(true);
    }
    else{
      customThemeHandler(false);
    }
  };
  const [uiState, setUiState] = useState({
    isFullscreen: false, // 全屏
    openSettings: false, // 页面设置菜单
    openToc: false, //目录的显示与否
  });
  const updateUiState = (key, value) => {
    setUiState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 初始化插件
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();
  const scrollModePluginInstance = scrollModePlugin();
  const bookmarkPluginInstance = bookmarkPlugin();

  const { jumpToPage, } = pageNavigationPluginInstance;
  const { SwitchScrollMode } = scrollModePluginInstance;

  const MAX_SCALE = 5; // 设置最大缩放倍数，可以根据需求调整
  const MIN_SCALE = 0.1; // 最小缩放倍数
  // 自适应选项
  const zoomLevels = [
    { label: "适应宽度", value: SpecialZoomLevel.PageWidth },
    { label: "适合页面", value: SpecialZoomLevel.PageFit },
    { label: "实际大小", value: SpecialZoomLevel.ActualSize },
    { label: "50%", value: 0.5 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1 },
    { label: "125%", value: 1.25 },
    { label: "150%", value: 1.5 },
    { label: "200%", value: 2 },
  ];

  const eventHandlers = {
    onRenditionReady: (rendition) => {
      setReaderState((prev) => ({ ...prev, rendition }));
    },
    onLocationChange: (location) => {
      setReaderState((prev) => ({ ...prev, currentLocation: location }));
    },
    onTocChange: (toc) => {
      setReaderState((prev) => ({ ...prev, toc }));
    },
    onLeftClose: onLeftCloseHandler,
  };

  useEffect(() => {
    if (book instanceof Blob) {
      setPdfUrl(URL.createObjectURL(book));
    } else if (typeof book === "string") {
      setPdfUrl(book);
    }

    // 设置初始缩放为适应页面宽度
    setScale(SpecialZoomLevel.PageWidth);

    return () => {
      if (pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [book]);
  
  useEffect(() => {
    const containerElement = viewerRef.current;
    
    if (!containerElement) return;
    
    const handleClick = (event) => {
      // 获取当前文档的选择对象
      const selection = window.getSelection();
      
      // 检查是否有文本被选中
      if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
        return; // 如果有文本被选中，不切换工具栏
      }
      
      setToolBar(prev => !prev);
    }
    containerElement.addEventListener('click', handleClick);
    
    return () => {
      containerElement.removeEventListener('click', handleClick);
    };
  }, []);
  
  useEffect(() => {
    setTimeout(() => {
      
      // 找到所有具有指定 class 的元素
      const elements = document.querySelectorAll('.rpv-bookmark__title');
      
      // 为每个元素添加样式
      elements.forEach((element) => {
        element.style.color = readerTheme === 'dark' ? '#ffffff' : '#000000'; // 设置文本颜色为红色
      });
      
      const elements2 = document.querySelectorAll('.rpv-bookmark__toggle');
      elements2.forEach((element) => {
        element.style.color = readerTheme === 'dark' ? '#ffffff' : '#000000'; // 设置文本颜色为红色
      });
    }, 100);
  }, [uiState.openToc]); // 空依赖数组，表示仅在组件挂载时执行

  const handleDocumentLoad = (e) => {
    const { doc } = e;
    setTotalPages(doc.numPages);
    eventHandlers.onTocChange(
      Array.from({ length: doc.numPages }, (_, i) => ({
        label: `Page ${i + 1}`,
        pageIndex: i,
      }))
    );
    const savedPage = localStorage.getItem(`pdf-progress-${book.name}`);
    if (savedPage) {
      const pageNumber = parseInt(savedPage, 10);
      if (pageNumber && pageNumber <= doc.numPages) {
        setCurrentPage(pageNumber);
        jumpToPage(pageNumber - 1);
      }
    }
  };

  const handlePageChange = (pageIndex) => {
    const newPage = pageIndex + 1;
    setCurrentPage(newPage);
    localStorage.setItem(`pdf-progress-${book.name}`, newPage.toString());
    eventHandlers.onLocationChange({
      currentPage: newPage,
      totalPages,
    });
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, MAX_SCALE);
    if (!isNaN(newScale) && isFinite(newScale)) {
      setScale(newScale);
      zoomPluginInstance.zoomTo(newScale);
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, MIN_SCALE);
    if (!isNaN(newScale) && isFinite(newScale)) {
      setScale(newScale);
      zoomPluginInstance.zoomTo(newScale);
    }
  };

  const handleZoomChange = (value) => {
    setScale(value);
    zoomPluginInstance.zoomTo(value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      jumpToPage(currentPage - 2);
      handlePageChange(currentPage - 2);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      jumpToPage(currentPage);
      handlePageChange(currentPage);
    }
  };

  const handleFitWidth = () => {
    setScale(SpecialZoomLevel.PageWidth);
    zoomPluginInstance.zoomTo(SpecialZoomLevel.PageWidth);
  };

  const navigationHandlers = {
    handlePrevPage: () => {
      handlePreviousPage();
    },
    handleNextPage: () => {
      handleNextPage();
    },
    handleTocSelect: (location) => {
      console.log("location", readerState.rendition);
      updateUiState("openToc", false);
    },
    onTocClose: () => {
      updateUiState("openToc", false);
    },
  };
  const CustomToolbar = () => (
    <Space>
      <Button.Group>
        <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
        <Select
          value={scale}
          style={{ width: 120 }}
          onChange={handleZoomChange}
          popupMatchSelectWidth={false}
        >
          {zoomLevels.map((level) => (
            <Option key={level.value} value={level.value}>
              {level.label}
            </Option>
          ))}
        </Select>
        <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
      </Button.Group>

      {/* 快速适应页面宽度按钮 */}
      <Button
        icon={<FullscreenOutlined />}
        onClick={handleFitWidth}
        title="Fit to Width"
      />
    </Space>
  );

  const handleTocClose = () => {
    setUiState("openToc", false);
  };

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
            readerTheme={readerTheme}
            navigationHandlers={navigationHandlers}
            onSettingsClick={() => updateUiState("openSettings", true)}
            onTocClick={() => updateUiState("openToc", true)}
            children={CustomToolbar}
            onThemeToggle={() =>
              updateTheme(readerTheme === "light" ? "dark" : "light")
            }
          >
            <CustomToolbar />
          </ReaderToolbar>
        </Header>
      )}
      <Content style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
          <ReadingIndicator currentPage={currentPage} totalPages={totalPages} />
        </div>
        <div ref={viewerRef} style={{ width: "100%", height: "100%", padding: "16px", overflowY: "auto" }}>
          <Worker workerUrl="/pdf.worker.min.js">
            {pdfUrl ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div style={{ flex: 1, overflow: "auto" }}>
                  <Viewer
                    fileUrl={pdfUrl}
                    plugins={[
                      pageNavigationPluginInstance,
                      zoomPluginInstance,
                      scrollModePluginInstance,
                      bookmarkPluginInstance,
                    ]}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    onDocumentLoad={handleDocumentLoad}
                    onPageChange={(e) => handlePageChange(e.currentPage)}
                    onZoom={(e) => setScale(e.scale)}
                    renderLoader={(percentages) => (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ProgressBar progress={Math.round(percentages)} />
                      </div>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div>Loading PDF...</div>
            )}
          </Worker>
        </div>
      </Content>
      <Drawer
        title="目录"
        placement="left"
        open={uiState.openToc}
        onClose={() => handleTocClose()}
        width={300}
        mask={'true'}
        styles={{
          body: {
            paddingTop: 5, paddingBottom: 5, paddingLeft: 0, paddingRight: 0,
            height: 'calc(100% - 105px)', overflow: 'hidden' 
          },
        }}
      >
        {bookmarkPluginInstance.Bookmarks && (
          <bookmarkPluginInstance.Bookmarks />
        )}
      </Drawer>
      <Modal
        open={uiState.openSettings}
        onClose={() => updateUiState('openSettings', false)}
        onCancel={() => updateUiState('openSettings', false)}
        okText={"确认"}
        cancelText={"取消"}
      >
        <Space >
          <SwitchScrollMode mode={ScrollMode.Horizontal}>
            {(props) =>
              <Button
                style={{
                  // backgroundColor: props.isSelected ? '#357edd' : 'transparent',
                  borderColor: props.isSelected ? '#357edd' : 'transparent',
                  // color: props.isSelected ? '#fff' : '#000',

                  borderRadius: '4px',
                  borderStyle: 'solid',
                  borderWidth: '1px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
                onClick={props.onClick}
              >水平阅读</Button>}
          </SwitchScrollMode>
          <SwitchScrollMode mode={ScrollMode.Vertical}>
            {(props) =>
              <Button
                style={{
                  // backgroundColor: props.isSelected ? '#357edd' : 'transparent',
                  borderColor: props.isSelected ? '#357edd' : 'transparent',
                  // color: props.isSelected ? '#fff' : '#000',

                  borderRadius: '4px',
                  borderStyle: 'solid',
                  borderWidth: '1px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
                onClick={props.onClick}>垂直阅读</Button>}
          </SwitchScrollMode>
        </Space>
      </Modal>
    </>
  );
};

export default PDFRenderer;
