import { useTheme } from "../contexts/ThemeContext";
import { SunFilled, MoonFilled } from "@ant-design/icons";
import { Switch } from "antd";

const ThemeSwitcher = () => {
    const { isDark, toggleDarkMode } = useTheme();
  
    return (
    <div style={{marginTop: 5}}>
        <Switch
          checked={isDark}
          onChange={toggleDarkMode}
          checkedChildren={<SunFilled />}
          unCheckedChildren={<MoonFilled />}
        />
      </div>
    );
  };
  
  export default ThemeSwitcher;