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
