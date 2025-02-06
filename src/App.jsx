import React, { useState, useCallback } from "react";
import { Layout, Switch, Typography, Flex } from "antd";
import Epub from 'epubjs';

import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import "./App.css";

import { UploadOutlined } from "@ant-design/icons";
import { MenuProvider } from "./contexts/MenuContext";
const { Header, Content } = Layout;
const { Title } = Typography;

const boxStyle = {
  width: '100%',
  height: 64,
};

const App = () => {
  const [theme, setTheme] = useState("light");
  const [book, setBook] = useState([]);
  const [coverUrl, setCoverUrl] = useState("")

  const toggleTheme = (checked) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const book = new Epub(file);
    await book.ready;
    // 获取封面URL
    const cover = await book.coverUrl();
    if (cover) {
      setCoverUrl(cover);
    } else {
      throw new Error('This epub does not contain a cover image');
    }
    
    if (file) {
      setBook(prev => Array.isArray(prev) ? [...prev, file] : [file]);
    }
  };

  return (
    <Layout>
      <Header
        className="app-header"
        style={{
          backgroundColor: "lightgrey",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Title
          level={3}
          className="logo"
        >
          Bookcase
        </Title>
        <Flex gap="large" align="start" vertical>
          <Flex gap={50} style={{fontSize:"16px"}} justify="space-between" align="center">
            <div>
              <input
                type="file"
                accept=".epub"
                style={{ display: "none" }}
                id="book-upload"
                onChange={handleFileUpload}
              />
              <div>
                <label htmlFor="book-upload">
                  <UploadOutlined /> 导入
                </label>
              </div>
            </div>
            <div className="theme-toggle">
              <span>
                {theme === "light" ? "日间模式" : "夜间模式"}
              </span>
              <Switch
                checked={theme === "dark"}
                onChange={toggleTheme}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
              />
            </div>
          </Flex>

        </Flex>
      </Header>
      <Layout>
        <MenuProvider>
          <SideBar
            theme={theme}
          ></SideBar>
          <Content>
            <ContentView books={book} coverUrl={coverUrl} ></ContentView>
          </Content>
        </MenuProvider>
      </Layout>
    </Layout>
  );
};


const props = {
  name: 'file',
  headers: {
    authorization: 'authorization-text',
  },
  onChange(info) {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
};

export default App;
