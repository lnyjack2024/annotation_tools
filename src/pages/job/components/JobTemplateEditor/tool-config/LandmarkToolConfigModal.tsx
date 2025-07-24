import { useEffect, useState, useRef } from "react";
import { useIntl } from "@umijs/max";
import {
  Button,
  Row,
  Col,
  Input,
  InputNumber,
  Form,
  Modal,
  message,
  Select,
  Dropdown,
  Switch,
} from "antd";
import { CompactPicker } from "react-color";
import type { ColorResult } from "react-color";
import type { OntologyChild, Line, Ontology } from "./LandmarkToolConfig";
import { isOntologyNameValid } from "./utils";
import styles from "./LandmarkToolConfigModal.less";
import ImageUploader from "@/pages/bpo/components/ImageUploader";
import pictureSvg from "@/assets/icons/picture.svg";
import pictureNoneSvg from "@/assets/icons/picture_none.svg";
import pictureRightSvg from "@/assets/icons/picture_right.svg";
import { EDITOR_IMG_UPLOAD_API } from "@/utils";

const { Option } = Select;

export interface Category {
  name: string;
  range: number[];
  keys: number[];
  reference?: string;
  isConnect: boolean;
  displayColor: string;
}

export interface Shape {
  // for plss
  shapeType: "rectangle";
  count: number;
}

interface CategoryProps {
  categories: Category[];
  category?: Category;
  editable?: boolean;
  isAdding?: boolean;
  referenceUrl?: string;
  setIsEditing: (flag: boolean) => void;
  handleVisibleUpload?: (flag: boolean) => void;
  setReferenceUrl: (url?: string) => void;
  resetFields?: (fields?: any) => void;
  onCancel?: () => void;
  onSave: (categories: Category[]) => void;
}

interface LinesConfigProps {
  lines: Line[];
  formatMessage: (data: any) => string;
  setFieldsValue: (fields?: any) => void;
  getFieldsValue: () => any;
}

export enum LandmarkEditType {
  KEYPOINT = "keypoint",
  RECTANGLE = "rectangle",
}

interface Props {
  editItem: Ontology;
  editGroup: OntologyChild;
  visible: boolean;
  onOk: (item: OntologyChild, key: string) => void;
  onCancel: () => void;
}

function isPositiveNumber(numStr: string) {
  return /^[1-9]\d*|0$/.test(numStr.trim());
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 18 },
    sm: { span: 12 },
  },
};
const formItemLayoutVertical = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 24 },
  },
};

const style = {
  padding: 4,
  background: "#dedede",
  borderRadius: 4,
  fontSize: 12,
  marginRight: 4,
};

