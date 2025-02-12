import BookParser from './BookParser';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

class PdfParser extends BookParser {
  async parse(file) {
    // 将文件转换为URL以供查看器使用
    return URL.createObjectURL(file);
  }

  async getCover(file) {
    try {
      // 使用 pdf.js 获取第一页作为封面
      const pdfjs = await import('pdfjs-dist');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
    } catch (error) {
      console.error('获取PDF封面失败:', error);
      return null;
    }
  }

  async getMetadata(file) {
    try {
      const pdfjs = await import('pdfjs-dist');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      const metadata = await pdf.getMetadata();

      return {
        title: metadata?.info?.Title || file.name,
        author: metadata?.info?.Author,
        creator: metadata?.info?.Creator,
        producer: metadata?.info?.Producer,
        creationDate: metadata?.info?.CreationDate,
        modificationDate: metadata?.info?.ModDate,
      };
    } catch (error) {
      console.error('获取PDF元数据失败:', error);
      return {
        title: file.name,
      };
    }
  }
}

export default PdfParser;