import { Button, Tooltip, Select } from "antd";

import {
  MenuOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SettingTwoTone,
} from "@ant-design/icons";

const themes = {
  light: { name: "日间模式", color: "#ffffff", text: "#333" },
  dark: { name: "夜间模式", color: "#121212", text: "#fff" },
};

const ReaderToolbar = ({
  readerTheme,
  navigationHandlers,
  onSettingsClick,
  onTocClick,
  onThemeToggle,
  children,
}) => {
  const handleThemeChange = (value) => {
    onThemeToggle(value);
  };

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
        <div className="theme-selector">
          <Select
            defaultValue="light"
            style={{
              width: 130,
              background: readerTheme.color,
              color: readerTheme.text,
            }}
            onChange={handleThemeChange}
          >
            {Object.keys(themes).map((key) => (
              <Option key={key} value={key}>
                {themes[key].name}
              </Option>
            ))}
          </Select>
        </div>
      </Tooltip>
      <Tooltip title="目录">
        <Button icon={<MenuOutlined />} onClick={onTocClick} />
      </Tooltip>
      {/* <Tooltip title="全屏">
        <Button
          icon={document.fullscreenElement ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }}
        />
      </Tooltip> */}
      <Tooltip title="设置">
        <Button icon={<SettingTwoTone />} onClick={onSettingsClick} />
      </Tooltip>
    </div>
  );
};

export default ReaderToolbar;