function LandmarkToolConfigModal({
  editItem,
  editGroup,
  visible,
  onOk,
  onCancel,
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [categories, setCategories] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState(undefined);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [lines, setLines] = useState([]);

  const [form] = Form.useForm();
  const { resetFields, validateFields, setFieldsValue, getFieldsValue } = form;

  const toolOptions = [
    {
      label: formatMessage({
        id: "labeling-job-create.wizard.configuration.landmark.group.tool.option1",
      }),
      value: LandmarkEditType.KEYPOINT,
    },
    {
      label: formatMessage({
        id: "labeling-job-create.wizard.configuration.landmark.group.tool.option2",
      }),
      value: LandmarkEditType.RECTANGLE,
    },
  ];

  const groupNameValidator = (
    rule: any,
    value: string,
    callback: (error?: string) => void
  ) => {
    if (
      value &&
      editItem &&
      editItem.children.find((v) => editGroup.key !== v.key && v.name === value)
    ) {
      callback(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.landmark.group.duplicate-error",
        })
      );
    } else {
      callback();
    }
  };

  useEffect(() => {
    if (form && editGroup) {
      setCategories(editGroup.categories || []);
      setLines(editGroup.lines || []);
      setFieldsValue({
        categories: editGroup.categories || [],
        name: editGroup.name,
        display_name: editGroup.display_name,
        type: editGroup.type,
        reference: editGroup.reference,
        count: editGroup.count,
      });
      setReferenceUrl(editGroup.reference);
    } else {
      setCategories([]);
      setLines([]);
      form.resetFields();
    }
  }, [editGroup, form, setFieldsValue]);

  const handleSave = (list: Category[] | Shape[]) => {
    setCategories(list);
    resetFields(["categories"]);
    setIsAdding(false);
    setReferenceUrl(undefined);
  };

  const handleSubmit = () => {
    resetFields(["categories"]);
    validateFields()
      .then((values) => {
        if (isAdding) {
          message.warning(
            formatMessage({
              id: "labeling-job-create.wizard.configuration.landmark.group.complete-error",
            })
          );
        } else {
          onOk(
            {
              ...values,
              key: editGroup.key,
              label_config: editGroup.label_config,
              point_label_config: editGroup.point_label_config,
            },
            editItem && editItem.key
          );
        }
      })
      .catch(({ errorFields }: any) => {
        errorFields.forEach(({ name }: any) => {
          if (Array.isArray(name)) {
            if ((name as string[]).find((key) => key === "categories")) {
              message.error(
                formatMessage({
                  id: "labeling-job-create.wizard.configuration.landmark.group.groups.required",
                })
              );
            }
          }
        });
      });
  };

  const handleVisibleUpload = (flag: boolean) => {
    setUploadVisible(flag);
  };

  return (
    <Modal
      title={formatMessage({
        id: "labeling-job-create.wizard.configuration.landmark.group.editor-title",
      })}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      maskClosable={false}
      width={950}
      wrapClassName={styles["landmark-modal"]}
      okText={formatMessage({ id: "common.confirm" })}
      destroyOnClose
    >
      <Form
        {...formItemLayout}
        layout="vertical"
        form={form}
        initialValues={{
          categories,
        }}
      >
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.landmark.group.title",
          })}
          name="name"
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "labeling-job-create.wizard.configuration.landmark.group.title.required",
              }),
            },
            {
              validator: groupNameValidator,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.landmark.group.label",
          })}
          name="display_name"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "labeling-job-create.wizard.configuration.landmark.group.tool",
          })}
          name="type"
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "labeling-job-create.wizard.configuration.landmark.group.tool.required",
              }),
            },
          ]}
          initialValue={LandmarkEditType.KEYPOINT}
        >
          <Select>
            {toolOptions.map((v) => (
              <Option key={v.value} value={v.value}>
                {v.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          className="clearStyle"
          noStyle
          shouldUpdate={(prevValues, curValues) =>
            prevValues.type !== curValues.type
          }
          {...formItemLayoutVertical}
        >
          {({ getFieldValue }) => {
            if (getFieldValue("type") === LandmarkEditType.RECTANGLE) {
              return (
                <>
                  <Form.Item
                    label={formatMessage({
                      id: "labeling-job-create.wizard.configuration.landmark.group.reference",
                    })}
                    name="reference"
                  >
                    <ImageUploader
                      initialImgUrl={referenceUrl}
                      accept=".png,.jpg,.jpeg,.bmp"
                      onFinish={(file) => {
                        form.setFieldsValue({ reference: file.response.data });
                      }}
                      iconMessage={formatMessage({
                        id: "common.upload",
                      })}
                      onClear={() => {
                        form.setFieldsValue({ reference: undefined });
                      }}
                      method="post"
                      uploadUrl={EDITOR_IMG_UPLOAD_API}
                    />
                  </Form.Item>
                  <Form.Item
                    label={formatMessage({
                      id: "labeling-job-create.wizard.configuration.landmark.group.count",
                    })}
                    name="count"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} max={1} />
                  </Form.Item>
                </>
              );
            }
            return (
              <>
                <Form.Item
                  className="clearStyle"
                  label={formatMessage({
                    id: "labeling-job-create.wizard.configuration.landmark.group.groups",
                  })}
                  noStyle
                  name="categories"
                  rules={[{ required: true }]}
                >
                  <div>
                    <div className="ant-col ant-form-item-label ant-col-xs-24 ant-col-sm-24">
                      <label className="ant-form-item-required">
                        {formatMessage({
                          id: "labeling-job-create.wizard.configuration.landmark.group.groups",
                        })}
                      </label>
                    </div>
                    <div className="modal-list" style={{ textAlign: "center" }}>
                      <Row gutter={8} style={{ marginBottom: 8 }}>
                        <Col span={3}>
                          {formatMessage({
                            id: "job-detail.uncommitted-task.column.contributor",
                          })}
                        </Col>
                        <Col span={6}>
                          {formatMessage({
                            id: "labeling-job-create.wizard.configuration.ontology.landmark.rang",
                          })}
                        </Col>
                        <Col span={6}>
                          {formatMessage({
                            id: "labeling-job-create.wizard.configuration.ontology.landmark.keys",
                          })}
                        </Col>
                        <Col span={3}>
                          {formatMessage({
                            id: "labeling-job-create.wizard.configuration.ontology.landmark.isConnect",
                          })}
                        </Col>
                        <Col span={2}>
                          {formatMessage({
                            id: "labeling-job-create.wizard.configuration.ontology.landmark.connection.color",
                          })}
                        </Col>
                        <Col span={4} />
                      </Row>
                      {categories.map((category) => (
                        <LandmarkCategory
                          isAdding={isAdding}
                          key={category.name}
                          referenceUrl={referenceUrl}
                          categories={categories}
                          category={category}
                          handleVisibleUpload={handleVisibleUpload}
                          setReferenceUrl={setReferenceUrl}
                          resetFields={resetFields}
                          onSave={handleSave}
                          setIsEditing={setIsEditing}
                        />
                      ))}
                    </div>
                    <div className="modal-edit">
                      {isAdding ? (
                        <LandmarkCategory
                          editable
                          referenceUrl={referenceUrl}
                          categories={categories}
                          setIsEditing={setIsEditing}
                          resetFields={resetFields}
                          setReferenceUrl={setReferenceUrl}
                          handleVisibleUpload={handleVisibleUpload}
                          onCancel={() => setIsAdding(false)}
                          onSave={handleSave}
                        />
                      ) : (
                        !isEditing && (
                          <Button
                            block
                            type="dashed"
                            style={{ marginBottom: "24px" }}
                            onClick={() => setIsAdding(true)}
                          >
                            {formatMessage({
                              id: "labeling-job-create.wizard.configuration.ontology.group.editor.add",
                            })}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </Form.Item>
                <div>
                  <div className="ant-col ant-form-item-label ant-col-xs-24 ant-col-sm-24">
                    <label>
                      {formatMessage({
                        id: "labeling-job-create.wizard.configuration.landmark.group.connections",
                      })}
                      {formatMessage({
                        id: "labeling-job-create.wizard.configuration.landmark.group.connections.tip",
                      })}
                    </label>
                  </div>
                  <LinesConfig
                    lines={lines}
                    setFieldsValue={setFieldsValue}
                    formatMessage={formatMessage}
                    getFieldsValue={getFieldsValue}
                  />
                </div>
              </>
            );
          }}
        </Form.Item>
      </Form>
      <Modal
        visible={uploadVisible}
        onOk={() => {
          setUploadVisible(false);
        }}
        onCancel={() => {
          setUploadVisible(false);
        }}
        maskClosable={false}
        width={400}
        destroyOnClose
        okText={formatMessage({ id: "common.confirm" })}
      >
        <ImageUploader
          initialImgUrl={referenceUrl}
          accept=".png,.jpg,.jpeg,.bmp"
          onFinish={(file) => {
            setReferenceUrl(file.response.data);
          }}
          iconMessage={formatMessage({
            id: "common.upload",
          })}
          onClear={() => {
            setReferenceUrl(undefined);
          }}
          method="post"
          uploadUrl={EDITOR_IMG_UPLOAD_API}
        />
      </Modal>
    </Modal>
  );
}

function LinesConfig({
  lines: deafultLines,
  formatMessage,
  setFieldsValue,
  getFieldsValue,
}: LinesConfigProps) {
  const [pickerColorVisible, setColorPickerVisible] = useState<number | null>();
  const [lines, setLines] = useState([]);

  useEffect(() => {
    setFieldsValue({
      lines: deafultLines,
    });
    setLines(deafultLines);
  }, [deafultLines, setFieldsValue]);

  const addLine = () => {
    const values = getFieldsValue();
    const newLines = values.lines ? [...values.lines] : [];
    newLines.push({
      points: ["", ""],
      color: "#5cdef0",
    });
    setLines(newLines);
    setFieldsValue({
      lines: newLines,
    });
  };

  const editLine = (color: string, idx: number) => {
    const values = getFieldsValue();
    const newLines = values.lines ? [...values.lines] : [];
    newLines[idx].color = color;
    setLines(newLines);
    setFieldsValue({
      lines: newLines,
    });
  };

  const deleteLine = (n: number) => {
    const newLines = [...lines];
    newLines.splice(n, 1);
    setLines(newLines);
  };

  const handleColorPickComplete = (color: ColorResult, idx: number) => {
    editLine(color.hex, idx);
    setColorPickerVisible(null);
  };

  const pointIndexValidator = (otherIndex: number) => {
    return (rule: any, value: number, callback: (error?: string) => void) => {
      if (value === otherIndex) {
        callback(
          formatMessage({
            id: "labeling-job-create.wizard.configuration.landmark.group.connections.points",
          })
        );
      } else {
        callback();
      }
    };
  };

  return (
    <Row gutter={10} style={{ marginBottom: "20px" }}>
      {lines.map((line, idx) => (
        <Col span={8}>
          <Form.Item
            className="clearStyle"
            noStyle
            shouldUpdate={true}
            {...formItemLayoutVertical}
          >
            {({ getFieldValue }) => {
              return (
                <Row gutter={10}>
                  <Col span={6}>
                    <Form.Item
                      {...formItemLayoutVertical}
                      name={["lines", idx, "points", 0]}
                      rules={[
                        {
                          required: true,
                          message: formatMessage({
                            id: "labeling-job-create.wizard.configuration.landmark.group.connections.required",
                          }),
                        },
                        {
                          validator: pointIndexValidator(
                            getFieldValue(["lines", idx, "points", 1])
                          ),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...formItemLayoutVertical}
                      name={["lines", idx, "points", 1]}
                      rules={[
                        {
                          required: true,
                          message: formatMessage({
                            id: "labeling-job-create.wizard.configuration.landmark.group.connections.required",
                          }),
                        },
                        {
                          validator: pointIndexValidator(
                            getFieldValue(["lines", idx, "points", 0])
                          ),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name={["lines", idx, "color"]}>
                      <Dropdown
                        trigger={["click"]}
                        overlay={() => (
                          <CompactPicker
                            color={line.color}
                            onChangeComplete={(color) => {
                              handleColorPickComplete(color, idx);
                            }}
                          />
                        )}
                        visible={pickerColorVisible === idx}
                      >
                        <Button
                          onClick={() => {
                            setColorPickerVisible(idx);
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 12,
                              height: 12,
                              backgroundColor: line.color,
                              margin: 2,
                            }}
                          />
                        </Button>
                      </Dropdown>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Button
                      style={{
                        height: "auto",
                        padding: "4px 0 0 0",
                        color: "#df3636",
                      }}
                      type="link"
                      onClick={() => deleteLine(idx)}
                    >
                      {formatMessage({ id: "common.delete" })}
                    </Button>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>
        </Col>
      ))}
      <Col>
        <Button block type="dashed" onClick={addLine}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.landmark.group.connections.add",
          })}
        </Button>
      </Col>
    </Row>
  );
}

function LandmarkCategory({
  categories,
  category: originCategory,
  editable = false,
  isAdding = false,
  referenceUrl,
  setIsEditing,
  handleVisibleUpload,
  setReferenceUrl,
  resetFields,
  onCancel,
  onSave,
}: CategoryProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const nameInput = useRef(null);
  const rangeStartInput = useRef(null);
  const rangeEndInput = useRef(null);
  const keysInput = useRef(null);
  const key = originCategory?.name || "new-category";
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(editable);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [keys, setKeys] = useState("");
  const [isConnect, setIsConnect] = useState(true);
  const [displayColor, setDisplayColor] = useState(
    originCategory?.displayColor || "#5cdef0"
  );
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    setError({ ...error, name: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    setError({ ...error, range: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    setError({ ...error, keys: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  const handleCancel = () => {
    setEditing(false);
    setIsEditing(false);
    setName("");
    setRangeStart("");
    setRangeEnd("");
    setKeys("");
    setIsConnect(true);
    resetFields(["categories"]);
    setColorPickerVisible(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setIsEditing(true);
    setName(originCategory.name);
    setRangeStart(originCategory.range[0].toString());
    setRangeEnd(originCategory.range[1].toString());
    setKeys(originCategory.keys.join(","));
    setReferenceUrl(originCategory.reference);
    setIsConnect(
      originCategory.isConnect !== undefined ? originCategory.isConnect : true
    );
    setDisplayColor(originCategory.displayColor || "#5cdef0");
  };

  const handleDelete = () => {
    const index = categories.findIndex((c) => c.name === originCategory?.name);
    const newCategories =
      index < 0
        ? [...categories]
        : [...categories.slice(0, index), ...categories.slice(index + 1)];
    onSave(newCategories);
  };

  const handleColorPickComplete = (color: ColorResult) => {
    setDisplayColor(color.hex);
    setColorPickerVisible(null);
  };

  const handleSave = () => {
    const index = categories.findIndex((c) => c.name === originCategory?.name);

    const newRange: number[] = [];
    const newKeys: number[] = [];
    const allErrors: Record<string, string> = {};
    if (!isOntologyNameValid(name)) {
      allErrors.name = formatMessage({
        id: "labeling-job-create.wizard.configuration.ontology.title.class-error",
      });
    } else if (
      categories.find((c, i) => i !== index && c.name === name.trim())
    ) {
      allErrors.name = formatMessage({
        id: "labeling-job-create.wizard.configuration.ontology.landmark.name.exist",
      });
    }
    if (!rangeStart || !rangeEnd) {
      allErrors.range = formatMessage({
        id: "labeling-job-create.wizard.configuration.ontology.landmark.range.empty",
      });
    } else {
      if (isPositiveNumber(rangeStart) && isPositiveNumber(rangeEnd)) {
        const min = parseInt(rangeStart, 10);
        const max = parseInt(rangeEnd, 10);
        if (
          !Number.isNaN(min) &&
          !Number.isNaN(max) &&
          min >= 0 &&
          max >= min &&
          categories.every(
            (c, i) => i === index || min > c.range[1] || max < c.range[0]
          )
        ) {
          newRange.push(min);
          newRange.push(max);
        }
      }
      if (newRange.length < 2) {
        allErrors.range = formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.landmark.range.error",
        });
      }
    }
    if (keys) {
      const splits = keys.split(",");
      if (
        splits.some((i) => {
          if (isPositiveNumber(i)) {
            const num = parseInt(i, 10);
            return (
              Number.isNaN(num) ||
              (newRange.length === 2 &&
                (num < newRange[0] || num > newRange[1]))
            );
          }
          return true;
        })
      ) {
        allErrors.keys = formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.landmark.keys.error",
        });
      } else {
        splits.forEach((i) => newKeys.push(parseInt(i, 10)));
      }
    }

    if (Object.keys(allErrors).length > 0) {
      setError(allErrors);
      return;
    }

    const newCategory: Category = {
      name,
      range: newRange,
      keys: newKeys,
      reference: referenceUrl,
      isConnect,
      displayColor,
    };
    const newCategories =
      index < 0
        ? [...categories, newCategory]
        : [
            ...categories.slice(0, index),
            newCategory,
            ...categories.slice(index + 1),
          ];
    onSave(newCategories);

    handleCancel();
  };

  return (
    <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
      <Col span={3}>
        {!editing ? (
          originCategory?.name
        ) : (
          <Form.Item
            {...(error.name && {
              validateStatus: "error",
              help: error.name,
            })}
            {...formItemLayoutVertical}
          >
            <Input
              ref={nameInput}
              placeholder={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.landmark.name.placeholder",
              })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={() => rangeStartInput.current.focus()}
            />
          </Form.Item>
        )}
      </Col>
      <Col span={6}>
        {!editing ? (
          <>{originCategory?.range.join("-")}</>
        ) : (
          <Form.Item
            {...(error.range && {
              validateStatus: "error",
              help: error.range,
            })}
            {...formItemLayoutVertical}
          >
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <Input
                ref={rangeStartInput}
                placeholder={formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.landmark.rang.start.placeholder",
                })}
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                onPressEnter={() => rangeEndInput.current.focus()}
              />
              <span style={{ margin: "0 4px" }}>-</span>
              <Input
                ref={rangeEndInput}
                placeholder={formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.landmark.rang.end.placeholder",
                })}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                onPressEnter={() => keysInput.current.focus()}
              />
            </div>
          </Form.Item>
        )}
      </Col>
      <Col span={6}>
        {!editing ? (
          <>{originCategory?.keys.join(",")}</>
        ) : (
          <Form.Item
            {...(error.keys && {
              validateStatus: "error",
              help: error.keys,
            })}
            {...formItemLayoutVertical}
          >
            <Input
              ref={keysInput}
              placeholder={formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.landmark.keys.placeholder",
              })}
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              onPressEnter={handleSave}
            />
          </Form.Item>
        )}
      </Col>
      <Col span={3}>
        {!editing ? (
          <>
            <span style={style}>
              {formatMessage({
                id:
                  originCategory && originCategory.isConnect === false
                    ? "labeling-job-create.wizard.configuration.ontology.landmark.notconnected"
                    : "labeling-job-create.wizard.configuration.ontology.landmark.connected",
              })}
            </span>
          </>
        ) : (
          <Form.Item {...formItemLayoutVertical}>
            <Switch checked={isConnect} onChange={setIsConnect} />
          </Form.Item>
        )}
      </Col>
      <Col span={2}>
        {!editing ? (
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              backgroundColor: displayColor,
              margin: "6px 2px",
            }}
          />
        ) : (
          <Form.Item {...formItemLayoutVertical}>
            <Dropdown
              trigger={["click"]}
              overlay={() => (
                <CompactPicker
                  color={displayColor}
                  onChangeComplete={handleColorPickComplete}
                />
              )}
              visible={colorPickerVisible}
            >
              <Button
                onClick={() => {
                  setColorPickerVisible(true);
                }}
              >
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
      </Col>
      <Col span={4}>
        {!editing ? (
          !isAdding && (
            <>
              <span style={{ marginRight: "8px" }}>
                <img
                  src={
                    originCategory.reference ? pictureRightSvg : pictureNoneSvg
                  }
                  className="icon"
                />
              </span>
              <Button
                style={{ height: "auto", padding: 0, marginRight: 8 }}
                type="link"
                onClick={handleEdit}
              >
                {formatMessage({ id: "common.edit" })}
              </Button>
              <Button
                style={{ height: "auto", padding: 0, color: "#df3636" }}
                type="link"
                onClick={handleDelete}
              >
                {formatMessage({ id: "common.delete" })}
              </Button>
            </>
          )
        ) : (
          <>
            <Button
              style={{ padding: 0, marginRight: 8 }}
              type="link"
              onClick={() => {
                handleVisibleUpload(true);
              }}
            >
              <img src={pictureSvg} className="icon" />
            </Button>
            <Button
              style={{ padding: 0, marginRight: 8 }}
              type="link"
              onClick={handleSave}
            >
              {formatMessage({ id: "common.save" })}
            </Button>
            <Button style={{ padding: 0 }} type="link" onClick={handleCancel}>
              {formatMessage({ id: "common.cancel" })}
            </Button>
          </>
        )}
      </Col>
    </Row>
  );
}

export default LandmarkToolConfigModal;
