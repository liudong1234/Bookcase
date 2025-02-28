import BookParser from "./BookParser";
import { MOBI, isMOBI } from "../../../public/foliate-js/mobi";
const fflate = await import('../../../public/foliate-js/vendor/fflate.js');

class MobiParser extends BookParser {
  async parse(file) {
    if (await isMOBI(file)) {

        const book = await new MOBI({ unzlib: fflate.unzlibSync }).open(file);
        // console.log(book);
        return book;
    }
  }
  async getCover(file) {
    const mobi = await this.parse(file).mobi; 
    const coverUrl = await mobi.getCover();
    if (coverUrl) {
      return coverUrl;
    }
    return null;
  }

  async getMetadata(file) {
    const book = await this.parse(file); 
  }
}

export default MobiParser;