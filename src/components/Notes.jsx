import { useState, useEffect } from 'react';
import { Input, Image } from 'antd';
import { Col, Row } from 'antd';
const WordDisplay = () => {
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const srearchWord = (value, event) => {
    setImages({});
    const url = `https://zi.tools/api/zi/${value}`;
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(jsonData => {
        setData(jsonData);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        paraseJson(data);
        setLoading(false);
      });
  }

  const paraseJson = (data) => {
    if (data?.yi.tu) {
      const fontdata = data?.yi.tubrief;

      //base64
      setImages(fontdata);

      //svg
      // for (const key in fontdata) {
      //   if (fontdata.hasOwnProperty(key)) { // 过滤原型链属性
      //     if (key === '_page_count')
      //       continue;
      //     parseAndRenderSVG(fontdata[key], key);
      //   }
      // }
    }
    // parseAndRenderSVG()
  }


  const parseAndRenderSVG = (pathData, key) => {
    const svgNS = "http://www.w3.org/2000/svg";

    // 创建SVG元素（保持原始viewBox比例）
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 -4.6 20 24"); // 与原始viewBox一致

    // 分割路径段并处理缩放
    const paths = pathData.split('|').map(segment => segment.trim());

    paths.forEach(segment => {
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", segment);
      path.setAttribute("fill", "currentColor");
      path.setAttribute("transform", "scale(0.1)"); // 应用0.1倍缩放
      svg.appendChild(path);
    });

    // 添加虚线背景路径（如示例中的横线）
    const dashedLine = document.createElementNS(svgNS, "path");
    // dashedLine.setAttribute("d", "M 0 190 L 200 190");
    dashedLine.setAttribute("stroke", "rgba(0,0,0,0.5)");
    dashedLine.setAttribute("stroke-dasharray", "30 20");
    dashedLine.setAttribute("stroke-width", "20");
    dashedLine.setAttribute("transform", "scale(0.1)");
    svg.insertBefore(dashedLine, svg.firstChild); // 作为底层

    const svgString = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 将图片数据URL保存到state
      const dataURL = canvas.toDataURL('image/png');
      setImages(prev => ({ ...prev, [key]: dataURL }));
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  }


  return (
    <>

      {/* 结果显示区域 */}
      <div>
        <div>
          <Input.Search
            placeholder="搜索"
            onSearch={srearchWord}
            loading={loading}
          />
        </div>
        <Row style={{ overflow: 'auto' }}>
          {Array.isArray(images) && images.map((item, outerIndex) => {
            const [_, __, word, ____, base64, text5, text6] = item;
            const key = `col-${outerIndex}`;
            return ( // 注意这里需要return
              <Col
                key={key}
                xs={{ flex: '100%' }}
                sm={{ flex: '50%' }}
                md={{ flex: '40%' }}
                lg={{ flex: '20%' }}
                xl={{ flex: '10%' }}
              >
                <Image
                  width={100}
                  src={`data:image/png;base64,${base64}`}
                  alt="{word}"
                />
                <span>{text5}-{text6}</span>
              </Col>
            );
          })}
        </Row>
      </div>

    </>
  );
};

export default WordDisplay;