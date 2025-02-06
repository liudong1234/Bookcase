import React, { useState, useContext } from "react";
import { Menu, Layout } from "antd";
import { BookTwoTone, HeartTwoTone, HighlightTwoTone   } from "@ant-design/icons";

import Bookshelf from "./BookShelf";
import { MenuContext } from "../contexts/MenuContext";

const { Sider } = Layout;

const SideBar = ({ theme, book, coverUrl }) => {
  const [collapsed, setCollapsed] = useState(false);

  const { setSelectedMenu } = useContext(MenuContext);

  const handleMenuClick = (key) => {
    setSelectedMenu(key.key);
  }

  return (
    <>
    <Sider theme="light" trigger={null} collapsible collapsed={collapsed}>

      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        onClick={handleMenuClick}
        items={[
          {
            key: "1",
            icon: <BookTwoTone twoToneColor="blue" />,
            label: "书架",
          },
          {
            key: "2",
            icon: <HeartTwoTone twoToneColor="#eb2f96" />,
            label: "收藏",
          },
          {
            key: "3",
            icon: <HighlightTwoTone />,
            label: "笔记",
          },
        ]}
      />

    </Sider>
    </>
  );
};

export default SideBar;
