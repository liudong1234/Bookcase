import Epub from "epubjs";
import BookParser from "./BookParser";
class EpubParser extends BookParser {
  async parse(file) {
    const book = new Epub(file);
    await book.ready;
    return book;
  }

  async getCover(file) {
    const book = await this.parse(file);
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      const response = await fetch(coverUrl);
      return await response.blob();
    }
    return null;
  }

  async getMetadata(file) {
    const book = await this.parse(file);
    return {
      title: book.package.metadata.title,
      creator: book.package.metadata.creator,
      language: book.package.metadata.language,
      // 其他元数据
    };
  }
}

export default EpubParser;