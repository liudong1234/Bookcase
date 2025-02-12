// Markdown 解析器
// import markdownit from "markdown-it";
import BookParser from "./BookParse";

class MarkdownParser extends BookParser {
  async load() {
    const response = await fetch(this.file);
    const text = await response.text();
    this.htmlContent = new markdownit().render(text);
  }
  render(viewerRef) {
    viewerRef.innerHTML = this.htmlContent;
  }
}

export default MarkdownParser;