import { Button, Tooltip } from "antd";

import { 
  MenuOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SettingTwoTone,
} from "@ant-design/icons";

const ReaderToolbar = ({
  readerTheme, 
  navigationHandlers, 
  onSettingsClick, 
  onTocClick, 
  onThemeToggle 
}) => {
  return (
    <div className="reader-tools" style={{ display: "flex", gap: "8px" }}>
      <Tooltip title="上一页">
        <Button 
          icon={<LeftOutlined />} 
          onClick={navigationHandlers.handlePrevPage} 
        />
      </Tooltip>
      <Tooltip title="下一页">
        <Button 
          icon={<RightOutlined />} 
          onClick={navigationHandlers.handleNextPage} 
        />
      </Tooltip>
      <Tooltip title="切换主题">
        <Button onClick={onThemeToggle}>
          {readerTheme === "light" ? "🌙" : "☀️"}
        </Button>
      </Tooltip>
      <Tooltip title="目录">
        <Button icon={<MenuOutlined />} onClick={onTocClick} />
      </Tooltip>
      <Tooltip title="全屏">
        <Button
          icon={ document.fullscreenElement ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();} }
        />
      </Tooltip>
      <Tooltip title="设置">
        <Button icon={<SettingTwoTone />} onClick={onSettingsClick} />
      </Tooltip>
    </div>
  );
};

export default ReaderToolbar;