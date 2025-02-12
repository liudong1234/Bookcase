class BookParser {
  async parse(file) {
    throw new Error("Must implement parse method");
  }

  async getCover(file) {
    throw new Error("Must implement getCover method");
  }

  async getMetadata(file) {
    throw new Error("Must implement getMetadata method");
  }
}

export default BookParser;
