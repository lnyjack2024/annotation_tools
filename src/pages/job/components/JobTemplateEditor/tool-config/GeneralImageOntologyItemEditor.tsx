import { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  Switch,
  Dropdown,
} from "antd";
import { CompactPicker } from "react-color";
import type { ColorResult } from "react-color";
import { useIntl } from "@umijs/max";
import { getLocalLabel } from "@/utils/template-attributes";
import type { GeneralImageOntologyChild } from "@/pages/job/components/JobTemplateEditor/tool-config/GeneralImageToolConfig";

const tools = [
  {
    name: "rectangle",
    label: {
      "en-US": "Rectangle",
      "zh-CN": "长方形",
    },
  },
  {
    name: "centerline-rectangle",
    label: {
      "en-US": "Centerline Rectangle",
      "zh-CN": "长方形(中线)",
    },
  },
  {
    name: "ellipse",
    label: {
      "en-US": "Ellipse",
      "zh-CN": "椭圆",
    },
  },
  {
    name: "polygon",
    label: {
      "en-US": "Polygon",
      "zh-CN": "多边形",
    },
  },
  {
    name: "line",
    label: {
      "en-US": "Line",
      "zh-CN": "线",
    },
  },
  {
    name: "dot",
    label: {
      "en-US": "Dot",
      "zh-CN": "点",
    },
  },
  {
    name: "cuboid",
    label: {
      "en-US": "Cuboid",
      "zh-CN": "长方体",
    },
  },
  {
    name: "two-sides-cuboid",
    label: {
      "en-US": "Two Sides Cuboid",
      "zh-CN": "双框长方体",
    },
  },
  {
    name: "l-shape",
    label: {
      "en-US": "L Shape",
      "zh-CN": "L型图形",
    },
  },
  {
    name: "ocr",
    label: {
      "en-US": "Rectangle for OCR",
      "zh-CN": "长方形OCR框",
    },
  },
  {
    name: "ocr-polygon",
    label: {
      "en-US": "Polygon for OCR",
      "zh-CN": "多边形OCR框",
    },
  },
  {
    name: "four-dots-rectangle",
    label: {
      "en-US": "Four Dots Rectangle",
      "zh-CN": "四点画框",
    },
  },
  {
    name: "arrow",
    label: {
      "en-US": "Arrow",
      "zh-CN": "箭头",
    },
  },
  {
    name: "grid",
    label: {
      "en-US": "Grid",
      "zh-CN": "表格",
    },
  },
  {
    name: "recognition",
    label: {
      "en-US": "Intelligent Recognition",
      "zh-CN": "智能识别",
    },
  },
];

