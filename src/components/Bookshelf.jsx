
const Bookshelf = ({ books }) => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">我的书架</h2>
        {books.length === 0 ? (
          <p className="text-gray-500">暂无书籍，请导入文件</p>
        ) : (
          <ul className="space-y-2">
            {books.map((book, index) => (
              <li key={index} className="p-3 bg-gray-50 rounded-lg">
                {book}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };



export default Bookshelf;