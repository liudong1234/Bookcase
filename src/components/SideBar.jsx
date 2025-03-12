import React, { useState, useContext } from "react";
import { Menu, Layout, Col, Button, Row } from "antd";
import {
  BookTwoTone,
  HeartTwoTone,
  HighlightTwoTone,
  LeftCircleOutlined,
  RightCircleOutlined
} from "@ant-design/icons";

const { Sider } = Layout;

const SideBar = ({ handleSelectedMenu }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <Sider
        collapsed={collapsed}
        theme="light"
        style={{
          display: "flex",
        }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          onClick={handleSelectedMenu}
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
          style={{
            width: collapsed ? 80 : 200, // 动态调整宽度
            transition: "width 0.2s", // 添加过渡效果
            flex: "none", // 防止 flex 影响宽度
          }}
        />
        <Button
          onClick={toggleCollapsed}
          style={{
            position: "absolute", // 绝对定位
            right: -20, // 放置在右侧
            top: "50%", // 垂直居中
            transform: "translateY(-50%)", // 调整垂直居中
            zIndex: 1, // 确保 Button 在 Menu 上方
            border: "none",
            backgroundColor: '#FFFFFF00'
          }}
        >
          {collapsed ? <RightCircleOutlined /> : <LeftCircleOutlined />}
        </Button>
      </Sider>
    </>
  );
};

export default SideBar;
