import BookParser from "./BookParser";

class MobiParser extends BookParser {
  constructor() {
    super()
    this.apiUrl = "http://localhost:3001/convert";  // Call the base class constructor
  }

  // Method to parse MOBI file and convert it to EPUB
  async parse(file) {
    try {
      debugger;
      // Create FormData object to send the MOBI file to the backend
      const formData = new FormData();
      formData.append("mobi", file);

      // Send the MOBI file to the backend for conversion
      const response = await fetch(this.apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error uploading MOBI file for conversion");
      }

      // Assuming the backend returns the URL or path of the converted EPUB file
      const data = await response.json();
      const epubUrl = data.epubFilePath; // The path or URL of the converted EPUB file

      return epubUrl;
    } catch (error) {
      console.error("Failed to parse MOBI file:", error);
      throw new Error("Failed to parse MOBI file and convert to EPUB");
    }
  }

  // Optional: Implement method to fetch cover (if available in the EPUB after conversion)
  async getCover(file) {
    try {
      const epubUrl = await this.parse(file);
      const response = await fetch(epubUrl);
      const book = await response.blob();
      return book; // Returning EPUB as a blob or URL
    } catch (error) {
      console.error("Failed to fetch cover:", error);
      return null;
    }
  }

  // Optional: Implement method to fetch metadata
  async getMetadata(file) {
    try {
      const epubUrl = await this.parse(file);
      const response = await fetch(epubUrl);
      const book = await response.json(); // Assuming the backend provides metadata in the response
      return {
        title: book.title,
        creator: book.creator,
        language: book.language,
        // Other metadata can go here
      };
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      return null;
    }
  }
}

export default MobiParser;