const GeneralImageOntologyItemEditor = ({
  item,
  defaultColor,
  onCancel,
  onSave,
  validateName,
}: {
  item: GeneralImageOntologyChild | null;
  defaultColor: string;
  onCancel: () => void;
  onSave: (item: GeneralImageOntologyChild) => void;
  validateName: (value: string) => boolean;
}) => {
  const { formatMessage } = useIntl();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [count, setCount] = useState<number | undefined>();
  const [minCount, setMinCount] = useState<number | undefined>();
  const [maxCount, setMaxCount] = useState<number | undefined>();
  const [type, setType] = useState("rectangle");
  const [edges, setEdges] = useState<number | undefined>();
  const [styles, setStyles] = useState<
    { pointColor: string; edgeColor: string; edgeBold: boolean }[]
  >([]);
  const [activeStyleIndex, setActiveStyleIndex] = useState(-1);
  const [pointColorVisible, setPointColorVisible] = useState(false);
  const [edgeColorVisible, setEdgeColorVisible] = useState(false);

  useEffect(() => {
    setName(item?.name || "");
    setCount(item?.count);
    setMinCount(item?.min_count);
    setMaxCount(item?.max_count);
    if (item?.tools) {
      const tool = (item?.tools || [])[0];
      setType(tool?.type || "rectangle");
      setEdges(tool?.edges);
    } else {
      // legacy data
      setType(item?.type.split(",")[0] || "rectangle");
      setEdges(item?.edges);
    }
  }, [item]);

  useEffect(() => {
    if (name) {
      if (!validateName(name)) {
        setNameError(
          formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.name.duplicated",
          })
        );
      } else {
        setNameError("");
      }
    } else {
      setNameError(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.item.name.empty",
        })
      );
    }
  }, [name]);

  useEffect(() => {
    const tool = (item?.tools || [])[0];
    console.log(styles);
    setStyles(
      Array.from({ length: edges || 0 }).map((_, i) => ({
        pointColor:
          styles[i]?.pointColor || (tool?.point_color || [])[i] || defaultColor,
        edgeColor:
          styles[i]?.edgeColor || (tool?.edge_color || [])[i] || defaultColor,
        edgeBold: styles[i]?.edgeBold || (tool?.edge_bold || [])[i] || false,
      }))
    );
  }, [edges]);

  const handleSave = () => {
    if (name && !nameError) {
      const tool: GeneralImageOntologyChild["tools"][0] = {
        type,
        edges,
      };
      if (
        styles.some(
          (s) =>
            s.pointColor !== defaultColor ||
            s.edgeColor !== defaultColor ||
            s.edgeBold
        )
      ) {
        // changed
        tool.point_color = [];
        tool.edge_color = [];
        tool.edge_bold = [];
        styles.forEach((s) => {
          tool.point_color.push(s.pointColor);
          tool.edge_color.push(s.edgeColor);
          tool.edge_bold.push(s.edgeBold);
        });
      }
      onSave({
        name,
        count,
        min_count: minCount,
        max_count: maxCount,
        type,
        tools: [tool],
      });
    }
  };

  return (
    <>
      <Form layout="vertical">
        <Form.Item
          required
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.name",
          })}
          {...(nameError && {
            validateStatus: "error",
            help: nameError,
          })}
        >
          <Input
            style={{ width: 348 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.count",
          })}
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: 348 }}
            value={count}
            onChange={setCount}
          />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.min-count",
          })}
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: 348 }}
            value={minCount}
            onChange={setMinCount}
          />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.max-count",
          })}
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: 348 }}
            value={maxCount}
            onChange={setMaxCount}
          />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.type",
          })}
        >
          <Radio.Group
            options={tools.map((o) => ({
              label: getLocalLabel(o.label),
              value: o.name,
            }))}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </Form.Item>
        {["polygon", "line", "arrow"].includes(type) && (
          <>
            <Form.Item
              label={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.item.edges",
              })}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: 348 }}
                value={edges}
                onChange={setEdges}
              />
            </Form.Item>
            {styles.map((style, i) => (
              <div
                key={`point-${i}`}
                style={{ display: "flex", alignItems: "center", height: 32 }}
              >
                <div style={{ flex: 1 }}>
                  {formatMessage(
                    {
                      id: "labeling-job-create.wizard.configuration.ontology.item.styles.label",
                    },
                    {
                      index: i + 1,
                    }
                  )}
                </div>
                <div style={{ flex: 2, display: "flex", alignItems: "center" }}>
                  {formatMessage({
                    id: "labeling-job-create.wizard.configuration.ontology.item.styles.point-color",
                  })}
                  <Dropdown
                    trigger={["click"]}
                    overlay={() => (
                      <CompactPicker
                        styles={{ default: { compact: { width: 280 } } }}
                        color={style.pointColor}
                        onChangeComplete={(color: ColorResult) => {
                          const newStyles = [...styles];
                          newStyles[i].pointColor = color.hex;
                          setStyles(newStyles);
                          setActiveStyleIndex(-1);
                          setPointColorVisible(false);
                        }}
                      />
                    )}
                    visible={i === activeStyleIndex && pointColorVisible}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        backgroundColor: style.pointColor,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setActiveStyleIndex(i);
                        setPointColorVisible(true);
                      }}
                    />
                  </Dropdown>
                </div>
                <div style={{ flex: 2, display: "flex", alignItems: "center" }}>
                  {formatMessage({
                    id: "labeling-job-create.wizard.configuration.ontology.item.styles.edge-color",
                  })}
                  <Dropdown
                    trigger={["click"]}
                    overlay={() => (
                      <CompactPicker
                        styles={{ default: { compact: { width: 280 } } }}
                        color={style.edgeColor}
                        onChangeComplete={(color: ColorResult) => {
                          const newStyles = [...styles];
                          newStyles[i].edgeColor = color.hex;
                          setStyles(newStyles);
                          setActiveStyleIndex(-1);
                          setEdgeColorVisible(false);
                        }}
                      />
                    )}
                    visible={i === activeStyleIndex && edgeColorVisible}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        backgroundColor: style.edgeColor,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setActiveStyleIndex(i);
                        setEdgeColorVisible(true);
                      }}
                    />
                  </Dropdown>
                </div>
                <div style={{ flex: 2, display: "flex", alignItems: "center" }}>
                  {formatMessage({
                    id: "labeling-job-create.wizard.configuration.ontology.item.styles.edge-bold",
                  })}
                  <Switch
                    checked={style.edgeBold}
                    onChange={(checked) => {
                      const newStyles = [...styles];
                      newStyles[i].edgeBold = checked;
                      setStyles(newStyles);
                    }}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </Form>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 48,
        }}
      >
        <Button onClick={onCancel} style={{ marginRight: 12 }}>
          {formatMessage({ id: "common.cancel" })}
        </Button>
        <Button type="primary" onClick={handleSave}>
          {formatMessage({ id: "common.ok" })}
        </Button>
      </div>
    </>
  );
};

export default GeneralImageOntologyItemEditor;
