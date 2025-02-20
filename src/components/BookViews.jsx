import React from "react";


const BookViews = () => {

    const renderContent =() => {
        switch (currentView) {
          case '1':
            return <Bookshelf books={books} />;
          case '2':
            return ;
          case '3':
            return ;
          default:
            return <Bookshelf books={books} />;
        }
      }

      
    return (
        <div>
            
        </div>
    )
}


export default BookViews;