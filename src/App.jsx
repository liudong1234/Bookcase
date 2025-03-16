import React, { useEffect, useState, Suspense } from "react";
import { Layout, message, Spin, Switch, ConfigProvider } from "antd";
import antdTheme from "antd/es/theme";
import { Dropdown, Space } from "antd";
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
import "./App.css";
const LazyBookReader = React.lazy(() => import("./components/BookReader"));

const items = [
  {
    key: "1",
    label: <a>文件存储位置</a>,
  },
  {
    key: "2",
    label: <a>说明</a>,
    icon: <SettingTwoTone />,
  },
  {
    key: "3",
    label: <a>关于</a>,
  },
  {
    key: "4",
    danger: true,
    label: "清除所有数据",
  },
];

const App = () => {
  // ui控制
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [result, setResult] = useState(false);
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
  return (
    <ConfigProvider
      theme={{ 
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        components: {
          Layout: {
            headerBg: isDark ? '#000000': '#efefef',
          }
        }
      }}
      
    >
      <Layout>
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
              <div className="settings">
                <Dropdown
                  menu={{
                    items,
                  }}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    <Space>
                      <SettingTwoTone />
                    </Space>
                  </a>
                </Dropdown>
              </div>
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
            />
          </Suspense>
        )}
      </Layout>
    </ConfigProvider>
  );
};

export default App;
