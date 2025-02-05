import React, { useState, useEffect } from "react";
import { Menu, Layout } from "antd";
import { BookTwoTone, HeartTwoTone, HighlightTwoTone   } from "@ant-design/icons";

import Bookshelf from "./BookShelf";


const { Sider, Content } = Layout;

const SideView = ({ theme, book }) => {
  const [collapsed, setCollapsed] = useState(false);

  const [currentView, setCurrentView] = useState('1');

  const handleMenuClick = (key) => {
    setCurrentView(key);
  }

  const renderContent =() => {
    switch (currentView) {
      case '1':
        return <Bookshelf books={book} />;
      case '2':
        return <></>;
      case '3':
        return <></>;
      default:
        return <Bookshelf books={book} />;
    }
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
    <Content>
      {renderContent()}
    </Content>
    </>
  );
};

export default SideView;
