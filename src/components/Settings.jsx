import { useState } from "react";
import {
  Dropdown, Space, Drawer, Popover, message,
  Checkbox, Button, Modal, Input, ColorPicker,
  Upload, Row, Flex, Image, Radio
} from "antd";
import { SettingTwoTone, SettingFilled, ToolTwoTone, FolderTwoTone, UploadOutlined, LineChartOutlined, DotChartOutlined, BarChartOutlined, PieChartFilled } from '@ant-design/icons'
// import { open } from '@tauri-apps/plugin-dialog';
import { Command } from "@tauri-apps/plugin-shell";
import { exists } from "@tauri-apps/plugin-fs";
import { directory } from "../utils/Tool";

import { invoke } from "@tauri-apps/api/core";
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import { join } from "@tauri-apps/api/path";
const { TextArea } = Input;

const items = [
  {
    key: "1",
    label: <a>文件管理</a>,
    icon: <FolderTwoTone />
  },
  {
    key: "2",
    label: <a>通用设置</a>,
    icon: <SettingTwoTone />,
  },
  {
    key: "3",
    label: <a>插件</a>,
    icon: <ToolTwoTone />
  },
  {
    key: "4",
    label: <a>关于</a>,
  },
  {
    key: "5",
    danger: true,
    label: "清除所有数据",
  },
];
const DEFAULT_COLOR = [
  {
    color: 'rgb(16, 142, 233)',
    percent: 0,
  },
  {
    color: 'rgb(135, 208, 104)',
    percent: 100,
  },
];


