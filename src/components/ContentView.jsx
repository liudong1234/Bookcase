import React, { useState } from "react";
import Bookshelf from "./Bookshelf";
import CollectionFav from './CollectionFav';

const ContentView = ({ books, bookCovers, bookshelfSettings, selectedMenu }) => {
  const { handleSelectedBook } = bookshelfSettings;
  return (
    <>
      {selectedMenu === "1" &&
        <Bookshelf
          books={books}
          bookCovers={bookCovers}
          bookshelfSettings={bookshelfSettings}
        />
      }
      {selectedMenu === "2" && 
        <CollectionFav handleSelectedBook={handleSelectedBook} bookCovers={bookCovers} />
      }
      {selectedMenu === "3" && <h2>笔记</h2>}
    </>
  )
}

export default ContentView;