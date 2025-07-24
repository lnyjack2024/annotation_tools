import { Button, Modal, Row, Col, Switch } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import ColorPicker from "./ColorPicker";
import PointSelector from "./PointSelector";
import EdgeSelector from "./EdgeSelector";
import type { GeneralImageOntologyChild, Styles } from "./types";
import { StyleNames } from "./types";
import styles from "./styles.less";

interface PointEdgeStylerProps {
  title: string;
  desc: string;
  maxCount?: number;
  initialValues: Styles;
  styleName: StyleNames;
  tool: GeneralImageOntologyChild["tools"][0];
  onChange: (tool: GeneralImageOntologyChild["tools"][0]) => void;
}

const PointEdgeStyler: React.FC<PointEdgeStylerProps> = ({
  title,
  desc,
  maxCount,
  initialValues,
  styleName,
  tool,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const [styleList, setStyleList] = useState<
    {
      key: string;
      pointColor?: string;
      pointType?: string;
      edgeColor?: string;
      edgeType?: string;
      edgeBold?: boolean;
    }[]
  >([]);

  useEffect(() => {
    const {
      point_color = initialValues.point_color,
      point_type = initialValues.point_type,
      edge_color = initialValues.edge_color,
      edge_type = initialValues.edge_type,
      edge_bold = initialValues.edge_bold,
      points_color = [],
      points_type = [],
      edges_color = [],
      edges_type = [],
      edges_bold = [],
    } = tool;
    const length = (tool[styleName] as string[])?.length || 0;
    const list = Array.from({ length }).map((_, i) => ({
      key: nanoid(),
      ...(styleName === StyleNames.POINTS_COLOR && {
        pointColor: points_color[i] || point_color,
      }),
      ...(styleName === StyleNames.POINTS_TYPE && {
        pointType: points_type[i] || point_type,
      }),
      ...(styleName === StyleNames.EDGES_COLOR && {
        edgeColor: edges_color[i] || edge_color,
      }),
      ...(styleName === StyleNames.EDGES_TYPE && {
        edgeType: edges_type[i] || edge_type,
        edgeBold: edges_bold[i] !== undefined ? edges_bold[i] : edge_bold,
      }),
    }));
    setStyleList(list);
  }, [editing, tool]);

  const add = () => {
    const {
      point_color = initialValues.point_color,
      point_type = initialValues.point_type,
      edge_color = initialValues.edge_color,
      edge_type = initialValues.edge_type,
      edge_bold = initialValues.edge_bold,
    } = tool;
    const newStyle = {
      key: nanoid(),
      ...(styleName === StyleNames.POINTS_COLOR && {
        pointColor: point_color,
      }),
      ...(styleName === StyleNames.POINTS_TYPE && {
        pointType: point_type,
      }),
      ...(styleName === StyleNames.EDGES_COLOR && {
        edgeColor: edge_color,
      }),
      ...(styleName === StyleNames.EDGES_TYPE && {
        edgeType: edge_type,
        edgeBold: edge_bold,
      }),
    };
    setStyleList([...styleList, newStyle]);
  };

  const del = (index: number) => {
    const newStyleList = [...styleList];
    newStyleList.splice(index, 1);
    setStyleList(newStyleList);
  };

  const update = (index: number, valueKey: string, value: string | boolean) => {
    const newStyleList = [...styleList];
    newStyleList[index][valueKey] = value;
    setStyleList(newStyleList);
  };

  const handleClear = () => {
    setStyleList([]);
  };

  const handleSave = () => {
    const newTool = { ...tool };
    if (styleList.length === 0) {
      // no config
      delete newTool[styleName];
    } else {
      const pointsColor: string[] = [];
      const pointsType: string[] = [];
      const edgesColor: string[] = [];
      const edgesType: string[] = [];
      const edgesBold: boolean[] = [];
      styleList.forEach((s, i) => {
        pointsColor[i] = s.pointColor;
        pointsType[i] = s.pointType;
        edgesColor[i] = s.edgeColor;
        edgesType[i] = s.edgeType;
        edgesBold[i] = s.edgeBold;
      });
      if (styleName === StyleNames.POINTS_COLOR) {
        newTool.points_color = pointsColor;
      } else if (styleName === StyleNames.POINTS_TYPE) {
        newTool.points_type = pointsType;
      } else if (styleName === StyleNames.EDGES_COLOR) {
        newTool.edges_color = edgesColor;
      } else if (styleName === StyleNames.EDGES_TYPE) {
        newTool.edges_type = edgesType;
        newTool.edges_bold = edgesBold;
      }
    }
    onChange(newTool);
    setEditing(false);
  };

  return (
    <>
      <span style={{ color: "#7A869A", marginRight: 12, marginLeft: 22 }}>
        {formatMessage({
          id:
            styleList.length > 0
              ? "tool.general-image.config.been-set"
              : "tool.general-image.config.empty",
        })}
      </span>
      <Button onClick={() => setEditing(true)}>
        {formatMessage({ id: "tool.general-image.config.set" })}
      </Button>
      <Modal
        visible={editing}
        footer={null}
        width={800}
        bodyStyle={{
          minHeight: 520,
          paddingBottom: 80,
          position: "relative",
          color: "#42526E",
        }}
        title={title}
        onCancel={() => setEditing(false)}
      >
        <div style={{ marginBottom: 16 }}>{desc}</div>
        <div>
          {styleList.map((s, i) => (
            <Row key={s.key} className={styles["point-edge-item"]}>
              <Col span={4}>
                {styleName === StyleNames.EDGES_COLOR ||
                styleName === StyleNames.EDGES_TYPE
                  ? formatMessage({
                      id: "tool.general-image.child.custom.edge",
                    })
                  : formatMessage({
                      id: "tool.general-image.child.custom.point",
                    })}{" "}
                {i + 1}
              </Col>
              {styleName === StyleNames.POINTS_COLOR && (
                <Col span={6}>
                  <ColorPicker
                    width={32}
                    value={s.pointColor}
                    onChange={(v) => update(i, "pointColor", v)}
                  />
                </Col>
              )}
              {styleName === StyleNames.POINTS_TYPE && (
                <Col span={6}>
                  <PointSelector
                    value={s.pointType}
                    onChange={(v) => update(i, "pointType", v)}
                  />
                </Col>
              )}
              {styleName === StyleNames.EDGES_COLOR && (
                <Col span={12}>
                  <ColorPicker
                    width={32}
                    value={s.edgeColor}
                    onChange={(v) => update(i, "edgeColor", v)}
                  />
                </Col>
              )}
              {styleName === StyleNames.EDGES_TYPE && (
                <Col span={12}>
                  <EdgeSelector
                    value={s.edgeType}
                    onChange={(v) => update(i, "edgeType", v)}
                  />
                  <div style={{ marginLeft: 40 }}>
                    {formatMessage({
                      id: "tool.general-image.child.custom.edge-bold",
                    })}
                  </div>
                  <Switch
                    checked={s.edgeBold}
                    onChange={(v) => update(i, "edgeBold", v)}
                  />
                </Col>
              )}
              <Col span={4}>
                <CloseOutlined
                  style={{ cursor: "pointer" }}
                  onClick={() => del(i)}
                />
              </Col>
            </Row>
          ))}
          {(maxCount === undefined ||
            Number.isNaN(maxCount) ||
            styleList.length < maxCount) && (
            <Button onClick={add}>
              {formatMessage({ id: "tool.general-image.config.new-point" })}
            </Button>
          )}
        </div>
        <div className={styles["styler-btns"]}>
          <div>
            <Button
              type="link"
              danger
              style={{ padding: 0 }}
              onClick={handleClear}
            >
              {formatMessage({ id: "tool.general-image.config.reset" })}
            </Button>
          </div>
          <div>
            <Button
              style={{ marginRight: 12 }}
              onClick={() => setEditing(false)}
            >
              {formatMessage({ id: "common.cancel" })}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {formatMessage({ id: "common.save" })}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PointEdgeStyler;
