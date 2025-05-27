import { Avatar, Row, Tooltip, Dropdown } from 'antd';
import { loadFile } from '../utils/Tool';

const items = [
  {
    label: '取消收藏',
    key: '1',
  },
  {
    label: '删除书籍',
    key: '2',
    danger: true
  },
];

const CircleImageGallery = ({ handleSelectedBook, images }) => {

  const handleClickFavBook = async (book) => {
    let content = await loadFile({ id: book.id, name: book.name });
    handleSelectedBook(content);
  }

  const onClick = ({ key }) => {
    let num = Number(key)
    switch (num) {
      case 1:
        console.log('取消收藏');
        break;
      case 2:
        console.log("删除书籍");
        break;
      default:
        break;
    }
  };

  return (
    <Row
      justify="start"
      style={{
        borderRadius: 8,
        position: 'relative',
        width: '100%',
      }}
    >
      {
        images.map(item => {
          const bookId = Object.keys(item)[0]; // 获取键
          const { url, name } = item[bookId]; // 解构获取值
          return (
            <Dropdown menu={{items, onClick}} trigger={['contextMenu']} key={bookId}>
              <Tooltip placement='bottom' title={name} >
                <Avatar
                  key={bookId}
                  src={url}
                  shape='circle'
                  style={{ width: 100, height: 100, marginLeft: 50 }}
                  alt={name}
                  onClick={() => { handleClickFavBook({ id: bookId, name: name }) }}
                />
              </Tooltip>
            </Dropdown>
          )
        })
      }
    </Row>
  );
};

const CollectionFav = ({ handleSelectedBook, bookCovers }) => {
  let images = [];
  Object.entries(bookCovers).forEach(([bookId, cv]) => {
    if (cv.fav) {
      images.push({
        [bookId]: {
          name: cv.name,
          url: cv.url,
        }
      });
    }
  });

  return (
    <CircleImageGallery
      handleSelectedBook={handleSelectedBook}
      images={images}
    />
  )

}

export default CollectionFav;