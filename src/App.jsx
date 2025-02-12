import React, { useState } from "react";
import { Layout, Drawer, Select } from "antd";
import { AppstoreTwoTone, UploadOutlined, ProfileTwoTone } from "@ant-design/icons";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { MenuProvider } from "./contexts/MenuContext";

import './App.css'

const { Header, Content } = Layout;
const { Option } = Select;

const App = () => {
  const [theme, setTheme] = useState("light");
  const [bookfile, setBookfile] = useState(null);
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);

  const themes = {
    light: { name: "日间模式", color: "#ffffff", text: "#333" },
    dark: { name: "夜间模式", color: "#121212", text: "#fff" },
    fantasy: { name: "梦幻模式", color: "linear-gradient(135deg, #ff9a8b, #ff6a88, #ff99ac)", text: "#fff" },
    cyberpunk: { name: "霓虹模式", color: "linear-gradient(135deg, #ff00ff, #8a2be2, #0000ff)", text: "#fff" },
  };

  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle);//false格子， true列表
  }
  const handleThemeChange = (value) => {
    setTheme(value);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setBookfile(file);
    e.target.value = "";
  };

  const handleBookParsed = () => {
    setBookfile(null);
  };
  const handleHideSiderBar = (value) => {
    setHeaderOpen(!value);
    setSiderBarHidden(value);
  }

  return (
    <Layout style={{ minHeight: "100vh", background: themes[theme].color }}>
      {headerOpen && (
        <Header className="app-header">
          <h1>Bookcase 📚</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div>
              <input
                type="file"
                accept=".epub, .pdf"
                style={{ display: "none" }}
                id="book-upload"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="book-upload"
                style={{
                  cursor: "pointer",
                  borderRadius: "20px",
                  color: "black",
                  fontWeight: "bold",
                  display: "inline-block",
                  lineHeight: '30px',
                  boxShadow: "0 0 10px rgba(0,126,179,0.6)",
                  transition: "all 0.3s ease-in-out",
                }}
              >
                <UploadOutlined /> 导入
              </label>
            </div>

            <div className="theme-selector">
              <Select
                defaultValue="light"
                style={{
                  width: 130,
                  background: themes[theme].color,
                  color: themes[theme].text,
                }}
                onChange={handleThemeChange}
              >
                {Object.keys(themes).map((key) => (
                  <Option key={key} value={key}>
                    {themes[key].name}
                  </Option>
                ))}
              </Select>
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
          <SideBar theme={theme} hidden={siderBarHidden} />
          <Content>
            <ContentView
              bookfile={bookfile}
              theme={theme} 
              bookshelfSettings={{handleBookParsed, handleHideSiderBar, bookshelfStyle}}
            />
          </Content>
        </MenuProvider>
      </Layout>

    </Layout>
  );
};

export default App;
