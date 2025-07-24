import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Button,
  Checkbox,
  InputNumber,
  Popconfirm,
  Modal,
} from "antd";
import type { CheckboxChangeEvent } from "antd/lib/checkbox";
import { useIntl } from "@umijs/max";
import LabelConfigField from "./LabelConfigField";
import CountField from "./CountField";
import ToolSelector from "./ToolSelector";
import ColorPicker from "./ColorPicker";
// import CustomStyler from './CustomStyler';
import { Tool } from "./types";
import type { GeneralImageOntologyChild } from "./types";
import { isStyleCustomized } from "./utils";
import styles from "./styles.less";

export interface OntologyChildEditorHandle {
  validate: () => Promise<boolean>;
}

interface OntologyChildEditorProps {
  multipleMode?: boolean;
  child: GeneralImageOntologyChild;
  onChange: (child: GeneralImageOntologyChild) => void;
  onDelete?: (childKey: string) => void;
  validateChildName?: (key: string, childName: string) => boolean;
}

const OntologyChildEditor = React.forwardRef<
  OntologyChildEditorHandle,
  OntologyChildEditorProps
>(
  (
    { multipleMode = true, child, onChange, onDelete, validateChildName },
    ref
  ) => {
    const { formatMessage } = useIntl();
    const [form] = Form.useForm();
    const [toolType, setToolType] = useState<Tool>(Tool.RECTANGLE);
    const [useModel, setUseModel] = useState(false);
    const [edgesCheck, setEdgesCheck] = useState(false);
    const [edges, setEdges] = useState<number | null>(null);
    // const [stylerVisible, setStylerVisible] = useState(false);
    const updated = useRef(false);
    const styleCustomized =
      child.label_config_groups?.length > 0 ||
      child.label_config_point_groups?.length > 0 ||
      isStyleCustomized(child.tools[0]);

    const updateEdges = () => {
      const currEdges = child.tools[0].edges;
      if (
        [Tool.POLYGON, Tool.LINE, Tool.ARROW].includes(toolType) &&
        currEdges !== undefined &&
        currEdges !== null
      ) {
        // has edges configuration
        setEdgesCheck(true);
        setEdges(
          toolType === Tool.POLYGON ? Math.max(currEdges, 3) : currEdges
        );
      } else {
        setEdgesCheck(false);
        setEdges(null);
      }
    };

    useEffect(() => {
      updated.current = false;
      form.resetFields();
      setToolType(child.tools[0].type as Tool);
      setUseModel(child.tools[0].models || false);
      updateEdges();
    }, [child]);

    useEffect(() => {
      setUseModel(toolType === Tool.POLYGON ? !!child.tools[0].models : false);
      updateEdges();
    }, [toolType]);

    useEffect(() => {
      if (updated.current) {
        const tool = { ...child.tools[0] };
        tool.type = toolType;
        tool.models = useModel;
        if (edgesCheck) {
          tool.edges = edges;
        } else {
          delete tool.edges;
        }
        onChange({ ...child, tools: [tool] });
      }
    }, [toolType, useModel, edgesCheck, edges]);

    useImperativeHandle(ref, () => ({
      validate: () =>
        new Promise<boolean>((resolve) => {
          form
            .validateFields()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        }),
    }));

    /**
     * handle input values change
     */
    const handleInputChange = () => {
      form.validateFields().then((values) => {
        onChange({ ...child, ...values });
      });
    };

    /**
     * handle form change
     * @param changedValues
     */
    const handleFormChange = (changedValues: any) => {
      const values = { ...changedValues };
      delete values.name;
      if (values.label_config) {
        // reset label_config_groups
        delete child.label_config_groups;
      }
      if (values.label_config_point) {
        // reset label_config_point_groups
        delete child.label_config_point_groups;
      }
      if (Object.keys(values).length > 0) {
        onChange({ ...child, ...values });
      }
    };

    /**
     * handle tool type change
     * @param tool
     */
    const handleToolChange = (tool: Tool) => {
      if (styleCustomized) {
        Modal.confirm({
          title: formatMessage({
            id: "tool.general-image.child.tool.change.confirm",
          }),
          onOk: () => {
            updated.current = true;
            setToolType(tool);
            // reset custom styles
            child.tools[0] = {
              type: child.tools[0].type,
              edges: child.tools[0].edges,
            };
            delete child.label_config_groups;
            delete child.label_config_point_groups;
          },
        });
      } else {
        updated.current = true;
        setToolType(tool);
      }
    };

    /**
     * handle use model checkbox change
     * @param e
     */
    const handleUseModelChange = (e: CheckboxChangeEvent) => {
      updated.current = true;
      const { checked } = e.target;
      setUseModel(checked);
    };

    /**
     * handle edges checkbox change
     * @param e
     */
    const handleEdgesCheckChange = (e: CheckboxChangeEvent) => {
      updated.current = true;
      const { checked } = e.target;
      setEdgesCheck(checked);
      if (checked) {
        setEdges(5);
      }
    };

    /**
     * handle edges value change
     * @param v
     */
    const handleEdgesChange = (v: number | null) => {
      updated.current = true;
      setEdges(v);
    };

    return (
      <>
        {multipleMode && (
          <div className={styles.header}>
            <Popconfirm
              title={formatMessage({
                id: "tool.general-image.child.delete.confirm",
              })}
              placement="bottomLeft"
              onConfirm={() => {
                if (onDelete) {
                  onDelete(child.key);
                }
              }}
            >
              <Button type="link" danger>
                {formatMessage({ id: "tool.general-image.child.delete" })}
              </Button>
            </Popconfirm>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={child}
          onValuesChange={handleFormChange}
        >
          <Row gutter={16}>
            {multipleMode && (
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={formatMessage({
                    id: "tool.general-image.child.name.label",
                  })}
                  rules={[
                    {
                      required: true,
                      message: formatMessage({
                        id: "tool.general-image.child.name.required",
                      }),
                    },
                    {
                      validator(_, value) {
                        if (
                          !value ||
                          !validateChildName ||
                          validateChildName(child.key, value)
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            formatMessage({
                              id: "tool.general-image.child.name.exist",
                            })
                          )
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder={formatMessage({
                      id: "tool.general-image.child.name.placeholder",
                    })}
                    onBlur={handleInputChange}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item
                name="label_config"
                label={formatMessage({
                  id: multipleMode
                    ? "tool.general-image.child.attr.label"
                    : "tool.general-image.child.attr.label-simple",
                })}
              >
                <LabelConfigField />
              </Form.Item>
            </Col>
            {multipleMode && (
              <Col span={24}>
                <Form.Item
                  label={formatMessage({
                    id: "tool.general-image.child.count.label",
                  })}
                >
                  <CountField
                    count={child.count}
                    max_count={child.max_count}
                    min_count={child.min_count}
                    onChange={(values) => onChange({ ...child, ...values })}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={12}>
              <Form.Item
                label={formatMessage({
                  id: multipleMode
                    ? "tool.general-image.child.tool.label"
                    : "tool.general-image.child.tool.label-simple",
                })}
              >
                <ToolSelector value={toolType} onChange={handleToolChange} />
              </Form.Item>
            </Col>
            <Col span={12} style={{ display: "flex" }}>
              <Form.Item name="display_color" label=" ">
                <ColorPicker />
              </Form.Item>
              {/* {[
                Tool.POLYGON,
                Tool.LINE,
                Tool.ARROW,
                Tool.RECTANGLE,
                Tool.DOT,
              ].includes(toolType) && (
                <Form.Item label=" ">
                  <Button type="link" onClick={() => setStylerVisible(true)}>
                    {formatMessage({
                      id: styleCustomized
                        ? 'tool.general-image.child.custom.label.been-set'
                        : 'tool.general-image.child.custom.label',
                    })}
                  </Button>
                </Form.Item>
              )} */}
            </Col>
            {/* {toolType === Tool.POLYGON && (
              <Col span={24}>
                <Checkbox checked={useModel} onChange={handleUseModelChange}>
                  {formatMessage({
                    id: 'tool.general-image.child.model.label',
                  })}
                </Checkbox>
              </Col>
            )} */}
            {[Tool.POLYGON, Tool.LINE, Tool.ARROW].includes(toolType) && (
              <>
                {/* <Col span={24}>
                  <Form.Item>
                    <div
                      style={{ display: 'inline-block', lineHeight: '34px' }}
                    >
                      <Checkbox
                        checked={edgesCheck}
                        onChange={handleEdgesCheckChange}
                      >
                        {formatMessage(
                          { id: 'tool.general-image.child.edges.label' },
                          {
                            tool: formatMessage({
                              id: `tool.general-image.tool.${toolType}`,
                            }),
                          },
                        )}
                      </Checkbox>
                    </div>
                    {edgesCheck && (
                      <InputNumber
                        min={toolType === Tool.POLYGON ? 3 : 1}
                        precision={0}
                        value={edges}
                        onChange={handleEdgesChange}
                      />
                    )}
                  </Form.Item>
                </Col> */}
                <Col span={24}>
                  <Form.Item
                    name="label_config_point"
                    label={formatMessage({
                      id: "tool.general-image.child.point-attr.label",
                    })}
                  >
                    <LabelConfigField />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
        {/* <CustomStyler
          visible={stylerVisible}
          child={child}
          onCancel={() => setStylerVisible(false)}
          onChange={onChange}
        /> */}
      </>
    );
  }
);

export default OntologyChildEditor;
