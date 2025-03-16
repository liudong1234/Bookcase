import { Select, Row, Modal, Col, Slider, InputNumber, theme } from "antd";
import {
  AlignCenterOutlined,
  AlignRightOutlined,
  AlignLeftOutlined,
} from "@ant-design/icons";
import { ConfigProvider } from "antd";
const SettingsModal = ({
  readerTheme,
  open,
  settings,
  onSettingChange,
  onModeChange,
  onClose,
}) => {
  return (
    <Modal
      title="页面设置"
      centered
      open={open}
      onOk={onClose}
      onCancel={onClose}
      okText="确认"
      cancelText="取消"
      width={{
        xs: "90%",
        sm: "80%",
        md: "70%",
        lg: "60%",
        xl: "50%",
        xxl: "40%",
      }}
    >
      <Row>
        <span
          style={{
            fontSize: "14px",
            marginRight: "10px",
            marginTop: "5px",
          }}
        >
          阅读方式
        </span>
        <Select
          defaultValue="平滑"
          onChange={onModeChange}
          style={{ width: 120 }}
          options={[
            {
              label: <span>水平阅读</span>,
              options: [
                { label: <span>平滑</span>, value: "paginated" },
                { label: <span>仿真</span>, value: "simulation" },
              ],
            },
            {
              label: <span>垂直阅读</span>,
              options: [
                { label: <span>普通</span>, value: "scrolled" },
                { label: <span>连续</span>, value: "successive" },
              ],
            },
          ]}
        />
      </Row>

      <Row>
        <span
          style={{
            fontSize: "14px",
            marginRight: "10px",
            marginTop: "5px",
          }}
        >
          字体
        </span>
        <Select
          value={settings.fontFamily}
          onChange={(value) => onSettingChange("fontFamily", value)}
          style={{ width: 150 }}
          options={[
            { label: "微软雅黑", value: "Microsoft YaHei" },
            { label: "宋体", value: "SimSun" },
            { label: "黑体", value: "SimHei" },
            { label: "楷体", value: "KaiTi" },
            { label: "华文行楷", value: "华文行楷" },
            { label: "仿宋", value: "FangSong" },
            { label: "幼圆", value: "YouYuan" },
            { label: "隶书", value: "LiSu" },
          ]}
        />
        <Col span={10}>
          <Slider
            min={12}
            max={50}
            value={settings.fontSize}
            onChange={(value) => onSettingChange("fontSize", value)}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={12}
            max={50}
            style={{ margin: "0 16px" }}
            value={settings.fontSize}
            onChange={(value) => onSettingChange("fontSize", value)}
          />
        </Col>
      </Row>

      <Row>
        <span
          style={{
            fontSize: "14px",
            marginRight: "10px",
            marginTop: "5px",
          }}
        >
          页边距
        </span>
        <Col span={10}>
          <Slider min={12} max={50} value={12} onChange={() => {}} />
        </Col>
        <Col span={4}>
          <InputNumber
            min={12}
            max={50}
            style={{ margin: "0 16px" }}
            value={12}
            onChange={() => {}}
          />
        </Col>
      </Row>

      <Row>
        <span
          style={{
            fontSize: "14px",
            marginRight: "10px",
            marginTop: "5px",
          }}
        >
          行间距
        </span>
        <Col span={10}>
          <Slider
            min={0}
            max={20}
            value={settings.lineSpacing}
            onChange={(value) => onSettingChange("lineSpacing", value)}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={0}
            max={20}
            style={{ margin: "0 16px" }}
            value={settings.lineSpacing}
            onChange={(value) => onSettingChange("lineSpacing", value)}
          />
        </Col>
      </Row>

      <Row>
        <span
          style={{
            fontSize: "14px",
            marginRight: "10px",
            marginTop: "5px",
          }}
        >
          对齐方式
        </span>
        <Col style={{ marginRight: "8px", fontSize: "20px" }}>
          <AlignLeftOutlined />
        </Col>
        <Col style={{ marginRight: "8px", fontSize: "20px" }}>
          <AlignCenterOutlined />
        </Col>
        <Col style={{ marginRight: "8px", fontSize: "20px" }}>
          <AlignRightOutlined />
        </Col>
      </Row>
    </Modal>
  );
};

export default SettingsModal;
