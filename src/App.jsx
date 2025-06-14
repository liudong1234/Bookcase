import React, { useEffect, useState, Suspense } from "react";
import { Layout, message, Spin, Switch, ConfigProvider } from "antd";
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

import ThemeSwitcher from "./components/ThemeSwitcher";
import { bookOperations } from "./services/BookOperations";
import Settings from "./components/Settings";
import { pluginManager } from "./plugins/PluginManager";
import { ThemeProvider } from "./contexts/ThemeContext";
import FileTransfer from "./components/FileTransfer";

import "./App.css";
const LazyBookReader = React.lazy(() => import("./components/BookReader"));

const App = () => {
  // ui控制
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [result, setResult] = useState(false);
  const [bgUrl, setBgUrl] = useState("");
  // const { theme, updateColor } = useTheme();
  //书籍信息
  const [books, setBooks] = useState([]);
  const [bookCovers, setBookCovers] = useState({});

  const [selectedMenu, setSelectedMenu] = useState("1");
  const [selectedBook, setSelectedBook] = useState();

  const loadData = async () => {
    try {
      // debugger;
      const booksFromDB = await bookOperations.getAllBooks();

      let covers = {};
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
          covers[book.id] = {
            name: book.name,
            url: URL.createObjectURL(blob),
            fav: booksFromDB.find(b => b.id == book.id).fav
          };
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

  useEffect(() => {
    if (selectedBook) {
      setSiderBarHidden(true);
    }else {
      setSiderBarHidden(false);
    }
  }, [selectedBook])
  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle); //false格子， true列表
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
  const handleCollectBook = async (bookId, newFav) => {
    try {
      updateBookCovers(bookId, newFav);
      bookOperations.collectBook(bookId, newFav);
    }catch (error) {
      message.error(error);
    }
  }
  const handleResult = () => {
    setResult(!result);
  };
  const handleSelectedMenu = (value) => {
    setSelectedMenu(value.key);
  };
  const handleSelectedBook = (book) => {
    setSelectedBook(book);
  };

  const updateBookCovers = (bookId, newFav) => {
    setBookCovers(prev => ({
      ...prev,                // 复制其他书籍数据
      [bookId]: {             // 更新目标书籍的 fav
        ...prev[bookId],      // 保留原有 url 等属性
        fav: newFav
      }
    }));
  }

  return (
    <ThemeProvider>
      <Layout
        className="background-layer"
        style={{ "--dynamic-bg-url": `url(${bgUrl})` }}
      >
        {!siderBarHidden && (
          <Header className="app-header">
            <h1>Bookcase📚</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div>
                <FileTransfer />
              </div>
              <div>
                <CustomUpload books={books} onResult={handleResult} />
              </div>
              <ThemeSwitcher />
              <Settings
                data={{ bgUrl: bgUrl }}
                onUpdate={{ setBgUrl: setBgUrl }}
              />
            </div>
          </Header>
        )}
        {!siderBarHidden && (
          <Layout>
            <SideBar menuNum={selectedMenu} handleSelectedMenu={handleSelectedMenu} />
            <ContentView
              books={books}
              bookCovers={bookCovers}
              bookshelfSettings={{
                setBooks,
                handleDeleteBook,
                handleSelectedBook,
                handleCollectBook,
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
              }}
            />
          </Suspense>
        )}
      </Layout>
    </ThemeProvider>
  );
};

export default App;
