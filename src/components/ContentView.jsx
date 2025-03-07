import React, { useContext } from "react";
import { MenuContext } from "../contexts/MenuContext";
import Bookshelf from "./Bookshelf";
const ContentView = ({ books, bookCovers, bookshelfSettings }) => {
  const { selectedMenu } = useContext(MenuContext);
  return (
    <>
      {selectedMenu === "1" &&
        <Bookshelf
          books={books}
          bookCovers={bookCovers}
          bookshelfSettings={bookshelfSettings}
        />
      }
      {selectedMenu === "2" && <h2>收藏</h2>}
      {selectedMenu === "3" && <h2>笔记</h2>}
    </>
  )
}

export default ContentView;