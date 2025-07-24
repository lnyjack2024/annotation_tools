import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Modal, Row, Col } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import styles from "./LidarSizesAttribute.less";

interface Size {
  id?: string;
  label: string;
  width: number;
  height: number;
  length: number;
}

export interface SizeGroup {
  id?: string;
  label: string;
  sizes: Size[];
}

const sizePattern = /^\d+(.\d+){0,1}$/;
const sizeCheck = (sizeStr: string) => {
  const sizeNum = Number(sizeStr);
  if (Number.isNaN(sizeNum)) {
    return false;
  }
  return sizeNum >= 0.0001 && sizeNum <= 1000;
};

const decodeBase64 = (base64Str?: string) => {
  let value;
  try {
    const str = Buffer.from(base64Str || "", "base64").toString("utf-8");
    value = JSON.parse(str);
  } catch (e) {
    // parse error
  }
  return value;
};

const encodeBase64 = (value: SizeGroup[]) => {
  return Buffer.from(JSON.stringify(value), "utf-8").toString("base64");
};

const SizeEditor = ({
  editing: defaultEditing = false,
  size,
  onChange,
  onDelete,
  onCancel,
  onEditingChange,
}: {
  editing?: boolean;
  size?: Size;
  onChange: (size: Size) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onEditingChange?: (editing: boolean) => void;
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [editing, setEditing] = useState(defaultEditing);
  const [label, setLabel] = useState(
    (size?.label || "").toString().trim() || ""
  );
  const [width, setWidth] = useState(
    size?.width !== undefined ? size.width.toString() : ""
  );
  const [height, setHeight] = useState(
    size?.height !== undefined ? size.height.toString() : ""
  );
  const [length, setLength] = useState(
    size?.length !== undefined ? size.length.toString() : ""
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(editing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const cancel = () => {
    setErrors({});
    setEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleSave = () => {
    if (Object.values(errors).some((error) => error)) {
      return;
    }
    const trimLabel = label.trim();
    if (!trimLabel || !width || !height || !length) {
      setErrors({
        ...errors,
        ...(!trimLabel && { label: true }),
        ...(!width && { width: true }),
        ...(!height && { height: true }),
        ...(!length && { length: true }),
      });
      return;
    }
    onChange({
      ...size,
      label: trimLabel,
      width: parseFloat(width),
      height: parseFloat(height),
      length: parseFloat(length),
    });
    setLabel(trimLabel);
    cancel();
  };

  const handleCancel = () => {
    setLabel((size?.label || "").toString().trim() || "");
    setWidth(size?.width !== undefined ? size.width.toString() : "");
    setHeight(size?.height !== undefined ? size.height.toString() : "");
    setLength(size?.length !== undefined ? size.length.toString() : "");
    cancel();
  };

  return (
    <Row
      className={styles["size-editor"]}
      align="middle"
      gutter={16}
      style={{ margin: "4px 0" }}
    >
      <Col span={8}>
        <span className={styles["desc-label"]} style={{ marginRight: 8 }}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.attributes.lidar.sizes.item.label",
          })}
        </span>
        {editing ? (
          <Input
            autoFocus
            value={label}
            onChange={(e) => {
              const { value } = e.target;
              if (!value.trim()) {
                setErrors({ ...errors, label: true });
              } else {
                setErrors({ ...errors, label: false });
              }
              setLabel(value);
            }}
            {...(errors.label && { className: styles["has-error"] })}
          />
        ) : (
          size?.label
        )}
      </Col>
      <Col span={4}>
        <span className={styles["desc-label"]} style={{ marginRight: 8 }}>
          W (m)
        </span>
        {editing ? (
          <Input
            value={width}
            onChange={(e) => {
              const { value } = e.target;
              if (!value || !sizePattern.test(value) || !sizeCheck(value)) {
                setErrors({ ...errors, width: true });
              } else {
                setErrors({ ...errors, width: false });
              }
              setWidth(value);
            }}
            {...(errors.width && { className: styles["has-error"] })}
          />
        ) : (
          size?.width
        )}
      </Col>
      <Col span={4}>
        <span className={styles["desc-label"]} style={{ marginRight: 8 }}>
          H (m)
        </span>
        {editing ? (
          <Input
            value={height}
            onChange={(e) => {
              const { value } = e.target;
              if (!value || !sizePattern.test(value) || !sizeCheck(value)) {
                setErrors({ ...errors, height: true });
              } else {
                setErrors({ ...errors, height: false });
              }
              setHeight(value);
            }}
            {...(errors.height && { className: styles["has-error"] })}
          />
        ) : (
          size?.height
        )}
      </Col>
      <Col span={4}>
        <span className={styles["desc-label"]} style={{ marginRight: 8 }}>
          L (m)
        </span>
        {editing ? (
          <Input
            value={length}
            onChange={(e) => {
              const { value } = e.target;
              if (!value || !sizePattern.test(value) || !sizeCheck(value)) {
                setErrors({ ...errors, length: true });
              } else {
                setErrors({ ...errors, length: false });
              }
              setLength(value);
            }}
            {...(errors.length && { className: styles["has-error"] })}
          />
        ) : (
          size?.length
        )}
      </Col>
      <Col span={4}>
        {editing ? (
          <>
            <Button type="link" icon={<CheckOutlined />} onClick={handleSave} />
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={handleCancel}
            />
          </>
        ) : (
          <>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            />
            <Button type="link" icon={<DeleteOutlined />} onClick={onDelete} />
          </>
        )}
      </Col>
    </Row>
  );
};

const SizeGroupEditor = ({
  editing: defaultEditing = false,
  group,
  onChange,
  onDelete,
  onCancel,
  onEditingChange,
}: {
  editing?: boolean;
  group?: SizeGroup;
  onChange: (group: SizeGroup) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onEditingChange?: (editing: boolean) => void;
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(defaultEditing);
  const [itemEditing, setItemEditing] = useState([]);
  const [label, setLabel] = useState(
    group ? group.label.toString().trim() : ""
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(adding || editing || itemEditing.length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adding, editing, itemEditing]);

  const cancel = () => {
    setError(false);
    setEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleLabelSave = () => {
    if (error) {
      return;
    }
    const trimLabel = label.trim();
    if (!trimLabel) {
      setError(true);
      return;
    }
    onChange({ ...group, label: trimLabel });
    setLabel(trimLabel);
    cancel();
  };

  const handleLabelCancel = () => {
    setLabel(group ? group.label.toString().trim() : "");
    cancel();
  };

  const handleSizeItemChange = (index: number, size: Size) => {
    const newGroup = { ...group };
    if (index < 0) {
      // new
      if (!newGroup.sizes) {
        newGroup.sizes = [];
      }
      newGroup.sizes.push({ ...size, id: uuid() });
    } else {
      newGroup.sizes[index] = { ...size };
    }
    onChange(newGroup);
  };

  const handleSizeItemDelete = (index: number) => {
    const newGroup = { ...group };
    newGroup.sizes.splice(index, 1);
    onChange(newGroup);
  };

  const handleItemEditingChange = (index: number, isEditing: boolean) => {
    const newItemEditing = [...itemEditing];
    if (isEditing) {
      if (!itemEditing.includes(index)) {
        newItemEditing.push(index);
      }
    } else {
      const i = itemEditing.indexOf(index);
      if (i >= 0) {
        newItemEditing.splice(i, 1);
      }
    }
    setItemEditing(newItemEditing);
  };

  return (
    <div className={styles["size-group-editor"]}>
      <div className={styles["size-group-label"]}>
        <span className={styles["desc-label"]} style={{ width: 60 }}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.attributes.lidar.sizes.group.label",
          })}
        </span>
        {editing ? (
          <>
            <Input
              autoFocus
              style={{ width: 600 }}
              value={label}
              onChange={(e) => {
                const { value } = e.target;
                setLabel(value);
                if (!value.trim()) {
                  setError(true);
                } else {
                  setError(false);
                }
              }}
              {...(error && { className: styles["has-error"] })}
            />
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={handleLabelSave}
            />
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={handleLabelCancel}
            />
          </>
        ) : (
          <>
            <span style={{ marginRight: 8 }}>{group.label}</span>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            />
            <Button type="link" icon={<DeleteOutlined />} onClick={onDelete} />
          </>
        )}
      </div>
      <div style={{ paddingLeft: 52 }}>
        {group && (
          <>
            {(group.sizes || []).map((size, index) => (
              <SizeEditor
                key={size.id}
                size={size}
                onChange={(s) => handleSizeItemChange(index, s)}
                onDelete={() => handleSizeItemDelete(index)}
                onEditingChange={(e) => handleItemEditingChange(index, e)}
              />
            ))}
            {adding ? (
              <SizeEditor
                editing
                onChange={(s) => handleSizeItemChange(-1, s)}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <Button
                type="link"
                icon={<PlusCircleOutlined />}
                onClick={() => setAdding(true)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const LidarSizesAttribute = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [visible, setVisible] = useState(false);
  const [sizes, setSizes] = useState<SizeGroup[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState([]);

  const handleEditClick = () => {
    const decodedValue = decodeBase64(value) || [];
    decodedValue.forEach((sizeGroup: SizeGroup) => {
      // eslint-disable-next-line no-param-reassign
      sizeGroup.id = uuid();
      if (sizeGroup.sizes) {
        sizeGroup.sizes.forEach((size: Size) => {
          // eslint-disable-next-line no-param-reassign
          size.id = uuid();
        });
      }
    });
    setSizes(decodedValue);
    setVisible(true);
  };

  const handleSubmit = () => {
    if (adding || editing.length > 0) {
      return;
    }
    sizes.forEach((sizeGroup: SizeGroup) => {
      // eslint-disable-next-line no-param-reassign
      delete sizeGroup.id;
      if (sizeGroup.sizes) {
        sizeGroup.sizes.forEach((size: Size) => {
          // eslint-disable-next-line no-param-reassign
          delete size.id;
        });
      }
    });
    onChange(encodeBase64(sizes));
    setVisible(false);
  };

  const handleSizeGroupChange = (index: number, group: SizeGroup) => {
    const newSizes = [...sizes];
    if (index < 0) {
      // new
      newSizes.push({ ...group, id: uuid() });
    } else {
      newSizes[index] = { ...group };
    }
    setSizes(newSizes);
  };

  const handleSizeGroupDelete = (index: number) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    setSizes(newSizes);
  };

  const handleEditingChange = (index: number, isEditing: boolean) => {
    const newEditing = [...editing];
    if (isEditing) {
      if (!newEditing.includes(index)) {
        newEditing.push(index);
      }
    } else {
      const i = newEditing.indexOf(index);
      if (i >= 0) {
        newEditing.splice(i, 1);
      }
    }
    setEditing(newEditing);
  };

  return (
    <>
      <Button onClick={handleEditClick}>
        {formatMessage({ id: "common.edit" })}
      </Button>
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ paddingTop: 48 }}
        visible={visible}
        okButtonProps={{ disabled: adding || editing.length > 0 }}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText={formatMessage({ id: "common.confirm" })}
      >
        {sizes.map((group, index) => (
          <SizeGroupEditor
            key={group.id}
            group={group}
            onChange={(g) => handleSizeGroupChange(index, g)}
            onDelete={() => handleSizeGroupDelete(index)}
            onEditingChange={(e) => handleEditingChange(index, e)}
          />
        ))}
        {adding ? (
          <SizeGroupEditor
            editing
            onChange={(g) => handleSizeGroupChange(-1, g)}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button block onClick={() => setAdding(true)}>
            {formatMessage({ id: "common.add" })}
          </Button>
        )}
      </Modal>
    </>
  );
};

export default LidarSizesAttribute;
