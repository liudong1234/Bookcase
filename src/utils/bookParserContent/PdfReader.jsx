import { useState, useEffect } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { ScrollMode } from '@react-pdf-viewer/core';

const usePdfReader = (book, readingMode, managerMode, theme, fontSize, fontFamily, viewerRef) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [toc, setToc] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [currentCfi, setCurrentCfi] = useState(null);
  
  // 插件配置
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],  // 禁用默认侧边栏
  });
  
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const scrollModePluginInstance = scrollModePlugin();
  
  // 更新TOC
  useEffect(() => {
    const loadToc = async () => {
      if (!book) return;
      try {
        const pdfjs = await import('pdfjs-dist');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        
        console.log('pdf', book.file);
        const arrayBuffer = await book.file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        const outline = await pdf.getOutline();
        
        if (outline) {
          const processTocItem = (items) => {
            return items.map(item => ({
              label: item.title,
              href: `${item.pageNumber}`,
              subitems: item.items ? processTocItem(item.items) : []
            }));
          };
          
          setToc(processTocItem(outline));
        }
      } catch (error) {
        console.error('Failed to load PDF TOC:', error);
        setToc([]);
      }
    };

    loadToc();
  }, [book]);

  // 渲染PDF
  const renderPDF = () => {
    if (!book?.file || !viewerRef.current) return null;

    const fileUrl = URL.createObjectURL(book.file);

    // 根据阅读模式设置滚动模式
    let scrollMode = ScrollMode.Page;
    if (readingMode === 'scrolled' || readingMode === 'successive') {
      scrollMode = ScrollMode.Vertical;
    }

    scrollModePluginInstance.switchScrollMode(scrollMode);

    return (
      <Worker workerUrl="/pdf.worker.js">
      <div
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: theme === "light" ? "#fff" : "#1f1f1f",
        }}
      >
        <Viewer
          fileUrl={fileUrl}
          plugins={[
            defaultLayoutPluginInstance,
            pageNavigationPluginInstance,
            scrollModePluginInstance,
          ]}
          defaultScale={SpecialZoomLevel.PageFit}
          onDocumentLoad={(e) => {
            setTotalPages(e.doc.numPages);
          }}
          onPageChange={(e) => {
            setCurrentPage(e.currentPage);
            setCurrentChapter(`${e.currentPage}`);
          }}
          theme={theme === "light" ? "light" : "dark"}
        />
      </div>
    </Worker>
    );
  };

  // 设置模拟翻页功能
  useEffect(() => {
    if (!viewerRef.current) return;

    const mockRendition = {
      next: () => {
        if (currentPage < totalPages) {
          pageNavigationPluginInstance.goToNextPage();
        }
      },
      prev: () => {
        if (currentPage > 1) {
          pageNavigationPluginInstance.goToPreviousPage();
        }
      },
      display: (pageNumber) => {
        pageNavigationPluginInstance.goToPage(parseInt(pageNumber) - 1);
      },
      flow: (mode) => {
        // 处理阅读模式切换
        let scrollMode = ScrollMode.Page;
        if (mode === 'scrolled' || mode === 'successive') {
          scrollMode = ScrollMode.Vertical;
        }
        scrollModePluginInstance.switchScrollMode(scrollMode);
      }
    };

    setRendition(mockRendition);
  }, [viewerRef, currentPage, totalPages]);

  return {
    toc,
    currentCfi,
    rendition,
    currentChapter,
    setCurrentCfi,
    setCurrentChapter,
    renderPDF,
    currentPage,
    totalPages
  };
};

export default usePdfReader;