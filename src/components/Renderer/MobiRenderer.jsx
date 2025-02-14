import { useState, useRef, useEffect } from "react";
import { Drawer } from "antd";
import { CiCircleTwoTone } from "@ant-design/icons";
import MobiParser from "../../utils/bookParser/MobiParser";

const MobiRenderer = ({ 
  book, 
  settings, 
  handlers, 
  eventHandlers, 
  uiState, 
  readerState,
  viewerRef 
}) => {
  // Local state
  const [currentChapter, setCurrentChapter] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const bookRef = useRef(null);
  const mobiParser = new MobiParser();

  useEffect(() => {
    const initBook = async () => {
      try {
        if (!book) return;

        debugger;
        // Parse the MOBI file (assuming the `mobi` library is used to convert to HTML)
        bookRef.current = await mobiParser.parse(book);

        // Render the parsed MOBI content
        renderMobiContent();

        // Notify parent about rendition (if needed)
        eventHandlers.onRenditionReady(bookRef.current);

        // Load and set TOC (If your MOBI file contains TOC metadata)
        const navigation = await getMobiNavigation(book);
        eventHandlers.onTocChange(navigation);

        // Restore reading progress
        const savedCfi = localStorage.getItem(`book-progress-${book.name}`);
        if (savedCfi) {
          jumpToSavedLocation(savedCfi);
        }

        // Apply theme settings
        applyThemeSettings();

        // Set up location change listener (if your MOBI reader supports this)
        bookRef.current.on("locationChanged", handleLocationChange);

      } catch (error) {
        console.error("Error initializing MOBI book:", error);
        throw new Error("加载MOBI书籍失败，请重试");
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
    if (bookRef.current) {
      applyThemeSettings();
    }
  }, [settings.fontSize, settings.fontFamily, settings.theme]);

  const renderMobiContent = () => {
    // Assuming the parsed MOBI content can be inserted into the viewer
    const content = bookRef.current.render();
    viewerRef.current.innerHTML = content;  // Inject the content directly
  };

  const applyThemeSettings = () => {
    // Assuming you can apply styles directly to MOBI content
    if (viewerRef.current) {
      viewerRef.current.style.fontSize = `${settings.fontSize}px`;
      viewerRef.current.style.fontFamily = settings.fontFamily;
      viewerRef.current.style.backgroundColor = settings.theme === "light" ? "#fff" : "#1f1f1f";
      viewerRef.current.style.color = settings.theme === "light" ? "#000" : "#fff";
    }
  };

  const handleLocationChange = (location) => {
    // Save progress
    localStorage.setItem(`book-progress-${book.name}`, location.start.cfi);

    // Update current chapter
    setCurrentChapter(location.href);

    // Notify parent
    eventHandlers.onLocationChange(location);
  };

  const jumpToSavedLocation = (cfi) => {
    // Logic to jump to saved location in MOBI file (specific to your reader library)
    bookRef.current.jumpToLocation(cfi);
  };

  const getMobiNavigation = async (book) => {
    // Extract Table of Contents from the MOBI file (adjust as per your library's capabilities)
    return bookRef.current.getTOC();
  };

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

    const handleItemClick = (e) => {
      e.stopPropagation();

      if (hasSubItems) {
        setExpandedItems((prev) => ({
          ...prev,
          [itemKey]: !isExpanded,
        }));
      } else {
        handlers.handleTocSelect(item.href);
      }
    };

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
          }}
          onClick={handleItemClick}
        >
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
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }}>
        {/* Rendered MOBI content */}
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

export default MobiRenderer;
