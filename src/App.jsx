import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { AppstoreTwoTone, ProfileTwoTone } from "@ant-design/icons";

import CustomUpload from "./components/CustomUpload";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { MenuProvider } from "./contexts/MenuContext";

import "./App.css";

const { Header, Content } = Layout;

const App = () => {
  const [bookfile, setBookfile] = useState(null);
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [savePath, setSavePath] = useState("");
  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle); //false格子， true列表
  };
  useEffect(() => {
    console.log(savePath);
    setBookfile(savePath);
  }, [savePath])
  const handleSetSavePath = (path) => {
    setSavePath(path);
  };

  const handleBookParsed = () => {
    setBookfile(null);
  };
  const handleHideSiderBar = (value) => {
    setHeaderOpen(!value);
    setSiderBarHidden(value);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {headerOpen && (
        <Header className="app-header">
          <h1>Bookcase 📚</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div>
              <CustomUpload handleSetSavePath={handleSetSavePath} />
            </div>
            <div>
              <span
                className="settting-span"
                onClick={() => changeBookshelfStyle()}
              >
                {bookshelfStyle && <AppstoreTwoTone />}
                {!bookshelfStyle && <ProfileTwoTone />}
              </span>
            </div>
          </div>
        </Header>
      )}

      <Layout>
        <MenuProvider>
          <SideBar hidden={siderBarHidden} />
          <Content>
            <ContentView
              bookfile={bookfile}
              bookshelfSettings={{
                handleBookParsed,
                handleHideSiderBar,
                bookshelfStyle,
              }}
            />
          </Content>
        </MenuProvider>
      </Layout>
    </Layout>
  );
};

export default App;
