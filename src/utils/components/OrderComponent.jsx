import { Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const OrderComponent = ({items, onClick}) => {

  return (
    <Dropdown menu={{ items, onClick }} trigger={['click']}>
      <a onClick={(e) => e.preventDefault()}>
        <Space>
          排序方式
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  )

}


export default OrderComponent;