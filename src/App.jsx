import React, { useState } from "react";
import { Layout, Select, Button, Upload } from "antd";
import { AppstoreTwoTone, UploadOutlined, ProfileTwoTone } from "@ant-design/icons";

import { invoke } from "@tauri-apps/api/core";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { MenuProvider } from "./contexts/MenuContext";


import './App.css'

const { Header, Content } = Layout;

const App = () => {
  const [bookfile, setBookfile] = useState(null);
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);

  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle);//false格子， true列表
  }

  const handleFileUpload = async (e) => {
    const file = e.file.originFileObj;

    if (!file) return;
    invoke('process_file', {fileContent: "hello world", fileName: "at.txt"});
    setBookfile(file);
  };

  const handleBookParsed = () => {
    setBookfile(null);
  };
  const handleHideSiderBar = (value) => {
    setHeaderOpen(!value);
    setSiderBarHidden(value);
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {headerOpen && (
        <Header className="app-header">
          <h1>Bookcase 📚</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div>
              <Upload 
                type="file"
                accept=".epub, .pdf, .md, .txt"
                onChange={handleFileUpload}
                action={'http://localhost:5173/'}
              >
                <Button icon={<UploadOutlined />}>导入</Button>
              </Upload>
            </div>
            <div>
              <span className="settting-span" onClick={() => changeBookshelfStyle()}>
                {
                  bookshelfStyle && (<AppstoreTwoTone />)
                }
                {
                  !bookshelfStyle && (<ProfileTwoTone />)
                }
              </span>
            </div>
          </div>
        </Header>
      )
      }

      <Layout>
        <MenuProvider>
          <SideBar hidden={siderBarHidden} />
          <Content>
            <ContentView
              bookfile={bookfile}
              bookshelfSettings={{ handleBookParsed, handleHideSiderBar, bookshelfStyle }}
            />
          </Content>
        </MenuProvider>
      </Layout>

    </Layout>
  );
};

export default App;
