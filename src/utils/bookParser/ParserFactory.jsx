import EpubParser from "./EpubParser";
import PdfParser from "./PdfParser";

class ParserFactory {
  static parsers = {
    "application/epub+zip": new EpubParser(),
    "application/pdf": new PdfParser(),
  };

  static getParser(mimeType) {
    const parser = this.parsers[mimeType];
    if (!parser) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    return parser;
  }

  static isSupported(mimeType) {
    return mimeType in this.parsers;
  }
}

export { ParserFactory };
