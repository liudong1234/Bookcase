import { invoke } from '@tauri-apps/api/core';

// 书籍操作封装
export const bookOperations = {
  // 获取所有书籍
  getAllBooks: async () => {
    return invoke('get_books');
  },

  // 保存书籍
  saveBook: async (book) => {
    return invoke('save_book', { bookData: book});
  },

  // 删除书籍
  deleteBook: async (bookId) => {
    return invoke('delete_book', { bookId: bookId });
  },

  // 保存封面
  saveCover: async (bookId, coverType) => {
    return invoke('save_cover', { 
      bookId: bookId, 
      coverType: coverType 
    });
  },


  // 获取封面
  getCover: async (bookId) => {
    const coverData = await invoke('get_cover', { bookId: bookId });
    
    if (coverData) {
      return new Blob([new Uint8Array(coverData)], { type: 'image/jpeg' });
    }
    
    return null;
  },

  // 获取指定ID的书籍
  getBook: async (bookId) => {
    return invoke('get_book', { book_id: bookId });
  }
};
