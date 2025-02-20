import { Button, Tooltip } from "antd";

import { 
  MenuOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SettingTwoTone,
} from "@ant-design/icons";

const ReaderToolbar = ({
  readerTheme, 
  navigationHandlers, 
  onSettingsClick, 
  onTocClick, 
  onThemeToggle,
  children,
}) => {
  return (
    <div className="reader-tools" style={{ display: "flex", gap: "8px" }}>
      <Tooltip title="上一页">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={navigationHandlers.handlePrevPage} 
        />
      </Tooltip>
      <Tooltip title="下一页">
        <Button 
          icon={<ArrowRightOutlined />} 
          onClick={navigationHandlers.handleNextPage} 
          />
      </Tooltip>
      {children}
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