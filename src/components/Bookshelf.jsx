import React, { useState, Suspense } from 'react';
import { Card, Avatar, List, Button, Empty, Spin } from 'antd';
import { StarTwoTone } from '@ant-design/icons';
const { Meta } = Card;

import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";
// import BookReader from './BookReader';
import { getMimeType } from '../utils/FileDetector';

import './Bookshelf.css';
import { Content } from 'antd/es/layout/layout';
const LazyBookReader = React.lazy(() => import('./BookReader'));

const Bookshelf = ({ books, bookCovers, bookshelfSettings }) => {
  const { handleHideSiderBar, handleDeleteBook, bookshelfStyle } = bookshelfSettings;
  
  const [currentBook, setCurrentBook] = useState(null);
  const [hoveredBookId, setHoveredBookId] = useState(null); // 新增：记录当前悬浮的书籍 ID
  const handleClickBook = async (book) => {
    try {
      const filePath = 'data\\' + book.id + '\\' + book.name;
      const fileBytes = await readFile(filePath, { baseDir: BaseDirectory.AppData });

      // 从路径中提取文件名
      const filename = filePath.split(/[/\\]/).pop();

      // 创建 Blob 对象
      const blob = new Blob([new Uint8Array(fileBytes)], {
        type: getMimeType(filename) // 根据文件扩展名获取 MIME 类型
      });

      // 创建 File 对象
        setCurrentBook(new File([blob], filename, { type: blob.type }));
    } catch (error) {
      console.error('转换文件失败:', error);
      throw error;
    }
  }

  // 渲染书架
  return (
    <Content>
      {currentBook ? (
        <Suspense fallback={<Spin
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
          size="large" />}>
          <LazyBookReader 
            book={currentBook}
            onClose={() => { setCurrentBook(null); handleHideSiderBar(false);}}
          />
        </Suspense>
      ) : (
        <div className="bookshelf-container">
          {books === undefined || books.length === 0 ? (
            <Empty description={'暂无书籍'}></Empty>
          ) : (
            <>
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
                                  <button onClick={() => { handleClickBook(book); handleHideSiderBar(true); }}>阅读</button>
                                  <button onClick={() => handleDeleteBook(book.id)}>删除</button>
                                  <button onClick={(event) => { event.stopPropagation();  }}>收藏</button>
                                </div>
                              )}
                            </div>
                          }
                        >
                          <Meta
                            title={book.name}
                            description={`${book.file_type.toUpperCase()} · ${formatFileSize(book.size)}`}
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
                      <List.Item onClick={() => { handleClickBook(item); handleHideSiderBar(true); }}
                        actions={[
                        <Button onClick={(event) => { event.stopPropagation(); handleDeleteBook(item.id) }}>删除书籍</Button>,
                        <span style={{fontSize: "20px"}}><StarTwoTone onClick={(event) => { event.stopPropagation(); }}/></span>
                        ]}>
                        <List.Item.Meta
                          avatar={<Avatar src={bookCovers[item.id]} />}
                          title={item.name}
                          description={`${item.file_type.toUpperCase()} · ${formatFileSize(item.size)}`}
                        />
                      </List.Item>
                    )}
                  />
                )
              }

            </>
          )}
        </div>
      )}
    </Content>
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