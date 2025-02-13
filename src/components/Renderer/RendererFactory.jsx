import EpubRenderer from "./EpubRenderer";

export const createRenderer = (fileType) => {
  if (fileType === "epub") {
    return EpubRenderer;
  } else if (fileType === "pdf") {
    return PdfRenderer;
  }
  return DefaultRenderer;
};
