import { useState, useEffect } from "react";
import { CiCircleTwoTone } from "@ant-design/icons";

export const getItemKey = (item, parentPath = "") => {
  return `${parentPath}-${item.id || item.label}`;
};

const expandParentItems = (items, href, parentPath = "", expanded = {}) => {
  for (const item of items) {
    const itemKey = getItemKey(item, parentPath);

    if (item.href === href || item.href.includes(href)) {
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

const MenuTocItem = ({
  readerTheme,
  item,
  level = 0,
  tocSelectHandler,
  currentChapter,
  parentPath = "",
  allTocItems,
}) => {
  const [expandedItems, setExpandedItems] = useState({});

  const itemKey = getItemKey(item, parentPath);
  const hasSubItems = item.subitems?.length > 0;
  const isExpanded = expandedItems[itemKey] || false;
  const isCurrentChapter = item.href === currentChapter || item.href?.includes(currentChapter);

  // 监听 currentChapter 变化，自动展开父目录
  useEffect(() => {
    if (currentChapter) {
      const newExpandedItems = {};
      expandParentItems(allTocItems, currentChapter, "", newExpandedItems);
      setExpandedItems(newExpandedItems);
    }
  }, [currentChapter, allTocItems]);

  const handleItemClick = (e) => {
    e.stopPropagation();
    if (hasSubItems) {
      setExpandedItems((prev) => ({
        ...prev,
        [itemKey]: !isExpanded,
      }));
    } else {
      tocSelectHandler(item);
    }
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
            ? readerTheme === "light"
              ? "#e6f4ff"
              : "#111d2c"
            : "transparent",
          ":hover": {
            background: readerTheme === "light" ? "#f5f5f5" : "#262626",
          },
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
          >
            <CiCircleTwoTone onClick={(e) => e.stopPropagation()} />
          </span>
        )}

        <span
          style={{
            flex: 1,
            color: isCurrentChapter
              ? readerTheme === "light"
                ? "#1890ff"
                : "#40a9ff"
              : readerTheme === "light"
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
            <MenuTocItem
              key={index}
              readerTheme={readerTheme}
              item={subitem}
              tocSelectHandler={tocSelectHandler}
              currentChapter={currentChapter}
              level={level + 1}
              parentPath={itemKey}
              allTocItems={allTocItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default MenuTocItem;