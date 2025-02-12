// PDF 解析器
import BookParser from "./BookParse";

class PdfParser extends BookParser {
  async load() {
    this.pdf = await pdfjsLib.getDocument(this.file).promise;
  }
  render(viewerRef) {
    // 使用 canvas 渲染 PDF 页面
  }
}

export default PdfParser;