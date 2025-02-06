import { useRef } from 'react';
import { Card } from 'antd';

const { Meta } = Card;

import { openReaderWindow } from './ReaderWindow';

const Bookshelf = ({ books, coverUrl }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">我的书架</h2>
      {books.length === 0 ? (
        <p className="text-gray-500">暂无书籍，请导入文件</p>
      ) : (
        <ul className="space-y-2">
          {books.map((book, index) => (
            <span key={index} 
              className="p-3 bg-gray-50 rounded-lg" 
              style={{display: 'inline-block', marginRight: "50px", marginTop: "10px"}}
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡
                openReaderWindow(book);
              }}   
            >
              <Card
                hoverable
                style={{
                  width: 150,
                }}
                cover={<img alt="Epub Cover" src={coverUrl} />}
                size='small'
                >
                <Meta title={book.name} description="epub" />
              </Card>
            </span>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Bookshelf;