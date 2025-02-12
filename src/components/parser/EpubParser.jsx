// EpubParser.jsx
import { useEffect, useState, useRef } from "react";
import Epub from "epubjs";

const useEpubParser = (book, readingMode, managerMode, theme, fontSize, fontFamily, viewerRef) => {
  const [toc, setToc] = useState([]);
  const [currentCfi, setCurrentCfi] = useState("");
  const [rendition, setRendition] = useState(null);
  const [currentChapter, setCurrentChapter] = useState('');
  const bookRef = useRef(null);

  useEffect(() => {
    const initBook = async () => {
      try {
        if (!book) return;

        bookRef.current = new Epub(book);

        // 等待书籍加载完成
        await bookRef.current.ready;

        // 创建渲染器
        const rendition = bookRef.current.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: readingMode, //paginated  scrolled
          manager: managerMode,
        });
        setRendition(rendition);

        // 加载目录
        const navigation = await bookRef.current.loaded.navigation;
        setToc(navigation.toc);

        // 恢复上次阅读位置
        const savedCfi = localStorage.getItem(`book-progress-${book.name}`);
        if (savedCfi) {
          rendition.display(savedCfi);
        } else {
          rendition.display();
        }

        // 设置主题
        rendition.themes.default({
          body: {
            "font-size": `${fontSize}px`,
            "background-color": theme === "light" ? "#fff" : "#1f1f1f",
            color: theme === "light" ? "#000" : "#fff",
          },
        });

        // 监听位置变化(垂直阅读模式)
        rendition.on("relocated", async (location) => {
          setCurrentCfi(location.start.cfi);
          localStorage.setItem(
            `book-progress-${book.name}`,
            location.start.cfi
          );
          // Get current chapter href
          const chapter = await bookRef.current.spine.get(location.start.cfi);

          if (chapter) {
            setCurrentChapter(chapter.href);
          }
        });
      } catch (error) {
        console.error("Error initializing book:", error);
        throw new Error("加载书籍失败，请重试");
      }
    };

    initBook();

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [book, readingMode, managerMode]);

  useEffect(() => {
    if (rendition) {
      rendition.themes.default({
        body: { "font-size": `${fontSize}px !important` },
      });
      rendition.themes.font(fontFamily);
    }
  }, [fontSize, fontFamily]);

  useEffect(() => {
    if (rendition) {
      rendition.themes.default({
        body: {
          "background-color": theme === "light" ? "#fff" : "#1f1f1f",
          color: theme === "light" ? "#000" : "#fff",
        },
      });
    }
  }, [theme]);

  return {
    toc,
    currentCfi,
    rendition,
    currentChapter,
    setCurrentCfi,
    setCurrentChapter,
  };
};

export default useEpubParser;