const Settings = ({data, onUpdate}) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openPluginModal, setOpenPluginModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openCommonSettingsModal, setOpenCommonSettingsModal] = useState(false);
  const [bgList, setBgList] = useState([]);
  const {bgImage, bgUrl} = data;
  const {setBgImage, setBgUrl} = onUpdate;
  const [textAreas, setTextAreas] = useState([]);

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
      case 2:
        console.log("通用设置");
        showCommonSettingsModal();
        break;
      case 3:
        console.log("plugins");
        showPluginModal();
      default:
        break;
    }
  };

  const openDir = async () => {
    try {
      // 路径存在性校验
      if (!await exists(directory)) {
        throw new Error('路径不存在');
      }

      // 获取平台信息
      const { platform } = await import('@tauri-apps/plugin-os');
      const osPlatform = await platform();

      // 构造系统命令
      let cmd;
      switch (osPlatform) {
        case 'windows':
          cmd = new Command('explorer', [directory.replace(/\//g, '\\')]);
          break;
        case 'darwin':
          cmd = new Command('open', [directory]);
          break;
        default: // Linux
          cmd = new Command('xdg-open', [directory]);
      }

      // 执行命令
      const child = await cmd.execute();
      if (child.code !== 0) {
        throw new Error(`退出码 ${child.code}`);
      }
    } catch (error) {
      console.error('[Explorer Error]', error);
      import('@tauri-apps/plugin-dialog').then(({ message }) => {
        message(`无法打开路径: ${error.message}`, { type: 'error' });
      });
    }

  }

  //插件
  const showPluginModal = () => {
    setOpenPluginModal(true);
  };

  const handlePluginModalOk = () => {
    setConfirmLoading(true);
    //添加传递，，
    setTimeout(() => {
      setOpenPluginModal(false);
      setConfirmLoading(false);
    }, 2000);
  };

  const handlePluginModalCancel = () => {
    console.log('Clicked cancel button');
    setOpenPluginModal(false);
  };

  const onClickAddPluginBtn = () => {
    const newId = Date.now();
    setTextAreas([
      ...textAreas,
      {
        id: newId,
        content: '',
      }
    ]);
  }
  const handleTextChange = (id, e) => {
    const newTextAreas = textAreas.map(area => {
      if (area.id === id) {
        return { ...area, content: e.target.value };
      }
      return area;
    });
    setTextAreas(newTextAreas);
  };
  const handleDelTextArea = (id) => {
    setTextAreas(textAreas.filter(area => area.id !== id));
  }
  //通用设置
  const showCommonSettingsModal = () => {
    setOpenCommonSettingsModal(true);
  }

  const handleCommonSettingsModalOk = () => {
    setConfirmLoading(true);
    //添加传递，，
    setTimeout(() => {
      setOpenCommonSettingsModal(false);
      setConfirmLoading(false);
    }, 2000);
  }
  const handleCommonSettingsModalCancel = () => {
    setOpenCommonSettingsModal(false);
  }
  //背景图片
  const loadImages = async () => {
    try {
      // 获取 AppData 路径
      const wallpapersPath = await join(directory + '/background');

      // 读取目录
      const entries = await readDir(wallpapersPath);

      // 转换路径
      const images = await Promise.all(entries
        .filter(file => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
        })
        .map(async (file) => {
          const filePath = await join(wallpapersPath, file.name);
          const fileBytes = await readFile(filePath);

          // 创建 Blob 对象
          const blob = new Blob([new Uint8Array(fileBytes)]);
          return {
            id: (Math.random() + Date.now()).toString(36).slice(0, 8),
            name: file.name,
            url: URL.createObjectURL(blob)
          }
        }
        ));

      setBgList(images);
    } catch (err) {
      console.error('加载背景失败:', err);
    }
  }
  const onChangeColorImg = e => {
    setBgImage(e.target.checked);
    if (e.target.checked) {
      loadImages();
    }
  };
  //上传
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async (e) => {
      try {
        const uintArray = new Uint8Array(e.target.result);
        let flag = await invoke("upload_bg_img", {
          pic: uintArray,
          fileName: file.name
        });
        if (flag) {
          onSuccess(flag, file);
          loadImages();
        }
      }
      catch (err) {
        onError(err);
        message.error(`上传失败: ${err}`);
      }

    };
  }
  const beforeUpload = (file) => {
    // 验证 MIME 类型
    const isImage = file.type.startsWith('image/');
    // 验证文件扩展名（防止某些浏览器 MIME 类型不可靠）
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!isImage || !validExtensions.includes(extension)) {
      message.error('仅支持上传 PNG、JPG、GIF、WEBP 格式的图片');
      return Upload.LIST_IGNORE; // 阻止上传并隐藏文件
    }
    return true;
  };

  const [value, setValue] = useState(1);
  const onChange = e => {
    const value = e.target.value; 
    setValue(value);
    for (const item of bgList) {
      if (item.name === value) {
        setBgUrl(item.url);
        break; // ✅ 可中断
      }
    }
    console.log(e.target.value);
  };


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
        <Button onClick={openDir}>
          打开
        </Button>
        <p>插件保存路径：{directory}\plugins</p>
        <p>背景保存路径：{directory}\background</p>
      </Drawer>

      <Modal
        title="插件管理"
        centered
        open={openPluginModal}
        onOk={handlePluginModalOk}
        confirmLoading={confirmLoading}
        onCancel={handlePluginModalCancel}
        width={{
          xs: "90%",
          sm: "80%",
          md: "70%",
          lg: "60%",
          xl: "50%",
          xxl: "40%",
        }}
      >
        <Button type="primary" shape="round" size='default' onClick={onClickAddPluginBtn}>+</Button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {textAreas.map((area) => (
            <div key={area.id} style={{ position: 'relative' }}>
              <TextArea
                key={area.id}
                value={area.content}
                onChange={(e) => handleTextChange(area.id, e)}
                onClick={handleDelTextArea}
                rows={4}
                placeholder="粘贴或输入插件内容"
                // 以下为可选样式
                style={{
                  borderRadius: 8,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <Button
                danger
                type="primary"
                shape="circle"
                size="small"
                onClick={() => handleDelTextArea(area.id)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  transform: 'scale(0.8)'
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="通用设置"
        centered
        open={openCommonSettingsModal}
        onOk={handleCommonSettingsModalOk}
        confirmLoading={confirmLoading}
        onCancel={handleCommonSettingsModalCancel}
        width={{
          xs: "90%",
          sm: "80%",
          md: "70%",
          lg: "60%",
          xl: "50%",
          xxl: "40%",
        }}
      >
        <p style={{ fontSize: '15px', fontWeight: "bold" }}>主题颜色配置</p>
        <Space direction="vertical">
          <Space>
            <Popover content={"主体颜色"}>品牌色</Popover>
            <ColorPicker
              defaultValue={DEFAULT_COLOR}
              allowClear
              showText
              mode={['single', 'gradient']}
              onChangeComplete={(color) => {
                console.log(color.toCssString());
              }}
            />
          </Space>
          <Popover content={"应用在界面的文字、背景、边框和填充"} >
            中性色
          </Popover>
          <Space style={{ paddingLeft: "18px" }}>
            <span>文本</span>
            <ColorPicker
              defaultValue={"black"}
              allowClear
              showText
              mode='single'
              onChangeComplete={(color) => {
                console.log(color.toCssString());
              }}
            />
          </Space>
          <Space style={{ paddingLeft: "18px" }}>
            <span>背景</span>
            <Checkbox onChange={onChangeColorImg}>图片</Checkbox>
            {
              !bgImage &&
              <ColorPicker
                defaultValue={DEFAULT_COLOR}
                allowClear
                showText
                mode={['single', 'gradient']}
                onChangeComplete={(color) => {
                  console.log(color.toCssString());
                }}
              />
            }
            {
              bgImage &&
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/png, image/jpeg, image/gif, image/webp"
                beforeUpload={beforeUpload}
                style={{ width: "50px" }}
              >
                <Popover content={"以图片名保存"} >
                  <Button type="primary" icon={<UploadOutlined />}>
                    上传
                  </Button>
                </Popover>
              </Upload>
            }
          </Space>
          {
            bgImage &&
            <>
              <Radio.Group
                onChange={onChange}
                value={value}
                key={0}
                >
                  {bgList.map((img) => (
                    <Radio value={img.name} key={img.id}>
                      <Image width={80} src={img.url} alt={img.name} preview={false} />
                    </Radio>
                  ))}
                </Radio.Group>
              <Flex wrap gap="small">
              </Flex>
            </>

          }
        </Space>
      </Modal>

    </>
  )
}


export default Settings;