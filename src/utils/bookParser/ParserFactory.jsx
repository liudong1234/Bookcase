import EpubParser from "./EpubParser";
import MarkdownParser from "./MarkdownParser";
import PdfParser from "./PdfParser";
import MobiParser from "./MobiParser";
class ParserFactory {
  static parsers = {
    "application/epub+zip": new EpubParser(),
    "application/pdf": new PdfParser(),
    "application/md": new MarkdownParser(),
    "application/markdown": new MarkdownParser(),
    "application/txt": new MarkdownParser(),
    "application/mobi": new MobiParser(),
  };

  static getParser(mimeType, bookName) {
    let parser = this.parsers[mimeType];
    if (!parser) {
      if (bookName !== '') {
        const format = bookName.split('.').pop().toLowerCase()
        return this.parsers["application/" + format];
      }
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    return parser;
  }

  static isSupported(file) {
    
    let mimeType = file.type;
    if (mimeType === 'text/plain' || mimeType === '') {
      const format = file.name.split('.').pop().toLowerCase()
      mimeType = "application/" + format; 
    }

    return mimeType in this.parsers;
  }
}

export { ParserFactory };
