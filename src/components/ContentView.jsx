import React, { useState } from "react";
import Bookshelf from "./Bookshelf";
import CollectionFav from './CollectionFav';
import WordDisplay from './Notes'
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
      {selectedMenu === "3" && 
        <WordDisplay />
      }
    </>
  )
}

export default ContentView;