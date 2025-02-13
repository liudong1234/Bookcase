import { useState, useEffect } from 'react';
import { Card, message, Avatar, List, Button } from 'antd';
import Epub from 'epubjs';
const { Meta } = Card;
import { ParserFactory } from '../utils/bookParser/ParserFactory';
import BookReader from './BookReader';
import './Bookshelf.css'

// IndexedDB 配置
const DB_NAME = 'BookshelfDB';
const DB_VERSION = 1;
const STORE_NAMES = {
  BOOKS: 'books',
  COVERS: 'covers'
};

// 初始化 IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.BOOKS)) {
        db.createObjectStore(STORE_NAMES.BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.COVERS)) {
        db.createObjectStore(STORE_NAMES.COVERS, { keyPath: 'bookId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// IndexedDB 操作方法
const dbOperations = {
  // 获取所有书籍
  getAllBooks: async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.BOOKS, 'readonly');
      const store = transaction.objectStore(STORE_NAMES.BOOKS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 保存书籍
  saveBook: async (book) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.BOOKS, 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.BOOKS);
      const request = store.put(book);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 删除书籍
  deleteBook: async (bookId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.BOOKS, 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.BOOKS);
      const request = store.delete(bookId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  //删除封面
  deleteCover: async (bookId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.COVERS, 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.COVERS);
      const request = store.delete(bookId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  // 保存封面
  saveCover: async (bookId, coverBlob) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.COVERS, 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.COVERS);
      const request = store.put({ bookId, coverBlob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取封面
  getCover: async (bookId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAMES.COVERS, 'readonly');
      const store = transaction.objectStore(STORE_NAMES.COVERS);
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result?.coverBlob);
      request.onerror = () => reject(request.error);
    });
  }
};

const Bookshelf = ({ bookfile, theme, bookshelfSettings }) => {
  const { handleBookParsed, handleHideSiderBar, bookshelfStyle } = bookshelfSettings;

  const [currentBook, setCurrentBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookCovers, setBookCovers] = useState({});
  const [hoveredBookId, setHoveredBookId] = useState(null); // 新增：记录当前悬浮的书籍 ID
  // 初始化加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const booksFromDB = await dbOperations.getAllBooks();
        const covers = {};
        for (const book of booksFromDB) {
          const coverBlob = await dbOperations.getCover(book.id);
          if (coverBlob) {
            covers[book.id] = URL.createObjectURL(coverBlob);
          }
        }
        setBooks(booksFromDB);
        setBookCovers(covers);
      } catch (error) {
        message.error('加载书架数据失败');
      }
    };
    loadData();
  }, []);

  // 处理新书上传
  useEffect(() => {
    const handleNewBook = async () => {
      if (!bookfile) return;

      try {
        // 检查文件类型是否支持
        if (!ParserFactory.isSupported(bookfile)) {
          message.error('不支持的文件类型');
          return;
        }

        // 检查书籍是否已存在
        const isBookExists = books.some(b =>
          b.name === bookfile.name &&
          b.size === bookfile.size
        );

        if (isBookExists) {
          message.info('书籍已存在');
          return;
        }

        // 生成书籍唯一ID
        const bookId = Date.now().toString();
        const parser = ParserFactory.getParser(bookfile.type, bookfile.name);

        // 获取书籍元数据
        const metadata = await parser.getMetadata(bookfile);
        // 获取并存储封面
        const coverBlob = await parser.getCover(bookfile);
        console.log("metadata", coverBlob);
        if (coverBlob) {
          await dbOperations.saveCover(bookId, coverBlob);
          setBookCovers(prev => ({
            ...prev,
            [bookId]: URL.createObjectURL(coverBlob)
          }));
        }

        // 存储书籍数据
        const bookData = {
          id: bookId,
          name: bookfile.name,
          size: bookfile.size,
          type: bookfile.type,
          lastModified: bookfile.lastModified,
          metadata,
          file: bookfile
        };

        await dbOperations.saveBook(bookData);
        setBooks(prev => [...prev, bookData]);
        message.success('书籍添加成功！');
      } catch (error) {
        message.error('书籍添加失败');
      } finally {
        handleBookParsed?.();
      }
    };

    handleNewBook();
  }, [bookfile]);

  // 删除书籍
  const handleDeleteBook = async (bookId) => {
    try {
      await dbOperations.deleteBook(bookId);
      await dbOperations.deleteCover(bookId);
      console.log(bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
      setBookCovers(prev => {
        const newCovers = { ...prev };
        delete newCovers[bookId];
        return newCovers;
      });
      message.success('书籍已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };
  
  // 渲染书架
  return (
    <div>
      {currentBook ? (
        <BookReader
          book={currentBook.file}
          onClose={() => { setCurrentBook(null); handleHideSiderBar(false); }}
        />
      ) : (
        <div className="bookshelf-container">
          {books.length === 0 ? (
            <p>暂无书籍</p>
          ) : (
            <div>
              {
                bookshelfStyle && (
                  <div className="book-grid">
                    {books.map(book => (
                      <div
                        key={book.id}
                        className="book-card"
                        onMouseEnter={() => setHoveredBookId(book.id)} // 悬浮时设置 hoveredBookId
                        onMouseLeave={() => setHoveredBookId(null)} // 离开时清除 hoveredBookId
                      >
                        <Card
                          hoverable
                          cover={
                            <div className="cover-container">
                              <img alt="封面" src={bookCovers[book.id]} />
                              {hoveredBookId === book.id && ( // 悬浮时显示操作按钮
                                <div className="cover-overlay">
                                  <button onClick={() => { setCurrentBook(book); handleHideSiderBar(true); }}>阅读</button>
                                  <button onClick={() => handleDeleteBook(book.id)}>删除</button>
                                </div>
                              )}
                            </div>
                          }
                        >
                          <Meta
                            title={book.name}
                            description={`${book.type.toUpperCase()} · ${formatFileSize(book.size)}`}
                          />
                        </Card>
                      </div>
                    ))}
                  </div>
                )
              }
              {
                !bookshelfStyle && (
                  <List
                    className='bookshelf-booklist'
                    itemLayout="horizontal"
                    dataSource={books}
                    renderItem={(item, index) => (
                      <List.Item onClick={() => {setCurrentBook(item); handleHideSiderBar(true);}} 
                        actions={[<Button onClick={(event) => { event.stopPropagation(); handleDeleteBook(item.id)}}>删除书籍</Button>]}>
                        <List.Item.Meta
                          avatar={<Avatar src={bookCovers[item.id]} />}
                          title={item.name}
                          description={`${item.type.toUpperCase()} · ${formatFileSize(item.size)}`}
                        />
                      </List.Item>
                    )}
                  />
                )
              }

            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 辅助函数：格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default Bookshelf;