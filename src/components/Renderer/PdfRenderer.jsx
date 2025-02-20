import { useState, useEffect } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { ProgressBar } from '@react-pdf-viewer/core';
import { Drawer, Button, Space, Input, Select } from 'antd';
import {
    ZoomInOutlined,
    ZoomOutOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    MenuOutlined,
    CloseOutlined,
    RollbackOutlined,
    FullscreenOutlined
} from '@ant-design/icons';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';


const { Option } = Select;

const PDFRenderer = ({
    book,
    settings,
    handlers,
    eventHandlers,
    viewerRef,
    onBackToLibrary // 新增返回书架的回调函数
}) => {
    const [pdfUrl, setPdfUrl] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1);

    const [readerTheme, setReaderTheme] = useState('light');
    const updateTheme = (value) => {
        setReaderTheme(value);
    }
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
    // 初始化插件

    const pageNavigationPluginInstance = pageNavigationPlugin();
    const zoomPluginInstance = zoomPlugin();
    const scrollModePluginInstance = scrollModePlugin();
    const bookmarkPluginInstance = bookmarkPlugin();

    const { jumpToPage, getPagesContainer } = pageNavigationPluginInstance;

    // 自适应选项
    const zoomLevels = [
        { label: '适应宽度', value: SpecialZoomLevel.PageWidth },
        { label: '适合页面', value: SpecialZoomLevel.PageFit },
        { label: '实际大小', value: SpecialZoomLevel.ActualSize },
        { label: '50%', value: 0.5 },
        { label: '75%', value: 0.75 },
        { label: '100%', value: 1 },
        { label: '125%', value: 1.25 },
        { label: '150%', value: 1.5 },
        { label: '200%', value: 2 },
    ];

    useEffect(() => {

        if (book instanceof Blob) {
            setPdfUrl(URL.createObjectURL(book));
        } else if (typeof book === 'string') {
            setPdfUrl(book);
        }

        // 设置初始缩放为适应页面宽度
        setScale(SpecialZoomLevel.PageWidth);

        return () => {

            if (pdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [book]);
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
            totalPages
        });
    };

    const handleZoomIn = () => {
        const newScale = Math.min(scale + 0.1, 5);
        setScale(newScale);
        zoomPluginInstance.zoomTo(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale - 0.1, 0.1);
        setScale(newScale);
        zoomPluginInstance.zoomTo(newScale);
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

    const CustomToolbar = () => (
        <div style={{
            padding: '12px',
            background: readerTheme === 'light' ? '#f0f2f5' : '#1f1f1f',
            borderBottom: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <Space>
                {/* 返回书架按钮 */}
                <Button
                    icon={<RollbackOutlined />}
                    onClick={onBackToLibrary}
                    title="Back to Library"
                />

                <Button.Group>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}
                    />
                    <Button
                        icon={<ArrowRightOutlined />}
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                    />
                </Button.Group>

                <span style={{ color: readerTheme === 'light' ? '#000' : '#fff' }}>
                    {`Page ${currentPage} of ${totalPages}`}
                </span>

                <Button.Group>
                    <Button
                        icon={<ZoomOutOutlined />}
                        onClick={handleZoomOut}
                    />
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
                    <Button
                        icon={<ZoomInOutlined />}
                        onClick={handleZoomIn}
                    />
                </Button.Group>

                {/* 快速适应页面宽度按钮 */}
                <Button
                    icon={<FullscreenOutlined />}
                    onClick={handleFitWidth}
                    title="Fit to Width"
                />
            </Space>
        </div>
    );

    const themeStyles = {
        viewer: {
            backgroundColor: readerTheme === 'light' ? '#ffffff' : '#1f1f1f',
            color: readerTheme === 'light' ? '#000000' : '#ffffff',
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
        },
    };

    return (
        <div ref={viewerRef} style={{ width: '100%', height: '100%' }}>
            <Worker workerUrl="/pdf.worker.min.js">
                {pdfUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CustomToolbar />
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <Viewer
                                fileUrl={pdfUrl}
                                plugins={[

                                    pageNavigationPluginInstance,
                                    zoomPluginInstance,
                                    scrollModePluginInstance,
                                    bookmarkPluginInstance
                                ]}
                                defaultScale={SpecialZoomLevel.PageWidth}
                                theme={themeStyles}
                                onDocumentLoad={handleDocumentLoad}
                                onPageChange={(e) => handlePageChange(e.currentPage)}
                                onZoom={(e) => setScale(e.scale)}
                                renderLoader={(percentages) => (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
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


            <Drawer
                title="目录"
                placement="left"
                open={uiState.showToc}
                onClose={() => handlers.onTocClose()}
                width={300}
                styles={{
                    body: {
                        background: readerTheme === 'light' ? '#fff' : '#1f1f1f',
                        color: readerTheme === 'light' ? '#000' : '#fff'
                    }
                }}

            >
                {bookmarkPluginInstance.Bookmarks && <bookmarkPluginInstance.Bookmarks />}
            </Drawer>



        </div>
    );
};

export default PDFRenderer;
