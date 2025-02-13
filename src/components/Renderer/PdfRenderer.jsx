import { useState, useEffect } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { bookmarkPlugin  } from '@react-pdf-viewer/bookmark';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { ProgressBar } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Drawer } from 'antd';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/scroll-mode';

// TODO 将固化的插件功能，移植到自定义ui上
const PDFRenderer = ({
  book,
  settings,
  handlers,
  eventHandlers,
  uiState,
  readerState,
  viewerRef
}) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Initialize plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();
  const scrollModePluginInstance = scrollModePlugin();
  const bookmarkPluginInstance = bookmarkPlugin();

  const { CurrentScale, ZoomIn, ZoomOut } = zoomPluginInstance;
  const { CurrentPageInput, NumberOfPages } = pageNavigationPluginInstance;
  const { SwitchScrollMode } = scrollModePluginInstance;
  const { Bookmarks } = bookmarkPluginInstance;
  const {DefaultLayout} = defaultLayoutPluginInstance;
  useEffect(() => {
    // Create URL for the PDF file
    if (book instanceof Blob) {
      setPdfUrl(URL.createObjectURL(book));
    } else if (typeof book === 'string') {
      setPdfUrl(book);
    }

    return () => {
      // Cleanup URL when component unmounts
      if (pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [book]);

  // Handle reading mode changes
  useEffect(() => {
    if (scrollModePluginInstance) {
      const scrollMode = settings.readingMode === 'scrolled' ? 'vertical' : 'horizontal';
      scrollModePluginInstance.switchScrollMode(scrollMode);
    }
  }, [settings.readingMode, scrollModePluginInstance]);

  // Apply theme and font settings
  const themeStyles = {
    viewer: {
      backgroundColor: settings.theme === 'light' ? '#ffffff' : '#1f1f1f',
      color: settings.theme === 'light' ? '#000000' : '#ffffff',
      fontSize: `${settings.fontSize}px`,
      fontFamily: settings.fontFamily,
    },
  };

  const handleDocumentLoad = (e) => {
    const { doc } = e;
    setTotalPages(doc.numPages);
    
    // Generate table of contents
    const toc = Array.from({ length: doc.numPages }, (_, i) => ({
      label: `Page ${i + 1}`,
      pageIndex: i,
    }));
    
    eventHandlers.onTocChange(toc);

    // Restore last reading position
    const savedPage = localStorage.getItem(`pdf-progress-${book.name}`);
    if (savedPage) {
      const pageNumber = parseInt(savedPage, 10);
      if (pageNumber && pageNumber <= doc.numPages) {
        setCurrentPage(pageNumber);
      }
    }
  };

  const handlePageChange = (e) => {
    const { currentPage } = e;
    setCurrentPage(currentPage);
    localStorage.setItem(`pdf-progress-${book.name}`, currentPage.toString());
    eventHandlers.onLocationChange({ currentPage, totalPages });
  };

  // Override navigation handlers for PDF-specific behavior
  const pdfNavigationHandlers = {
    ...handlers,
    handlePrevPage: () => {
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    },
    handleNextPage: () => {
      if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    },
    handleTocSelect: (pageIndex) => {
      setCurrentPage(pageIndex + 1);
      handlers.onTocClose();
    },
  };

  return (
    <div ref={viewerRef} style={{ width: '100%', height: '100%' }}>
      <Worker workerUrl="/pdf.worker.min.js">
        {pdfUrl ? (
          <Viewer
            fileUrl={pdfUrl}
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
              zoomPluginInstance,
              scrollModePluginInstance,
              bookmarkPluginInstance,
            ]}
            defaultScale={SpecialZoomLevel.PageFit}
            theme={themeStyles}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            renderLoader={(percentages) => (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProgressBar progress={Math.round(percentages)} />
              </div>
            )}
          />
        ) : (
          <div>No PDF file loaded</div>
        )}
      </Worker>
      {
        uiState.showToc && 
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
          <DefaultLayout></DefaultLayout>
        </Drawer>

      }

    </div>
  );
};

export default PDFRenderer;