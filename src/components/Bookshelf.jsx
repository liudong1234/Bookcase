import { useState, useEffect } from 'react';
import { Card, Avatar, List, Button, Empty, Input } from 'antd';
import { StarFilled } from '@ant-design/icons';
const { Meta } = Card;
import './Bookshelf.css';
import { Content } from 'antd/es/layout/layout';
import { loadFile } from '../utils/Tool';
import OrderComponent from '../utils/components/OrderComponent';

const items = [
  {
    label: '标题',
    key: '0',
  },
  {
    label: '导入时间',
    key: '1',
  },
  {
    label: '最近阅读',
    key: '2',
  },
];


const Bookshelf = ({ books, bookCovers, bookshelfSettings }) => {
  const { setBooks, handleDeleteBook, handleSelectedBook, handleCollectBook, bookshelfStyle } = bookshelfSettings;

  const [shelfBooks, setShelfBooks] = useState(books);

  const [hoveredBookId, setHoveredBookId] = useState(null); // 新增：记录当前悬浮的书籍 ID
  const handleClickBook = async (book) => {
    const content = await loadFile(book);
    handleSelectedBook(content);
  }

  useEffect(() => {
    setShelfBooks(books);
  }, [books]);

  const onClick = ({ key }) => {
    let num = Number(key)
    switch (num) {
      case 0:
        const sortedBooks0 = [...shelfBooks].sort((a, b) => a.name.localeCompare(b.name));
        const sortedBooks1 = [...books].sort((a, b) => a.name.localeCompare(b.name));
        setShelfBooks(sortedBooks0);
        setBooks(sortedBooks1);
        setBooks
        console.log(shelfBooks);
        break;
      case 1:
        const sortedBooks2 = [...shelfBooks].sort((a, b) => a.last_modified - b.last_modified);
        const sortedBooks3 = [...books].sort((a, b) => a.last_modified - b.last_modified);
        setShelfBooks(sortedBooks2);
        setBooks(sortedBooks3);
        break;
      case 2:
        console.log("最近阅读");
      default:
        break;
    }
  };
  const srearchBook = (value, event) => {
    console.log(value);

    const filteredBooks = books.filter(book =>
      book.name.includes(value)
    );

    // 更新 shelfBooks 状态
    setShelfBooks(filteredBooks);
  }
  // 渲染书架
  return (
    <Content className="bookshelf-container">
      {shelfBooks === undefined || shelfBooks.length === 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft:"15px", paddingRight: "15px" }} >
            <div>
              <Input.Search
                placeholder="搜索"
                onSearch={srearchBook}
              />
            </div>
            <div>
              <OrderComponent items={items} onClick={onClick} />
            </div>
          </div>
          <Empty description={'暂无书籍'}></Empty>
        </>
      ) : (
        <>
          {
            bookshelfStyle && (
              <div className='bookshelf-bookgrid'>
                <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                  <div>
                    <Input.Search
                      placeholder="搜索"
                      onSearch={srearchBook}
                    />
                  </div>
                  <div>
                    <OrderComponent items={items} onClick={onClick} />
                  </div>
                </div>
                <div className="book-grid">
                  {shelfBooks.map(book => (
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
              </div>
            )
          }
          {
            !bookshelfStyle && (
              <List
                className='bookshelf-booklist'
                itemLayout="horizontal"
                header={
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                      <div>
                        <Input.Search
                          placeholder="搜索"
                          onSearch={srearchBook}
                        />
                      </div>
                      <div>
                        <OrderComponent items={items} onClick={onClick} />
                      </div>
                    </div>
                  </>
                }
                dataSource={shelfBooks}
                renderItem={(item, index) => (
                  <List.Item onClick={() => { handleClickBook(item); }}
                    actions={[
                      <Button onClick={(event) => { event.stopPropagation(); handleDeleteBook(item.id) }}>删除书籍</Button>,
                      <span style={{ fontSize: "20px" }}>
                        <StarFilled style={{ color: bookCovers[item.id]['fav'] ? 'red' : undefined }} onClick={(event) => {
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