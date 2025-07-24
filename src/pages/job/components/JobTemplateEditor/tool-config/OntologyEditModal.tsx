import {
  Button,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Row,
  Col,
  Select,
} from "antd";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import type { ChangeEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import type { ColorResult } from "react-color";
import { CompactPicker } from "react-color";
import randomColor from "randomcolor";
import { useIntl } from "@umijs/max";
import { nanoid } from "nanoid";
import type { Ontology } from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor";
import styles from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditModal.less";
import { isOntologyNameValid } from "@/pages/job/components/JobTemplateEditor/tool-config/utils";
import TinymceEditor from "@/components/TinymceEditor";

type Props = {
  ontology: Ontology | null;
  visible: boolean;
  onOk: (ontology: Ontology) => void;
  onCancel: () => void;
  colorEnabled?: boolean;
  descriptionEnabled?: boolean;
  descriptionType?: "text" | "richtext";
  sizeEnabled?: boolean;
  limitsEnabled?: boolean;
  validate: (ontology: Ontology) => boolean;
};

enum SizeValidateType {
  THRESHOLD = "threshold",
  BOUNDARY = "boundary",
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

const getDefaultSizeFromOntology = ({ default_size }: Ontology) => ({
  length: default_size?.length || 4,
  width: default_size?.width || 2,
  height: default_size?.height || 2,
  threshold: default_size?.threshold || -1,
  minWidth: default_size?.minWidth || -1,
  maxWidth: default_size?.maxWidth || -1,
  minHeight: default_size?.minHeight || -1,
  maxHeight: default_size?.maxHeight || -1,
  minLength: default_size?.minLength || -1,
  maxLength: default_size?.maxLength || -1,
});

const allShapes = ["polygon", "rectangle", "line", "dot"];

function OntologyEditModal({
  ontology: defaultOntology,
  visible,
  onOk,
  onCancel,
  colorEnabled = true,
  descriptionEnabled = true,
  descriptionType = "text",
  sizeEnabled = false,
  limitsEnabled = false,
  validate,
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [className, setClassName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayColor, setDisplayColor] = useState("");
  const [description, setDescription] = useState("");
  const [defaultSize, setDefaultSize] = useState<Ontology["default_size"]>({
    width: 2,
    height: 2,
    length: 4,
  });
  const [sizeValidate, setSizeValidate] = useState(false);
  const [sizeValidateType, setSizeValidateType] = useState<SizeValidateType>(
    SizeValidateType.BOUNDARY
  );
  const [limits, setLimits] = useState<Ontology["limits"]>([]);
  const [limitsValidate, setLimitsValidate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (defaultOntology) {
      setClassName(defaultOntology.class_name);
      setDisplayName(defaultOntology.display_name);
      if (colorEnabled) {
        setDisplayColor(defaultOntology.display_color || randomColor());
      }
      if (descriptionEnabled) {
        setDescription(defaultOntology.description || "");
      }
      if (sizeEnabled) {
        setDefaultSize(
          defaultOntology.default_size || { width: 2, height: 2, length: 4 }
        );
        if (defaultOntology.default_size?.threshold >= 0) {
          setSizeValidate(true);
          setSizeValidateType(SizeValidateType.THRESHOLD);
        } else if (
          defaultOntology.default_size?.minWidth >= 0 ||
          defaultOntology.default_size?.maxWidth >= 0 ||
          defaultOntology.default_size?.minHeight >= 0 ||
          defaultOntology.default_size?.maxHeight >= 0 ||
          defaultOntology.default_size?.minLength >= 0 ||
          defaultOntology.default_size?.maxLength >= 0
        ) {
          setSizeValidate(true);
          setSizeValidateType(SizeValidateType.BOUNDARY);
        } else {
          setSizeValidate(false);
          setSizeValidateType(SizeValidateType.BOUNDARY);
        }
      }
      if (limitsEnabled) {
        setLimits(defaultOntology.limits || []);
        setLimitsValidate(
          defaultOntology.limits && defaultOntology.limits.length > 0
        );
      }
    }
  }, [
    defaultOntology,
    colorEnabled,
    descriptionEnabled,
    sizeEnabled,
    limitsEnabled,
  ]);

  useEffect(() => {
    const size = getDefaultSizeFromOntology(
      defaultOntology || ({} as Ontology)
    );
    const newSize = {
      width: defaultSize.width,
      height: defaultSize.height,
      length: defaultSize.length,
      threshold: -1,
      minWidth: -1,
      maxWidth: -1,
      minHeight: -1,
      maxHeight: -1,
      minLength: -1,
      maxLength: -1,
    };
    if (sizeValidate && sizeValidateType === SizeValidateType.THRESHOLD) {
      newSize.threshold = size.threshold > 0 ? size.threshold : 1;
    } else if (sizeValidate && sizeValidateType === SizeValidateType.BOUNDARY) {
      [
        "minWidth",
        "maxWidth",
        "minHeight",
        "maxHeight",
        "minLength",
        "maxLength",
      ].forEach((property) => {
        if (size[property] > 0) {
          newSize[property] = size[property];
        }
      });
    }
    setDefaultSize(newSize);
    // eslint-disable-next-line
  }, [sizeValidate, sizeValidateType]);

  const handleOk = () => {
    if (!isOntologyNameValid(className)) {
      setErrorMessage(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.title.class-error",
        })
      );
      return;
    }

    const newOntology = {
      key: defaultOntology?.key,
      class_name: className,
      display_name: displayName,
      ...(colorEnabled && { display_color: displayColor }),
      ...(descriptionEnabled && { description }),
      ...(sizeEnabled && { default_size: defaultSize }),
      ...(limitsEnabled && limitsValidate && limits.length > 0 && { limits }),
    };
    if (!validate(newOntology)) {
      setErrorMessage(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.title.class-duplicate",
        })
      );
      return;
    }

    onOk(newOntology);
  };

  const handleCancel = () => {
    setColorPickerVisible(false);
    setErrorMessage("");
    onCancel();
  };

  const showColorPicker = (e: MouseEvent) => {
    e.preventDefault();
    setColorPickerVisible(!colorPickerVisible);
  };

  const handleColorPickComplete = (color: ColorResult) => {
    setDisplayColor(color.hex);
    // setColorPickerVisible(false);
  };

  const handleClassNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setClassName(e.target.value);
    setErrorMessage("");
  };

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDisplayName(e.target.value);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDescription(e.target.value);
  };

  const handleSizeChange = (key: string, value: number) => {
    const newSize = { ...defaultSize, [key]: value };
    if (sizeValidate && sizeValidateType === SizeValidateType.BOUNDARY) {
      if (newSize.minWidth > newSize.width) {
        newSize.minWidth = newSize.width;
      }
      if (newSize.maxWidth < newSize.width) {
        newSize.maxWidth = newSize.width;
      }
      if (newSize.minHeight > newSize.height) {
        newSize.minHeight = newSize.height;
      }
      if (newSize.maxHeight < newSize.height) {
        newSize.maxHeight = newSize.height;
      }
      if (newSize.minLength > newSize.length) {
        newSize.minLength = newSize.length;
      }
      if (newSize.maxLength < newSize.length) {
        newSize.maxLength = newSize.length;
      }
    }
    setDefaultSize(newSize);
  };

  const handleLimitAdd = () => {
    const availableShapes = allShapes.filter(
      (shape) => limits.findIndex((l) => l.shapeType === shape) < 0
    );
    if (availableShapes.length > 0) {
      const shapeType =
        availableShapes[0] as Ontology["limits"][0]["shapeType"];
      const initialLimit: Ontology["limits"][0] = {
        shapeType,
        operator: "ge",
        count: 0,
      };
      setLimits([...limits, initialLimit]);
    }
  };

  const handleLimitChange = (
    index: number,
    newLimit: Ontology["limits"][0]
  ) => {
    const newLimits = [...limits];
    newLimits[index] = { ...newLimit };
    setLimits(newLimits);
  };

  const handleLimitDelete = (index: number) => {
    const newLimits = [...limits];
    newLimits.splice(index, 1);
    setLimits(newLimits);
  };

  const renderSizeInput = (key: string) => {
    let min = key === "threshold" ? 0 : 0.01;
    let max;
    const precision = key === "threshold" ? 0 : 2;
    const unit = key === "threshold" ? "%" : "m";
    const times = key === "threshold" ? 100 : 1;
    if (key.startsWith("min")) {
      max = defaultSize[key.slice(3).toLowerCase()];
    }
    if (key.startsWith("max")) {
      min = defaultSize[key.slice(3).toLowerCase()];
    }
    return (
      <InputNumber
        min={min}
        max={max}
        precision={precision}
        formatter={(v) => `${v}${unit}`}
        parser={(v) => v.replace(unit, "").trim()}
        value={defaultSize[key] * times}
        onChange={(v) => {
          if (!v) return;
          const numValue = parseFloat(v.toString());
          if (Number.isNaN(numValue)) return;
          handleSizeChange(key, numValue / times);
        }}
      />
    );
  };

  const renderLimit = (index: number) => {
    const { shapeType, operator, count } = limits[index];
    return (
      <Row key={shapeType} gutter={8}>
        <Col span={8}>
          <Select
            value={shapeType}
            onChange={(v: Ontology["limits"][0]["shapeType"]) =>
              handleLimitChange(index, { ...limits[index], shapeType: v })
            }
          >
            {allShapes.map((shape) => (
              <Select.Option
                key={shape}
                value={shape}
                disabled={
                  shapeType !== shape &&
                  limits.findIndex((l) => l.shapeType === shape) >= 0
                }
              >
                {shape}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            value={operator}
            onChange={(v: Ontology["limits"][0]["operator"]) =>
              handleLimitChange(index, { ...limits[index], operator: v })
            }
          >
            <Select.Option value="eq">＝</Select.Option>
            <Select.Option value="ne">≠</Select.Option>
            <Select.Option value="gt">＞</Select.Option>
            <Select.Option value="ge">≥</Select.Option>
            <Select.Option value="lt">＜</Select.Option>
            <Select.Option value="le">≤</Select.Option>
          </Select>
        </Col>
        <Col span={6}>
          <InputNumber
            style={{ width: "100%" }}
            value={count}
            min={0}
            precision={0}
            onChange={(v) =>
              handleLimitChange(index, { ...limits[index], count: v })
            }
          />
        </Col>
        <Col span={4}>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleLimitDelete(index)}
          />
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={formatMessage({
        id: "labeling-job-create.wizard.configuration.ontology.title",
      })}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      width={720}
      wrapClassName={styles.modal}
      destroyOnClose
      okText={formatMessage({ id: "common.confirm" })}
    >
      <Form {...formItemLayout}>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.title.class",
          })}
          {...(errorMessage && {
            validateStatus: "error",
            help: errorMessage,
          })}
        >
          <Input value={className} onChange={handleClassNameChange} />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.title.label",
          })}
        >
          <Input value={displayName} onChange={handleDisplayNameChange} />
        </Form.Item>
        {colorEnabled && (
          <Form.Item
            label={formatMessage({
              id: "labeling-job-create.wizard.configuration.ontology.editor.color",
            })}
          >
            <Dropdown
              trigger={["click"]}
              overlay={() => (
                <CompactPicker
                  styles={{ default: { compact: { width: 280 } } }}
                  color={displayColor}
                  onChangeComplete={handleColorPickComplete}
                />
              )}
              visible={colorPickerVisible}
            >
              <Button onClick={showColorPicker}>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    backgroundColor: displayColor,
                    margin: 2,
                  }}
                />
              </Button>
            </Dropdown>
          </Form.Item>
        )}
        {descriptionEnabled && (
          <Form.Item
            label={formatMessage({
              id: "labeling-job-create.wizard.configuration.ontology.editor.description",
            })}
          >
            {descriptionType === "text" ? (
              <Input.TextArea
                value={description}
                onChange={handleDescriptionChange}
              />
            ) : (
              <TinymceEditor
                value={description}
                onChange={setDescription}
                imageApi="/job/resource/upload"
                formData={{ jobId: `ontology-${nanoid()}` }}
              />
            )}
          </Form.Item>
        )}
        {sizeEnabled && (
          <>
            <Form.Item
              label={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.editor.default-size",
              })}
            >
              {["length", "width", "height"].map((i) => (
                <div key={i} style={{ display: "inline-block" }}>
                  {renderSizeInput(i)}
                  <span style={{ marginLeft: 8, marginRight: 24 }}>
                    {i[0].toUpperCase()}
                  </span>
                </div>
              ))}
            </Form.Item>
          </>
        )}
        {limitsEnabled && (
          <Form.Item
            label={formatMessage({
              id: "labeling-job-create.wizard.configuration.ontology.editor.limits",
            })}
          >
            <Switch
              checkedChildren={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.editor.validate.on",
              })}
              unCheckedChildren={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.editor.validate.off",
              })}
              checked={limitsValidate}
              onChange={setLimitsValidate}
            />
            {limitsValidate && (
              <div>
                {limits.map((_, index) => renderLimit(index))}
                {limits.length < 4 && (
                  <Button
                    type="link"
                    icon={<PlusCircleOutlined />}
                    onClick={handleLimitAdd}
                  />
                )}
              </div>
            )}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default OntologyEditModal;
