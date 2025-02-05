import React, { useState, useCallback } from "react";
import { Layout, Switch, Typography, Upload } from "antd";
import BookReader from "./components/BookReader";
import SideView from "./components/SideView";
import "./App.css";

import { UploadOutlined } from "@ant-design/icons";
const { Header } = Layout;
const { Title } = Typography;

const App = () => {
  const [theme, setTheme] = useState("light");
  const [book, setBook] = useState([]);

  const toggleTheme = (checked) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) {
      setBook(prev => Array.isArray(prev) ? [...prev, file.name] : [file.name]);
    }
  };

  return (
    <Layout>
      <Header
        className="app-header"
        style={{
          backgroundColor: "blueviolet",
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
        <div style={{fontSize: '25px'}}>
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
          <span style={{ marginRight: 10, color: "white" }}>
            {theme === "light" ? "日间模式" : "夜间模式"}
          </span>
          <Switch
            checked={theme === "dark"}
            onChange={toggleTheme}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </div>
      </Header>
      <Layout>
        <SideView
          theme={theme}
          book={book}
        ></SideView>
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
