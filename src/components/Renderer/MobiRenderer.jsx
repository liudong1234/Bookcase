import { useState, useRef, useEffect } from "react";
import { Drawer, Button } from "antd";
import { Content, Header } from "antd/es/layout/layout";

import { ArrowLeftOutlined } from "@ant-design/icons";

import ReaderToolbar from "./ReaderToolBar";
import SettingsModal from "./SettingsModal";
import MenuTocItem from "./MenuTocItem";
import { getItemKey } from "./MenuTocItem";
import MobiParser from "../../utils/bookParser/MobiParser";

import '../BookReader.css'
import { use } from "react";

const MobiRenderer = ({
  book,
  onLeftCloseHandler,
  viewerRef
}) => {
  const [mobibook, setMobiBook] = useState();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionUrl, setSectionUrl] = useState(null);
  const [readerTheme, setReaderTheme] = useState('light');
  const [title, setTitle] = useState('');
  const [toolBar, setToolBar] = useState(true);


  const [readerState, setReaderState] = useState({
    currentLocation: null,
    toc: [],
    rendition: null,
  });
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
  const eventHandlers = {
    onTocChange: (toc) => {
      setReaderState(prev => ({ ...prev, toc }));
    },
    onLeftClose: onLeftCloseHandler,
  };
  const iframeRef = useRef(null);
  const bookRef = useRef(null);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const mobi = new MobiParser();
        bookRef.current = await mobi.parse(book);
        const toc = bookRef.current.toc;
        const t = bookRef.current.metadata?.title;
        eventHandlers.onTocChange(toc);
        setMobiBook(bookRef.current);
        setTitle(t);
      }
      catch (e) {
        console.error('Error loading MOBI file:', e);
      }
    }
    if (book)
      loadBook();
  }, []);

  // 加载章节内容
  useEffect(() => {
    const loadSection = async () => {
      if (!mobibook || !mobibook.sections || !mobibook.sections[currentSectionIndex]) return;

      try {
        console.log(mobibook.sections);
        const url = await mobibook.sections[currentSectionIndex].load();
        setSectionUrl(url);
      } catch (e) {
        console.error('Error loading section:', e);
      }
    };

    if (mobibook) {
      loadSection();
    }
  }, [mobibook, currentSectionIndex]);

  // 处理内部导航链接
  useEffect(() => {
    const handleIframeLoad = () => {
      if (!iframeRef.current || !mobibook) return;

      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      // 为所有内部链接添加点击事件
      const links = iframeDoc.querySelectorAll('a[href^="filepos:"]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          navigateToHref(href);
        });
      });
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [book, sectionUrl]);

  useEffect(() => {
    if (iframeRef.current) {
      applyThemeSettings();
    }
  }, [readerSettings.fontSize, readerSettings.fontFamily, readerTheme]);

  const applyThemeSettings = () => {
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    const body = iframeDoc.body;
    body.style.fontSize = `${readerSettings.fontSize}px`;
    body.style.fontFamily = readerSettings.fontFamily;
  };


  // 导航到指定href
  const navigateToHref = (href) => {
    if (!mobibook || !href) return;
    console.log(mobibook);
    try {
      const { index, anchor } = mobibook.resolveHref(href);

      if (index !== currentSectionIndex) {
        setCurrentSectionIndex(index);
      } else if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const element = anchor(iframeDoc);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };
  // 上一页/下一页导航
  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const goToNextSection = () => {
    if (mobibook && currentSectionIndex < mobibook.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const navigationHandlers = {
    handlePrevPage: () => {
      goToPreviousSection();
    },
    handleNextPage: () => {
      goToNextSection();
    },
    handleTocSelect: (href) => {
      navigateToHref(href.href)
    }
  }

  const handleTocClose = () => {
    setUiState('openToc', false);
  }

  return (
    <>
      {
        toolBar && (
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
              {title}
            </h3>
            <ReaderToolbar
              readerTheme={readerTheme}
              navigationHandlers={navigationHandlers}
              onSettingsClick={() => updateUiState('openSettings', true)}
              onTocClick={() => updateUiState('openToc', true)}
              onThemeToggle={() => updateTheme(readerTheme === 'light' ? 'dark' : 'light')}
            />
          </Header>
        )
      }

      <Content style={{ position: "relative", overflow: "hidden" }}>
        <div ref={viewerRef} className="mobi-iframe-container">
          {sectionUrl && (
            <iframe
              ref={iframeRef}
              src={sectionUrl}
              title={`Section ${currentSectionIndex + 1}`}
              className="mobi-content-iframe"
              sandbox="allow-same-origin allow-scripts"
            />
          )}

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
              tocSelectHandler={navigationHandlers.handleTocSelect}
              currentChapter={currentSectionIndex} level={0}
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
}


export default MobiRenderer;