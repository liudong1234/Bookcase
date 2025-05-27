import { Popover, Button, QRCode } from 'antd';

const uploaderHost = 'http://192.168.0.111:8080/upload.html'; // ⚠️ 注意替换成实际 IP 地址

const FileTransfer = () => {
  return (
    <Popover content={<QRCode value={uploaderHost} bordered={false} />}>
      <Button>扫码上传</Button>
    </Popover>
  );
};

export default FileTransfer;