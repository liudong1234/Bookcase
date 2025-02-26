import BookParser from "./BookParser";

class MarkdownParser extends BookParser {
  async parse(file) {
    const book = new FileReader();
    book.readAsText(file);
    return book;
  }

  async getCover(file) {
    // 提取第一页的文本内容
    const text = await extractTextFromFile(file);
    // 使用提取的文本生成封面
    const coverImage = await generateCoverImage(text);
    return coverImage;
  }

  async getMetadata(file) {
    
    return {
      title: file.name,
      creator: "",
      language: "",
      // 其他元数据
    };
  }
}

const extractTextFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstPageContent = text.split('\n').slice(0, 25).join('\n'); // 提取前10行
      resolve(firstPageContent);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};


const generateCoverImage = async (text) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxWidth = 400;  // 设置最大宽度
    const padding = 20;    // 设置边距
    const fontSize = 20;   // 设置字体大小

    // 设置画布大小
    ctx.font = `${fontSize}px Arial`;
    const lines = wrapText(ctx, text, maxWidth);
    const canvasHeight = lines.length * (fontSize + 5) + padding * 2;
    canvas.width = maxWidth;
    canvas.height = canvasHeight;

    // 背景色
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 文字颜色
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 绘制文本
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * (fontSize + 5));
    });

    // 转换 canvas 为 Blob
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        resolve(null); // 返回 null，如果没有成功生成 blob
      }
    }, 'image/jpg');  // 这里使用 PNG 格式
  });
};


// 文字换行处理函数
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  lines.push(currentLine); // 添加最后一行
  return lines;
};

export default MarkdownParser;