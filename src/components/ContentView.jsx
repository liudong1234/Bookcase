import React, { useContext, useEffect } from "react";
import { MenuContext } from "../contexts/MenuContext";
import Bookshelf from "./Bookshelf";
const ContentView = ({bookfile, onBookParsed, onSiderBarHidden, theme}) => {
    const { selectedMenu } = useContext(MenuContext);
    return (
        <div>
            {selectedMenu === "1" && <Bookshelf bookfile={bookfile} onBookParsed={onBookParsed} onSiderBarHidden={onSiderBarHidden} theme={theme} />}
            {selectedMenu === "2" && <h2>ℹ️ 关于页面</h2>}
            {selectedMenu === "3" && <h2>⚙️ 设置中心</h2>}
        </div>
    )
}

export default ContentView;