import React, { useEffect, useState, Suspense } from "react";
import { Layout, message, Spin, Switch, ConfigProvider } from "antd";
import antdTheme from "antd/es/theme";

import {
  AppstoreTwoTone,
  ProfileTwoTone,
  SunFilled,
  MoonFilled,
  SettingTwoTone,
} from "@ant-design/icons";
import CustomUpload from "./components/CustomUpload";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";
const { Header, Footer } = Layout;

import { bookOperations } from "./services/BookOperations";
import Settings from "./components/Settings";
import { pluginManager } from "./plugins/PluginManager";

import "./App.css";
const LazyBookReader = React.lazy(() => import("./components/BookReader"));

const App = () => {
  // ui控制
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [result, setResult] = useState(false);
  const [bgImage, setBgImage] = useState(false);
  const [bgUrl, setBgUrl] = useState('')
  //书籍信息
  const [books, setBooks] = useState([]);
  const [bookCovers, setBookCovers] = useState({});

  const [selectedMenu, setSelectedMenu] = useState("1");
  const [selectedBook, setSelectedBook] = useState();
  const [isDark, setIsDark] = useState(false);

  const loadData = async () => {
    try {
      // debugger;
      const booksFromDB = await bookOperations.getAllBooks();

      const covers = {};
      for (const book of booksFromDB) {
        const coverName = await bookOperations.getCover(book.id);
        if (coverName !== "" && coverName !== null) {
          // 类型中提取后缀
          const suffix = coverName.split(/[/\\]/).pop();
          const filePath = "data\\" + book.id + "\\" + book.id + "." + suffix;
          const fileBytes = await readFile(filePath, {
            baseDir: BaseDirectory.AppData,
          });

          // 创建 Blob 对象
          const blob = new Blob([new Uint8Array(fileBytes)], {
            type: coverName, // 根据文件扩展名获取 MIME 类型
          });
          covers[book.id] = URL.createObjectURL(blob);
        }
      }
      setBooks(booksFromDB);
      setBookCovers(covers);
    } catch (error) {
      message.error("加载书架数据失败或者数据库我为空");
    }
  };
  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [result]);

  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle); //false格子， true列表
  };
  const handleHideSiderBar = (value) => {
    setSiderBarHidden(value);
  };
  const handleDeleteBook = async (bookId) => {
    try {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setBookCovers((prev) => {
        const newCovers = { ...prev };
        delete newCovers[bookId];
        return newCovers;
      });
      message.success("书籍已删除");
      await bookOperations.deleteBook(bookId); //删除书籍的同时删除封面
    } catch (error) {
      message.error(error);
    }
  };
  const handleResult = () => {
    setResult(!result);
  };
  const handleSelectedMenu = (value) => {
    setSelectedMenu(value.key);
  };
  const handleSelectedBook = (book) => {
    setSelectedBook(book);
  };

  const handleCustomTheme = (value) => {
    setIsDark(value);
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          // ========= 颜色 =========
          colorPrimary: '#1890ff',    // 全局主色
          colorInfo: '#1890ff',       // Info 颜色
          colorSuccess: '#52c41a',   // 成功色
          colorWarning: '#faad14',    // 警告色
          colorError: '#ff4d4f',      // 错误色
          // colorText: 'blue',
          // ========= 字号 =========
          fontSize: 14,               // 基础字号
          fontSizeSM: 12,             // 小号文本（如辅助文字）
          fontSizeLG: 16,             // 大号文本（如标题）
          fontSizeXL: 20,             // 超大号文本

          // ========= 其他 =========
          borderRadius: 10,            // 组件圆角
        },
        components: {
          Layout: {
            headerBg: !bgImage ? (isDark ? '#000000' : '#efefef') : undefined,
            colorBgLayout: !bgImage ? (isDark ? '#000000' : '#f5f5f5') : undefined,
            siderBg: !bgImage ? (isDark ? '#000000' : '#efefef') : undefined,
            lightSiderBg: !bgImage ? (isDark ? '#000000' : '#ffffff') : undefined,
            footerBg: !bgImage ? (isDark ? '#000000' : '#f8f8f8') : undefined,
          },
          Menu: {
            itemBg: !bgImage ? (isDark ? '#000000' : '#ffffff') : undefined,
          },
        }
      }}

    >
      <Layout className="background-layer" style={{ '--dynamic-bg-url': `url(${bgUrl})` }}>
        {!siderBarHidden && (
          <Header className="app-header">
            <h1>Bookcase📚</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div>
                <CustomUpload books={books} onResult={handleResult} />
              </div>
              <div className="theme-toggle">
                <Switch
                  checked={isDark}
                  onChange={setIsDark}
                  checkedChildren={<SunFilled />}
                  unCheckedChildren={<MoonFilled />}
                />
              </div>
              <Settings
                data={{ bgImage: bgImage, bgUrl: bgUrl }}
                onUpdate={{ setBgImage: setBgImage, setBgUrl: setBgUrl }} />
            </div>
          </Header>
        )}
        {!siderBarHidden && (
          <Layout>
            <SideBar handleSelectedMenu={handleSelectedMenu} />
            <ContentView
              books={books}
              bookCovers={bookCovers}
              bookshelfSettings={{
                handleHideSiderBar,
                handleDeleteBook,
                handleSelectedBook,
                bookshelfStyle,
              }}
              selectedMenu={selectedMenu}
            />
          </Layout>
        )}
        {!siderBarHidden && (
          <Footer className="app-footer">
            <div>
              <span
                className="settting-span"
                onClick={() => changeBookshelfStyle()}
              >
                {bookshelfStyle && <AppstoreTwoTone />}
                {!bookshelfStyle && <ProfileTwoTone />}
              </span>
            </div>
          </Footer>
        )}
        {/* 阅读内容 */}
        {selectedBook && (
          <Suspense
            fallback={
              <Spin
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                size="large"
              />
            }
          >
            <LazyBookReader
              book={selectedBook}
              onClose={() => {
                setSelectedBook(null);
                setSiderBarHidden(false);
              }}
              customThemeHandler={handleCustomTheme}
            />
          </Suspense>
        )}
      </Layout>
    </ConfigProvider>
  );
};

export default App;
