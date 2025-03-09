import React, { useEffect, useState } from "react";
import { Layout, message } from "antd";
import { AppstoreTwoTone, ProfileTwoTone } from "@ant-design/icons";

import CustomUpload from "./components/CustomUpload";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { bookOperations } from "./services/BookOperations";

import "./App.css";

const { Header, Content, Footer } = Layout;


const App = () => {
  // const [bookfile, setBookfile] = useState(null);
  // ui控制
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [result, setResult] = useState(false);
  //书籍信息
  const [books, setBooks] = useState([]);
  const [bookCovers, setBookCovers] = useState({});

  const [selectedMenu, setSelectedMenu] = useState("1");

  const loadData = async () => {
    try {
      // debugger;
      const booksFromDB = await bookOperations.getAllBooks();

      const covers = {};
      for (const book of booksFromDB) {
        const coverName = await bookOperations.getCover(book.id);
        if (coverName !== '' && coverName !== null) {
          // 类型中提取后缀
          const suffix = coverName.split(/[/\\]/).pop();
          const filePath = 'data\\' + book.id + '\\' + book.id + '.' + suffix;
          const fileBytes = await readFile(filePath, { baseDir: BaseDirectory.AppData });


          // 创建 Blob 对象
          const blob = new Blob([new Uint8Array(fileBytes)], {
            type: coverName // 根据文件扩展名获取 MIME 类型
          });
          covers[book.id] = URL.createObjectURL(blob);
        }
      }
      setBooks(booksFromDB);
      setBookCovers(covers);
    } catch (error) {
      message.error('加载书架数据失败或者数据库我为空')
    }
  };
  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [result]);

  //
  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle); //false格子， true列表
  };
  const handleHideSiderBar = (value) => {
    setHeaderOpen(!value);
    setSiderBarHidden(value);
  };
  const handleDeleteBook = async (bookId) => {
    try {
      setBooks(prev => prev.filter(b => b.id !== bookId));
      setBookCovers(prev => {
        const newCovers = { ...prev };
        delete newCovers[bookId];
        return newCovers;
      });
      message.success('书籍已删除');
      await bookOperations.deleteBook(bookId); //删除书籍的同时删除封面
    } catch (error) {
      message.error(error);
    }
  }
  const handleResult = () => {
    setResult(!result);
  }
  const handleSelectedMenu = (value) => {
    setSelectedMenu(value.key);
  }

  return (
    <Layout>
        {headerOpen && (
          <Header className="app-header">
            <h1>Bookcase 📚</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div>
                <CustomUpload books={books} onResult={handleResult} />
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
      <SideBar handleSelectedMenu={handleSelectedMenu} hidden={siderBarHidden} />
          <ContentView
            books={books}
            bookCovers={bookCovers}
            bookshelfSettings={{
              handleHideSiderBar,
              handleDeleteBook,
              bookshelfStyle,
            }}
            selectedMenu={selectedMenu}
          />
      </Layout>
        <Footer className="app-footer">
          lafjlaewjfawl
        </Footer>

    </Layout>
  );
};

export default App;
