import type { ChangeEvent } from "react";
import { useCallback } from "react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "@umijs/max";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import styles from "@/pages/job/components/JobTemplateEditor/tool-config/TextOntologyItem.less";
import type { TextOntology } from "./TextOntologyEditor";
import ColorPicker from "./general-image/ColorPicker";
import { isIdentNameValid } from "./utils/validate-utils";

export interface TextOntologyItemProps {
  colorEnabled: boolean;
  handleEditClick: (ontology: TextOntology) => void;
  handleDelete: (id: TextOntology["id"]) => void;
  validate: (ontology: TextOntology) => boolean;
  updateEdittingKey: (value: string) => void;
  handleAddItem?: (id: TextOntology["id"]) => void;
  isEditting: boolean;
  ontology: TextOntology;
  depth: number;
  maxDepth?: number;
}

export default ({
  maxDepth,
  depth,
  isEditting,
  ontology,
  colorEnabled,
  handleAddItem,
  handleDelete,
  updateEdittingKey,
  validate,
  handleEditClick,
}: TextOntologyItemProps) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [editItem, setEditItem] = useState<TextOntology | null>(null);
  const [activateItem, setActivateItem] = useState("");
  const ref = useRef(null);
  const intl = useIntl();
  const handleOkRef = useRef(null);
  const { formatMessage } = intl;

  useEffect(() => {
    setErrorMessage("");
    if (isEditting) {
      setEditItem(ontology);
    } else {
      setEditItem(null);
    }
  }, [isEditting]);

  const resetStatus = () => {
    setErrorMessage("");
    setEditItem(null);
    updateEdittingKey("");
  };

  const handleOk = () => {
    if (!editItem || !isIdentNameValid(editItem.text)) {
      setErrorMessage(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.template.identification.class-error",
        })
      );
      return;
    }
    const newOntology = {
      ...editItem,
      ...(colorEnabled && { color: editItem.color }),
    };
    if (!validate(newOntology)) {
      setErrorMessage(
        formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.title.class-duplicate",
        })
      );
      return;
    }
    handleEditClick(newOntology);
    resetStatus();
  };

  useEffect(() => {
    handleOkRef.current = handleOk;
    return () => {};
  }, [editItem]);

  const mousedown = useCallback((e: MouseEvent) => {
    const isContainedSelf = ref.current?.contains(e.target);
    if (!isContainedSelf) {
      handleOkRef.current();
    }
  }, []);

  useEffect(() => {
    if (isEditting) {
      document.addEventListener("mousedown", mousedown);
    } else {
      document.removeEventListener("mousedown", mousedown);
    }
  }, [isEditting]);

  const handleCancel = () => {
    if (ontology.isAddingItem) {
      handleDelete(ontology.id);
    }
    resetStatus();
  };

  const handleColorPickComplete = (color: string) => {
    setEditItem({ ...editItem, color: color });
  };

  const handleClassNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setEditItem({ ...editItem, text: e.target.value });
  };

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setEditItem({ ...editItem, displayName: e.target.value });
  };

  const handleDescChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setEditItem({ ...editItem, desc: e.target.value });
  };

  return (
    <div
      ref={ref}
      className={styles["ontology-text-item"]}
      style={{ margin: `4px 0 4px ${depth === 0 ? 0 : 12}px` }}
      onMouseOver={(e) => {
        e.stopPropagation();
        setActivateItem(ontology.id);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setActivateItem("");
      }}
    >
      {!isEditting && (
        <>
          <div>
            {colorEnabled && (
              <span
                className={styles.color}
                style={{ background: ontology.color }}
              />
            )}
            <span className={styles.name}>
              {ontology.displayName
                ? `${ontology.displayName} (${ontology.text})`
                : ontology.text}
            </span>
            {ontology.desc && (
              <div className={styles.desc}>{ontology.desc}</div>
            )}
          </div>
          <div className={styles["right-wrapper"]}>
            {activateItem === ontology.id && (
              <>
                {!maxDepth ||
                  (maxDepth &&
                    typeof maxDepth === "number" &&
                    depth < maxDepth - 1 && (
                      <PlusCircleOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEditting) {
                            handleAddItem(ontology.id);
                          }
                        }}
                        style={{
                          cursor: isEditting ? "not-allowed" : "pointer",
                        }}
                      />
                    ))}
                <EditOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditting) {
                      if (editItem) {
                        const passed = validate(editItem);
                        if (passed) {
                          updateEdittingKey(ontology.id);
                        }
                      } else {
                        updateEdittingKey(ontology.id);
                      }
                    }
                  }}
                  style={{
                    cursor: isEditting ? "not-allowed" : "pointer",
                  }}
                />
                <DeleteOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditting) {
                      handleDelete(ontology.id);
                    }
                  }}
                  style={{
                    cursor: isEditting ? "not-allowed" : "pointer",
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {isEditting && editItem && (
        <>
          <Form layout="inline">
            {colorEnabled && (
              <Form.Item>
                <ColorPicker
                  width={32}
                  value={editItem.color}
                  onChange={(c) => {
                    handleColorPickComplete(c);
                  }}
                />
              </Form.Item>
            )}
            <Form.Item
              {...(isEditting &&
                errorMessage && {
                  validateStatus: "error",
                  help: errorMessage,
                })}
            >
              <Input
                style={{ width: 210 }}
                value={editItem.text}
                onChange={handleClassNameChange}
                placeholder={formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.title.class",
                })}
              />
            </Form.Item>
            <Form.Item>
              <Input
                style={{ width: 210 }}
                value={editItem.displayName}
                onChange={handleDisplayNameChange}
                placeholder={formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.title.label",
                })}
              />
            </Form.Item>
            <Form.Item
              style={{
                width: "100%",
                marginTop: 8,
              }}
            >
              <Input
                style={{ width: 562 }}
                value={editItem.desc}
                onChange={handleDescChange}
                placeholder={formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.title.desc",
                })}
              />
            </Form.Item>
          </Form>
          <div className={styles["right-wrapper"]}>
            <Button
              type="text"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOk();
              }}
              style={{
                padding: "0 8px",
                color: "#227A7A",
              }}
            >
              {formatMessage({ id: "common.save" })}
            </Button>
            <Button
              type="text"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
              }}
              style={{
                padding: "0 8px",
                color: "#42526E",
              }}
            >
              {formatMessage({ id: "common.cancel" })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
