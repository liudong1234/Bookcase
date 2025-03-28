import { useState } from "react";
import { Dropdown, Space, Drawer, Button, message } from "antd";
import { SettingTwoTone,SettingFilled  } from '@ant-design/icons'
import { open } from '@tauri-apps/plugin-dialog';
import { directory } from "../utils/Tool";

const items = [
  {
    key: "1",
    label: <a>文件管理</a>,
  },
  {
    key: "2",
    label: <a>通用设置</a>,
    icon: <SettingTwoTone />,
  },
  {
    key: "3",
    label: <a>关于</a>,
  },
  {
    key: "4",
    danger: true,
    label: "清除所有数据",
  },
];
const Settings = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  
  const showDrawer = () => {
    setOpenDrawer(true);
  };
  
  const onClose = () => {
    setOpenDrawer(false);
  };
  const onClick = ({ key }) => {
    let num = Number(key)
    switch (num) {
      case 1:
        console.log(directory);
        showDrawer();
        break;
    
      default:
        break;
    }
  };
  
  const selectedDir = async () => {
    const file = await open({
      multiple: false,
      directory: true,
    });
  }



  return (
    <>
      <div className="settings">
        <Dropdown
          menu={{
            items,
            onClick,
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <SettingFilled />
            </Space>
          </a>
        </Dropdown>
      </div>

      <Drawer
        title="文件管理"
        placement='top'
        onClose={onClose}
        open={openDrawer}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={onClose}>
              确认
            </Button>
          </Space>
        }
      >
        <p>文件保存路径：{directory}</p>
        <Button onClick={selectedDir}>
          点击
        </Button>
      </Drawer>
    </>
  )
}


export default Settings;