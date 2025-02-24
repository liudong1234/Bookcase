import { invoke } from "@tauri-apps/api/core";

import { Button, Upload, message } from "antd";

const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'txt' : "application/txt", 
    'epub' : "application/epub+zip", 
    'md' : "application/md", 
    'markdown' : "application/md", 
    // 可以根据需要添加更多类型
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

const pathToFile = async (filePath, filename = null) => {
  try {
    // 直接使用 Tauri 命令读取文件
    const fileBytes = await invoke('read_file', { path: filePath });
    
    // 从路径中提取文件名
    const filename = filePath.split(/[/\\]/).pop();
    
    // 创建 Blob 对象
    const blob = new Blob([new Uint8Array(fileBytes)], {
      type: getMimeType(filename) // 根据文件扩展名获取 MIME 类型
    });
    
    // 创建 File 对象
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error('转换文件失败:', error);
    throw error;
  }
}


const CustomUpload = ({ handleSetSavePath }) => {
  const Chunk_SIZE = 1024 * 1024 * 3; // 1MB
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

        await invoke("upload_file_chunk", {
          chunk: Array.from(uintArray),
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

        if (++chunkIndex < totalChunks) {
          readNextChunk();
        } else {
          onSuccess({ status: "done" }, file);
          message.success(`${file.name} 上传成功`);
          const lastPath = await invoke("get_last_file_path");
          const file2 = await pathToFile(lastPath);
          console.log(file2);
          handleSetSavePath(file2);
        }
      } catch (err) {
        onError(err);
        message.error(`上传失败: ${err.message}`);
      }
    };

    reader.onerror = () => {
      onError(new Error("文件读取失败"));
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
      onChange={({ file }) => {
        if (file.status === "error") {
          message.error(`${file.name} 上传失败`);
        }
      }}
    >
      <Button>上传文件</Button>
    </Upload>
  );
};

export default CustomUpload;