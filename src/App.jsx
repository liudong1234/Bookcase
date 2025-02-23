import React, { useEffect, useState } from "react";
import { Layout, Button, Upload, message } from "antd";
import { AppstoreTwoTone, ProfileTwoTone } from "@ant-design/icons";

import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import SideBar from "./components/SideBar";
import ContentView from "./components/ContentView";
import { MenuProvider } from "./contexts/MenuContext";

import "./App.css";

const { Header, Content } = Layout;

const App = () => {
  const [bookfile, setBookfile] = useState(null);
  const [siderBarHidden, setSiderBarHidden] = useState(false);
  const [bookshelfStyle, setBookshelfStyle] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [savePath, setSavePath] = useState("");
  const changeBookshelfStyle = () => {
    setBookshelfStyle(!bookshelfStyle); //false格子， true列表
  };

  const handleFileUpload = async (e) => {
    const file = e.file.originFileObj;

    if (!file) return;
    setBookfile(file);
  };

  useEffect(() => {
    console.log(savePath);
    setBookfile(savePath);
  }, [savePath])
  const handleSetSavePath = (path) => {
    setSavePath(path);
  };

  const handleBookParsed = () => {
    setBookfile(null);
  };
  const handleHideSiderBar = (value) => {
    setHeaderOpen(!value);
    setSiderBarHidden(value);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {headerOpen && (
        <Header className="app-header">
          <h1>Bookcase 📚</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div>
              {/* <Upload 
                type="file"
                accept=".epub, .pdf, .md, .txt"
                customRequest={handleFileUpload}
                >
                <Button icon={<UploadOutlined />}>导入</Button>
              </Upload> */}
              <CustomUpload handleSetSavePath={handleSetSavePath} />
            </div>
            <div>
              <span
                className="settting-span"
                onClick={() => changeBookshelfStyle()}
              >
                {bookshelfStyle && <AppstoreTwoTone />}
                {!bookshelfStyle && <ProfileTwoTone />}
              </span>
            </div>
          </div>
        </Header>
      )}

      <Layout>
        <MenuProvider>
          <SideBar hidden={siderBarHidden} />
          <Content>
            <ContentView
              bookfile={bookfile}
              bookshelfSettings={{
                handleBookParsed,
                handleHideSiderBar,
                bookshelfStyle,
              }}
            />
          </Content>
        </MenuProvider>
      </Layout>
    </Layout>
  );
};

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
          const path = convertFileSrc(lastPath);
          handleSetSavePath(path);
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

export default App;
