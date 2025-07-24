import { Modal, Button, Form, Divider, Checkbox, Switch, Radio } from "antd";
import { useIntl } from "@umijs/max";
import { useEffect, useState } from "react";
import ColorPicker from "./ColorPicker";
import PointSelector from "./PointSelector";
import EdgeSelector from "./EdgeSelector";
import LabelConfigStyler from "./LabelConfigStyler";
import PointEdgeStyler from "./PointEdgeStyler";
import { Tool, StyleNames } from "./types";
import type { GeneralImageOntologyChild, Group } from "./types";
import styles from "./styles.less";

interface CustomStylerProps {
  visible: boolean;
  child: GeneralImageOntologyChild;
  onCancel: () => void;
  onChange: (child: GeneralImageOntologyChild) => void;
}

const CustomStyler: React.FC<CustomStylerProps> = ({
  visible,
  child,
  onCancel,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  const [tool, setTool] = useState<GeneralImageOntologyChild["tools"][0]>(
    child.tools[0]
  );
  const [labelConfigGroups, setLabelConfigGroups] = useState<Group[]>([]);
  const [pointLabelConfigGroups, setPointLabelConfigGroups] = useState<Group[]>(
    []
  );
  const [fillChecked, setFillChecked] = useState(false);

  const [pointColorChecked, setPointColorChecked] = useState(false);
  const [pointColorMode, setPointColorMode] = useState<
    "point-attr" | "index" | "item-attr"
  >("point-attr");
  const [pointTypeChecked, setPointTypeChecked] = useState(false);
  const [pointTypeMode, setPointTypeMode] = useState<
    "point-attr" | "index" | "item-attr"
  >("point-attr");

  const [edgeColorChecked, setEdgeColorChecked] = useState(false);
  const [edgeColorMode, setEdgeColorMode] = useState<
    "point-attr" | "index" | "item-attr"
  >("point-attr");
  const [edgeTypeChecked, setEdgeTypeChecked] = useState(false);
  const [edgeTypeMode, setEdgeTypeMode] = useState<
    "point-attr" | "index" | "item-attr"
  >("point-attr");

  const type = child.tools[0].type as Tool;
  const fillEnabled = type === Tool.RECTANGLE || type === Tool.POLYGON;
  const pointEdgeEnabled =
    type === Tool.POLYGON || type === Tool.LINE || type === Tool.ARROW;
  const edgeEnabled = pointEdgeEnabled || type === Tool.RECTANGLE;
  const pointEnabled = pointEdgeEnabled || type === Tool.DOT;
  const isDot = type === Tool.DOT;

  const initLabelConfigGroups = () => {
    const groups: Group[] = [];
    child.label_config_groups?.forEach((g) => {
      const keys = Object.keys(g).filter(
        (k) => k !== "key" && k !== StyleNames.EDGE_BOLD && k !== "attributes"
      );
      keys.forEach((key) => {
        groups.push({
          attributes: { ...g.attributes },
          [key]: g[key],
          ...(key === StyleNames.EDGE_TYPE && {
            edge_bold: g.edge_bold || false,
          }),
        });
      });
    });
    setLabelConfigGroups(groups);
  };

  const initPointLabelConfigGroups = () => {
    const groups: Group[] = [];
    child.label_config_point_groups?.forEach((g) => {
      const keys = Object.keys(g).filter(
        (k) => k !== "key" && k !== StyleNames.EDGE_BOLD && k !== "attributes"
      );
      keys.forEach((key) => {
        groups.push({
          attributes: { ...g.attributes },
          [key]: g[key],
          ...(key === StyleNames.EDGE_TYPE && {
            edge_bold: g.edge_bold || false,
          }),
        });
      });
    });
    setPointLabelConfigGroups(groups);
  };

  const initPointColorConfig = () => {
    const pointColorLabelConfigCustomized =
      child.label_config_groups?.filter((i) => i.point_color !== undefined)
        .length > 0;
    const pointColorLabelConfigPointCustomized =
      child.label_config_point_groups?.filter(
        (i) => i.point_color !== undefined
      ).length > 0;
    const isOrderPointColor = child.tools[0]?.points_color?.length > 0;
    setPointColorChecked(
      pointEnabled &&
        (pointColorLabelConfigCustomized ||
          pointColorLabelConfigPointCustomized ||
          isOrderPointColor)
    );
    const mode = isOrderPointColor ? "index" : "";
    setPointColorMode(
      mode ||
        (pointColorLabelConfigPointCustomized ? "point-attr" : "item-attr")
    );
  };

  const initPointTypeConfig = () => {
    const pointTypeLabelConfigCustomized =
      child.label_config_groups?.filter((i) => i.point_type !== undefined)
        .length > 0;
    const pointTypeLabelConfigPointCustomized =
      child.label_config_point_groups?.filter((i) => i.point_type !== undefined)
        .length > 0;
    const isOrderPointType = child.tools[0]?.points_type?.length > 0;
    setPointTypeChecked(
      pointEnabled &&
        (pointTypeLabelConfigCustomized ||
          pointTypeLabelConfigPointCustomized ||
          isOrderPointType)
    );
    const mode = isOrderPointType ? "index" : "";
    setPointTypeMode(
      mode || (pointTypeLabelConfigPointCustomized ? "point-attr" : "item-attr")
    );
  };

  const initEdgeColorConfig = () => {
    const edgeColorLabelConfigCustomized =
      child.label_config_groups?.filter((i) => i.edge_color !== undefined)
        .length > 0;
    const edgeColorLabelConfigPointCustomized =
      child.label_config_point_groups?.filter((i) => i.edge_color !== undefined)
        .length > 0;
    const isOrderEdgeColor = child.tools[0]?.edges_color?.length > 0;
    setEdgeColorChecked(
      edgeEnabled &&
        (edgeColorLabelConfigCustomized ||
          edgeColorLabelConfigPointCustomized ||
          isOrderEdgeColor)
    );
    const mode = isOrderEdgeColor ? "index" : "";
    setEdgeColorMode(
      mode || (edgeColorLabelConfigPointCustomized ? "point-attr" : "item-attr")
    );
  };

  const initEdgeTypeConfig = () => {
    const edgeTypeLabelConfigCustomized =
      child.label_config_groups?.filter((i) => i.edge_type !== undefined)
        .length > 0;
    const edgeTypeLabelConfigPointCustomized =
      child.label_config_point_groups?.filter((i) => i.edge_type !== undefined)
        .length > 0;
    const isOrderEdgeType = child.tools[0]?.edges_type?.length > 0;
    setEdgeTypeChecked(
      edgeEnabled &&
        (edgeTypeLabelConfigCustomized ||
          edgeTypeLabelConfigPointCustomized ||
          isOrderEdgeType)
    );
    const mode = isOrderEdgeType ? "index" : "";
    setEdgeTypeMode(
      mode || (edgeTypeLabelConfigCustomized ? "item-attr" : "point-attr")
    );
  };

  useEffect(() => {
    setTool(child.tools[0]);

    initLabelConfigGroups();
    initPointLabelConfigGroups();

    setFillChecked(
      fillEnabled &&
        child.label_config_groups?.filter((i) => i.fill_color !== undefined)
          .length > 0
    );

    initPointColorConfig();
    initPointTypeConfig();

    initEdgeColorConfig();
    initEdgeTypeConfig();

    form.resetFields();
  }, [visible, child]);

  useEffect(() => {
    form.resetFields();
  }, [tool]);

  /**
   * click save button to save & close modal
   */
  const handleSave = () => {
    const newChild = {
      ...child,
      label_config_groups: labelConfigGroups,
      label_config_point_groups: pointLabelConfigGroups,
      tools: [{ ...tool }],
    };

    newChild.label_config_groups = newChild.label_config_groups.filter((g) => {
      return (
        !(!fillChecked && g.fill_color) &&
        !(!pointColorChecked && g.point_color) &&
        !(!pointTypeChecked && g.point_type) &&
        !(!edgeColorChecked && g.edge_color) &&
        !(!edgeTypeChecked && (g.edge_type || g.edge_bold !== undefined))
      );
    });
    newChild.label_config_point_groups =
      newChild.label_config_point_groups.filter((g) => {
        return (
          !(!pointColorChecked && g.point_color) &&
          !(!pointTypeChecked && g.point_type) &&
          !(!edgeColorChecked && g.edge_color) &&
          !(!edgeTypeChecked && (g.edge_type || g.edge_bold !== undefined))
        );
      });
    if (!pointColorChecked) {
      delete newChild.tools[0].points_color;
    }
    if (!pointTypeChecked) {
      delete newChild.tools[0].points_type;
    }
    if (!edgeColorChecked) {
      delete newChild.tools[0].edges_color;
    }
    if (!edgeTypeChecked) {
      delete newChild.tools[0].edges_type;
      delete newChild.tools[0].edges_bold;
    }

    if (newChild.label_config_groups?.length === 0 || !child.label_config) {
      delete newChild.label_config_groups;
    }
    if (
      newChild.label_config_point_groups?.length === 0 ||
      !child.label_config_point
    ) {
      delete newChild.label_config_point_groups;
    }
    onChange(newChild);
    onCancel();
  };

  /**
   * handle reset
   */
  const handleReset = () => {
    setTool({
      type: tool.type,
      edges: tool.edges,
    });
    setLabelConfigGroups([]);
    setPointLabelConfigGroups([]);
    setFillChecked(false);
    setPointColorChecked(false);
    setPointTypeChecked(false);
    setEdgeTypeChecked(false);
    setEdgeColorChecked(false);
  };

  /**
   * handle form change
   * @param changedValues
   */
  const handleChange = (changedValues: any) => {
    setTool({
      ...tool,
      ...changedValues,
    });
  };

  const initialValues = {
    fill_color: child.display_color,
    point_color: child.display_color,
    point_type: "dot",
    edge_color: child.display_color,
    edge_type: "straight",
    edge_bold: false,
  };

  const handleCheckedMode = (val: "index" | "attr", styleName: StyleNames) => {
    const newCheckedMode =
      val !== "index"
        ? child.label_config_groups?.filter((i) => i[styleName] !== undefined)
            .length > 0
          ? "item-attr"
          : "point-attr"
        : "index";
    switch (styleName) {
      case StyleNames.POINT_COLOR:
        setPointColorMode(newCheckedMode);
        break;
      case StyleNames.POINT_TYPE:
        setPointTypeMode(newCheckedMode);
        break;
      case StyleNames.EDGE_COLOR:
        setEdgeColorMode(newCheckedMode);
        break;
      case StyleNames.EDGE_TYPE:
        setEdgeTypeMode(newCheckedMode);
        break;
      default:
        break;
    }
  };

  const onLabelConfigStylerChange = (
    groups: Group[],
    mode: "point-attr" | "item-attr",
    clearGroupStyleName: StyleNames,
    clearToolStyleName: StyleNames
  ) => {
    if (mode === "point-attr") {
      setPointLabelConfigGroups(groups);
      const newLabelConfigGroups = labelConfigGroups.filter(
        (g) => !g[clearGroupStyleName]
      );
      setLabelConfigGroups(newLabelConfigGroups);
    } else if (mode === "item-attr") {
      setLabelConfigGroups(groups);
      const newPointLabelConfigGroups = pointLabelConfigGroups.filter(
        (g) => !g[clearGroupStyleName]
      );
      setPointLabelConfigGroups(newPointLabelConfigGroups);
    }
    const newTool = { ...tool };
    delete newTool[clearToolStyleName];
    if (clearToolStyleName === StyleNames.EDGES_TYPE) {
      delete newTool.edges_bold;
    }
    setTool(newTool);
  };

  const onPointEdgeStylerChange = (
    t: GeneralImageOntologyChild["tools"][0],
    clearStyleName: StyleNames
  ) => {
    setTool(t);
    const newPointLabelConfigGroups = pointLabelConfigGroups.filter(
      (g) => !g[clearStyleName]
    );
    const newLabelConfigGroups = labelConfigGroups.filter(
      (g) => !g[clearStyleName]
    );
    setPointLabelConfigGroups(newPointLabelConfigGroups);
    setLabelConfigGroups(newLabelConfigGroups);
  };

  return (
    <Modal
      visible={visible}
      footer={null}
      width={800}
      bodyStyle={{ minHeight: 520, paddingBottom: 80, position: "relative" }}
      title={formatMessage(
        {
          id: "tool.general-image.child.custom.title",
        },
        {
          tool: formatMessage({ id: `tool.general-image.tool.${type}` }),
        }
      )}
      onCancel={onCancel}
    >
      <Form
        form={form}
        colon={false}
        initialValues={{
          ...initialValues,
          ...tool,
        }}
        onValuesChange={handleChange}
      >
        {fillEnabled && (
          <div className={styles.styler}>
            <div className={styles.title}>
              {formatMessage({
                id: "tool.general-image.child.custom.fill.label",
              })}
            </div>
            <div className={styles.content}>
              <Form.Item name="fill_color">
                <ColorPicker />
              </Form.Item>
              <Divider />
              <Checkbox
                style={{ height: 32, lineHeight: "32px" }}
                checked={fillChecked}
                onChange={(e) => setFillChecked(e.target.checked)}
              >
                {formatMessage({
                  id: "tool.general-image.child.custom.fill.check",
                })}
              </Checkbox>
              {fillChecked && (
                <LabelConfigStyler
                  title={formatMessage({
                    id: "tool.general-image.child.custom.fill.title",
                  })}
                  desc={formatMessage({
                    id: "tool.general-image.child.custom.fill.desc",
                  })}
                  warningDesc={formatMessage({
                    id: "tool.general-image.child.custom.fill.warning",
                  })}
                  labelConfig={child.label_config}
                  stylesMapping={{
                    color: StyleNames.FILL_COLOR,
                  }}
                  styleName={StyleNames.FILL_COLOR}
                  labelConfigGroups={labelConfigGroups.filter(
                    (i) => i.fill_color !== undefined
                  )}
                  onChange={(groups) => {
                    const currGroups = labelConfigGroups.filter(
                      (i) => i.fill_color !== undefined
                    );
                    const deletedGroups = currGroups.filter(
                      (i) => groups.findIndex((g) => g.key === i.key) < 0
                    );
                    const newGroups = [...labelConfigGroups]
                      .filter(
                        (i) =>
                          deletedGroups.findIndex((g) => g.key === i.key) < 0 && // not in deleted groups
                          groups.findIndex((g) => g.key === i.key) < 0 // not in provided groups
                      )
                      .concat(groups);
                    setLabelConfigGroups(newGroups);
                  }}
                />
              )}
            </div>
          </div>
        )}
        {pointEnabled && (
          <>
            <div className={styles.styler}>
              <div className={styles.title}>
                {formatMessage({
                  id: `tool.general-image.child.custom.${
                    isDot ? "dot" : "point"
                  }-color.label`,
                })}
              </div>
              <div className={styles.content}>
                <Form.Item name="point_color">
                  <ColorPicker />
                </Form.Item>
                <Divider />
                <Checkbox
                  style={{ height: 32, lineHeight: "32px" }}
                  checked={pointColorChecked}
                  onChange={(e) => setPointColorChecked(e.target.checked)}
                >
                  {formatMessage({
                    id: `tool.general-image.child.custom.${
                      isDot ? "dot" : "point"
                    }-color.check`,
                  })}
                </Checkbox>
                {pointColorChecked && (
                  <div style={{ marginLeft: 24, marginTop: 8 }}>
                    <Radio.Group
                      value={pointColorMode === "index" ? "index" : "item-attr"}
                      onChange={(e) =>
                        handleCheckedMode(
                          e.target.value,
                          StyleNames.POINT_COLOR
                        )
                      }
                    >
                      <Radio
                        value="item-attr"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.${
                            isDot ? "dot" : "point"
                          }-color.attr`,
                        })}
                        {pointColorChecked && pointColorMode !== "index" && (
                          <LabelConfigStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-color.attr.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-color.attr.desc`,
                            })}
                            warningDesc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-color.attr.warning`,
                            })}
                            mode={pointEdgeEnabled ? pointColorMode : undefined}
                            labelConfig={child.label_config}
                            labelConfigPoint={child.label_config_point}
                            stylesMapping={{
                              color: StyleNames.POINT_COLOR,
                            }}
                            styleName={StyleNames.POINT_COLOR}
                            pointLabelConfigGroups={pointLabelConfigGroups}
                            labelConfigGroups={labelConfigGroups}
                            onChange={(
                              groups: Group[],
                              mode: "point-attr" | "item-attr"
                            ) => {
                              onLabelConfigStylerChange(
                                groups,
                                mode,
                                StyleNames.POINT_COLOR,
                                StyleNames.POINTS_COLOR
                              );
                            }}
                          />
                        )}
                      </Radio>
                      <Radio
                        value="index"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.${
                            isDot ? "dot" : "point"
                          }-color.index`,
                        })}
                        {pointColorChecked && pointColorMode === "index" && (
                          <PointEdgeStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-color.index.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-color.index.desc`,
                            })}
                            maxCount={
                              type === Tool.POLYGON
                                ? tool.edges
                                : tool.edges + 1
                            }
                            initialValues={initialValues}
                            tool={tool}
                            styleName={StyleNames.POINTS_COLOR}
                            onChange={(
                              t: GeneralImageOntologyChild["tools"][0]
                            ) => {
                              onPointEdgeStylerChange(
                                t,
                                StyleNames.POINT_COLOR
                              );
                            }}
                          />
                        )}
                      </Radio>
                    </Radio.Group>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.styler}>
              <div className={styles.title}>
                {formatMessage({
                  id: `tool.general-image.child.custom.${
                    isDot ? "dot" : "point"
                  }-type.label`,
                })}
              </div>
              <div className={styles.content}>
                <Form.Item name="point_type">
                  <PointSelector />
                </Form.Item>
                <Divider />
                <Checkbox
                  style={{ height: 32, lineHeight: "32px" }}
                  checked={pointTypeChecked}
                  onChange={(e) => setPointTypeChecked(e.target.checked)}
                >
                  {formatMessage({
                    id: `tool.general-image.child.custom.${
                      isDot ? "dot" : "point"
                    }-type.check`,
                  })}
                </Checkbox>
                {pointTypeChecked && (
                  <div style={{ marginLeft: 24, marginTop: 8 }}>
                    <Radio.Group
                      value={pointTypeMode === "index" ? "index" : "item-attr"}
                      onChange={(e) =>
                        handleCheckedMode(e.target.value, StyleNames.POINT_TYPE)
                      }
                    >
                      <Radio
                        value="item-attr"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.${
                            isDot ? "dot" : "point"
                          }-type.attr`,
                        })}
                        {pointTypeChecked && pointTypeMode !== "index" && (
                          <LabelConfigStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-type.attr.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-type.attr.desc`,
                            })}
                            warningDesc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-type.attr.warning`,
                            })}
                            mode={pointEdgeEnabled ? pointTypeMode : undefined}
                            labelConfig={child.label_config}
                            labelConfigPoint={child.label_config_point}
                            stylesMapping={{
                              pointType: StyleNames.POINT_TYPE,
                            }}
                            styleName={StyleNames.POINT_TYPE}
                            pointLabelConfigGroups={pointLabelConfigGroups}
                            labelConfigGroups={labelConfigGroups}
                            onChange={(
                              groups: Group[],
                              mode: "point-attr" | "item-attr"
                            ) => {
                              onLabelConfigStylerChange(
                                groups,
                                mode,
                                StyleNames.POINT_TYPE,
                                StyleNames.POINTS_TYPE
                              );
                            }}
                          />
                        )}
                      </Radio>
                      <Radio
                        value="index"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.${
                            isDot ? "dot" : "point"
                          }-type.index`,
                        })}
                        {pointTypeChecked && pointTypeMode === "index" && (
                          <PointEdgeStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-type.index.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.${
                                isDot ? "dot" : "point"
                              }-type.index.desc`,
                            })}
                            maxCount={
                              type === Tool.POLYGON
                                ? tool.edges
                                : tool.edges + 1
                            }
                            initialValues={initialValues}
                            tool={tool}
                            styleName={StyleNames.POINTS_TYPE}
                            onChange={(
                              t: GeneralImageOntologyChild["tools"][0]
                            ) => {
                              onPointEdgeStylerChange(t, StyleNames.POINT_TYPE);
                            }}
                          />
                        )}
                      </Radio>
                    </Radio.Group>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {edgeEnabled && (
          <>
            <div className={styles.styler}>
              <div className={styles.title}>
                {formatMessage({
                  id: `tool.general-image.child.custom.edge-color.label`,
                })}
              </div>
              <div className={styles.content}>
                <Form.Item name="edge_color">
                  <ColorPicker />
                </Form.Item>
                <Divider />
                <Checkbox
                  style={{ height: 32, lineHeight: "32px" }}
                  checked={edgeColorChecked}
                  onChange={(e) => setEdgeColorChecked(e.target.checked)}
                >
                  {formatMessage({
                    id: `tool.general-image.child.custom.edge-color.check`,
                  })}
                </Checkbox>
                {edgeColorChecked && (
                  <div style={{ marginLeft: 24, marginTop: 8 }}>
                    <Radio.Group
                      value={edgeColorMode === "index" ? "index" : "item-attr"}
                      onChange={(e) =>
                        handleCheckedMode(e.target.value, StyleNames.EDGE_COLOR)
                      }
                    >
                      <Radio
                        value="item-attr"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.edge-color.attr`,
                        })}
                        {edgeColorChecked && edgeColorMode !== "index" && (
                          <LabelConfigStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.edge-color.attr.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.edge-color.attr.desc`,
                            })}
                            warningDesc={formatMessage({
                              id: `tool.general-image.child.custom.edge-color.attr.warning`,
                            })}
                            mode={pointEdgeEnabled ? edgeColorMode : undefined}
                            labelConfig={child.label_config}
                            labelConfigPoint={child.label_config_point}
                            stylesMapping={{
                              color: StyleNames.EDGE_COLOR,
                            }}
                            styleName={StyleNames.EDGE_COLOR}
                            pointLabelConfigGroups={pointLabelConfigGroups}
                            labelConfigGroups={labelConfigGroups}
                            onChange={(
                              groups: Group[],
                              mode: "point-attr" | "item-attr"
                            ) => {
                              onLabelConfigStylerChange(
                                groups,
                                mode,
                                StyleNames.EDGE_COLOR,
                                StyleNames.EDGES_COLOR
                              );
                            }}
                          />
                        )}
                      </Radio>
                      <Radio
                        value="index"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.edge-color.index`,
                        })}
                        {edgeColorChecked && edgeColorMode === "index" && (
                          <PointEdgeStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.edge-color.index.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.edge-color.index.desc`,
                            })}
                            maxCount={tool.edges}
                            initialValues={initialValues}
                            tool={tool}
                            styleName={StyleNames.EDGES_COLOR}
                            onChange={(
                              t: GeneralImageOntologyChild["tools"][0]
                            ) => {
                              onPointEdgeStylerChange(t, StyleNames.EDGE_COLOR);
                            }}
                          />
                        )}
                      </Radio>
                    </Radio.Group>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.styler}>
              <div className={styles.title}>
                {formatMessage({
                  id: `tool.general-image.child.custom.edge-type.label`,
                })}
              </div>
              <div className={styles.content}>
                <div className={styles.item}>
                  <Form.Item name="edge_type">
                    <EdgeSelector />
                  </Form.Item>
                  <Form.Item
                    name="edge_bold"
                    label={formatMessage({
                      id: "tool.general-image.child.custom.edge-bold",
                    })}
                    valuePropName="checked"
                    style={{ marginLeft: 24 }}
                  >
                    <Switch />
                  </Form.Item>
                </div>
                <Divider />
                <Checkbox
                  style={{ height: 32, lineHeight: "32px" }}
                  checked={edgeTypeChecked}
                  onChange={(e) => setEdgeTypeChecked(e.target.checked)}
                >
                  {formatMessage({
                    id: `tool.general-image.child.custom.edge-type.check`,
                  })}
                </Checkbox>
                {edgeTypeChecked && (
                  <div style={{ marginLeft: 24, marginTop: 8 }}>
                    <Radio.Group
                      value={edgeTypeMode === "index" ? "index" : "item-attr"}
                      onChange={(e) =>
                        handleCheckedMode(e.target.value, StyleNames.EDGE_TYPE)
                      }
                    >
                      <Radio
                        value="item-attr"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.edge-type.attr`,
                        })}
                        {edgeTypeChecked && edgeTypeMode !== "index" && (
                          <LabelConfigStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.edge-type.attr.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.edge-type.attr.desc`,
                            })}
                            warningDesc={formatMessage({
                              id: `tool.general-image.child.custom.edge-type.attr.warning`,
                            })}
                            mode={pointEdgeEnabled ? edgeTypeMode : undefined}
                            labelConfig={child.label_config}
                            labelConfigPoint={child.label_config_point}
                            stylesMapping={{
                              edgeType: StyleNames.EDGE_TYPE,
                              edgeBold: StyleNames.EDGE_BOLD,
                            }}
                            styleName={StyleNames.EDGE_TYPE}
                            pointLabelConfigGroups={pointLabelConfigGroups}
                            labelConfigGroups={labelConfigGroups}
                            onChange={(
                              groups: Group[],
                              mode: "point-attr" | "item-attr"
                            ) => {
                              onLabelConfigStylerChange(
                                groups,
                                mode,
                                StyleNames.EDGE_TYPE,
                                StyleNames.EDGES_TYPE
                              );
                            }}
                          />
                        )}
                      </Radio>
                      <Radio
                        value="index"
                        style={{ display: "block", height: 32 }}
                      >
                        {formatMessage({
                          id: `tool.general-image.child.custom.edge-type.index`,
                        })}
                        {edgeTypeChecked && edgeTypeMode === "index" && (
                          <PointEdgeStyler
                            title={formatMessage({
                              id: `tool.general-image.child.custom.edge-type.index.title`,
                            })}
                            desc={formatMessage({
                              id: `tool.general-image.child.custom.edge-type.index.desc`,
                            })}
                            maxCount={tool.edges}
                            initialValues={initialValues}
                            tool={tool}
                            styleName={StyleNames.EDGES_TYPE}
                            onChange={(
                              t: GeneralImageOntologyChild["tools"][0]
                            ) => {
                              onPointEdgeStylerChange(t, StyleNames.EDGE_TYPE);
                            }}
                          />
                        )}
                      </Radio>
                    </Radio.Group>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div className={styles["styler-btns"]}>
          <div>
            <Button
              type="link"
              danger
              style={{ padding: 0 }}
              onClick={handleReset}
            >
              {formatMessage({ id: "tool.general-image.child.custom.reset" })}
            </Button>
          </div>
          <div>
            <Button style={{ marginRight: 12 }} onClick={onCancel}>
              {formatMessage({ id: "common.cancel" })}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {formatMessage({ id: "common.save" })}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default CustomStyler;
