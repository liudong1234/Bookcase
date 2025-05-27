import { useState } from 'react';
import { Card, Avatar, List, Button, Empty } from 'antd';
import { StarFilled } from '@ant-design/icons';
const { Meta } = Card;
import './Bookshelf.css';
import { Content } from 'antd/es/layout/layout';
import { loadFile } from '../utils/Tool';
const Bookshelf = ({ books, bookCovers, bookshelfSettings }) => {
  const { handleDeleteBook, handleSelectedBook,handleCollectBook, bookshelfStyle } = bookshelfSettings;

  const [hoveredBookId, setHoveredBookId] = useState(null); // 新增：记录当前悬浮的书籍 ID
  const handleClickBook = async (book) => {
    const content = await loadFile(book);
    handleSelectedBook(content);
  }

  // 渲染书架
  return (
    <Content className="bookshelf-container">
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
                          <img alt="封面" src={bookCovers[book.id]['url']} />
                          {hoveredBookId === book.id && ( // 悬浮时显示操作按钮
                            <div className="cover-overlay">
                              <button onClick={() => { handleClickBook(book); }}>阅读</button>
                              <button onClick={() => handleDeleteBook(book.id)}>删除</button>
                              <button onClick={(event) => { event.stopPropagation(); console.log(book.fav); handleCollectBook(book.id, !bookCovers[item.id]['fav']); }}>收藏</button>
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
                  <List.Item onClick={() => { handleClickBook(item); }}
                    actions={[
                      <Button onClick={(event) => { event.stopPropagation(); handleDeleteBook(item.id) }}>删除书籍</Button>,
                      <span style={{ fontSize: "20px" }}>
                        <StarFilled style={{color: bookCovers[item.id]['fav'] ? 'red' : undefined}} onClick={(event) => { 
                          event.stopPropagation(); 
                          handleCollectBook(item.id, !bookCovers[item.id]['fav']);
                          }} />
                      </span>
                    ]}>
                    <List.Item.Meta
                      avatar={<Avatar src={bookCovers[item.id]['url']} />}
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