import { useState } from 'react'

export const useFileDetector = () => {
  const [fileInfo, setFileInfo] = useState(null)

  const detectFileType = (file) => {
    const format = file.name.split('.').pop().toLowerCase()
    // 更复杂的检测逻辑可以在此扩展
    setFileInfo({ format, content: URL.createObjectURL(file) })
  }

  return [fileInfo, detectFileType]
}

export const getMimeType = (filename) => {
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
