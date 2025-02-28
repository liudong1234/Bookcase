
import { Button, Upload, message, Progress } from "antd";
import { useEffect, useState } from "react";
import { bookOperations } from "../services/bookOperations";
import { ParserFactory } from "../utils/bookParser/ParserFactory";
import { getMimeType } from "../utils/FileDetector";

import { invoke } from "@tauri-apps/api/core";

import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";


const saveCoverImage = async (id, blob) => {
  try {
    // 将 Blob 转换为 ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    const suffix = blob.type.split(/[/\\]/).pop() || 'jpg';
    const filePath = 'data\\' + id + '\\' + id + '.' + suffix;
    // 获取文件保存路径，假设我们将文件保存到应用的文档目录下
    await writeFile(filePath , arrayBuffer, { baseDir: BaseDirectory.AppData });  // 指定文件名
    // console.log("封面图片已保存:", filePath);
  } catch (error) {
    console.error("保存封面图片时出错:", error);
  }
};

const CustomUpload = ({books, onResult}) => {
  const Chunk_SIZE = 1024 * 1024 * 5; // 1MB
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const loadData = async () => {
      try {
        const booksFromDB = await bookOperations.getAllBooks();
        
        const covers = {};
        for (const book of booksFromDB) {
          const coverBlob = await bookOperations.getCover(book.id);
          if (coverBlob) {
            covers[book.id] = URL.createObjectURL(coverBlob);
          }
        }
        setBooks(booksFromDB);
        setBookCovers(covers);
      } catch (error) {
        // message.error('加载书架数据失败', error);
      }
    };
    loadData();
  }, []);

  const handleUpload = ({ file, onProgress, onSuccess, onError }) => {
    const reader = new FileReader();
    let chunkIndex = 0;
    const totalChunks = Math.ceil(file.size / Chunk_SIZE);
    let uploadCanceled = false;

    const readNextChunk = () => {
      if (uploadCanceled) return;

      const start = chunkIndex * Chunk_SIZE;
      const end = start + Chunk_SIZE;
      const chunk = file.slice(start, end);
      reader.readAsArrayBuffer(chunk);
    };

    reader.onload = async (e) => {
      if (uploadCanceled) return;

      try {
        const uintArray = new Uint8Array(e.target.result);

        // 检查书籍是否已存在
        const isBookExists = books.some(b =>
          b.name === file.name &&
          b.size === file.size
        );

        if (isBookExists) {
          message.info('书籍已存在');
          onError();
          return;
        }
        // 生成书籍唯一ID
        const bookId = Date.now().toString();
        let lastPath = await invoke("upload_file_chunk", {
          chunk: Array.from(uintArray),
          id: bookId,
          fileName: file.name,
          chunkIndex,
          totalChunks,
        });

        // 更新进度
        const percent = Math.min(
          Math.ceil((chunkIndex / totalChunks) * 100),
          99 // 保持 99% 直到完成
        );
        onProgress({ percent }, file);
        setPercent(percent);

        if (++chunkIndex < totalChunks) {
          readNextChunk();
        } else {
          onSuccess({ status: "done" }, file);
          const parser = ParserFactory.getParser(file.type, file.name);
          // 获取并存储封面
          const coverBlob = await parser.getCover(file);
          let has_cover = false;
          if (coverBlob) {
            has_cover = true;
            saveCoverImage(bookId, coverBlob);
          }
          let type = file.type;
          if (file.type === '') {
            type = getMimeType(file.name);
          }
          let coverType = coverBlob.type;
          if (coverType === '') {
            coverType = 'image/jpg';
          }
          // 存储书籍数据
          const bookData = {
            id: bookId,
            name: file.name,
            size: file.size,
            file_type: type,
            last_modified: file.lastModified,
            file_path: lastPath,
            has_cover: has_cover
          };

          await bookOperations.saveBook(bookData);
          await bookOperations.saveCover(bookId, coverType);
          onResult();
          setPercent(100);
          message.success('书籍添加成功！');
        }
      } catch (err) {
        onError(err);
        setStatus('exception');
        message.error(`上传失败: ${err}`);
      }
    };

    reader.onerror = () => {
      onError(new Error("文件读取失败"));
      setStatus('exception');
      message.error("文件读取失败");
    };

    readNextChunk();

    // 提供中止方法
    return {
      abort() {
        uploadCanceled = true;
        reader.abort();
        message.warning(`${file.name} 上传已取消`);
      },
    };
  };

  return (
    <Upload 
      customRequest={handleUpload}
      showUploadList={false}
    >
      {
        percent > 0 && percent < 100 && (
          <Progress type="circle" percent={percent} size={25} status={status} />
        )
      }
      <Button>导入文件</Button>
    </Upload>
  );
};

export default CustomUpload;