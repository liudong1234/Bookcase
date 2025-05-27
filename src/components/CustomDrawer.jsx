import { Drawer } from "antd";
import { useTheme } from "../contexts/ThemeContext";

import MenuTocItem from "./Renderer/MenuTocItem";
import { getItemKey } from "./Renderer/MenuTocItem";
const CustomDrawer = ({toc, currentChapter, openToc, onClose, onSelect}) => {
  const { isDark } = useTheme();

  return (
    <Drawer
        title="目录"
        placement="left"
        open={openToc}
        onClose={onClose}
        width={300}
        styles={{
          background: isDark === "light" ? "#fff" : "#1f1f1f",
        }}
        className="my-toc-drawer"
      >
        <div
          className="toc-list"
          style={{
            height: "100%",
            overflow: "auto",
            // background: readerTheme === "light" ? "#fff" : "#1f1f1f",
          }}
        >
          {toc.map((item, index) => (
            <MenuTocItem
              key={getItemKey(item)}
              readerTheme={isDark}
              item={item}
              tocSelectHandler={onSelect}
              currentChapter={currentChapter} level={0}
              allTocItems={toc}
            />
          ))}
        </div>
      </Drawer>
  )

}

export default CustomDrawer;