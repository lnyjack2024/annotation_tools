import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Popconfirm,
  Checkbox,
  Radio,
  Input,
  Switch,
  message,
} from "antd";
import { useIntl } from "@umijs/max";
import type {
  TemplateType,
  TemplateInfo,
  TemplateAttribute,
} from "@/types/template";
import { TemplateAttributeType } from "@/types/template";
import FormAttribute from "@/pages/job/components/JobTemplateEditor/components/FormAttribute";
import LidarSizesAttribute from "@/pages/job/components/JobTemplateEditor/components/LidarSizesAttribute";
import type { Ontology } from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor";
import {
  SupportedAttributes,
  OntologySyncSupportedTemplates,
  TemplateTag,
  getLocalLabel,
} from "@/utils/template-attributes";

interface Props {
  templateType: TemplateType;
  templateInfo: TemplateInfo;
  attributes: string;
  onAttributesChange: (value: string) => void;
  getOntology: () => Ontology[];
}

const TemplateAttributes = ({
  templateType,
  templateInfo,
  attributes: defaultAttributes,
  onAttributesChange,
  getOntology,
}: Props) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [initialTagAttributes, setInitialTagAttributes] = useState<
    Record<string, string>
  >({});
  const [formEditing, setFormEditing] = useState(false);
  const [formName, setFormName] = useState("");

  const getAttrsFromDefault = (name: string) => {
    const definedAttr = (SupportedAttributes[templateType] || []).find(
      (attr) => attr.name === name
    );
    if (definedAttr && definedAttr.defaultValue !== undefined) {
      return definedAttr.defaultValue;
    }

    return undefined;
  };

  /**
   * parse attributes from props when updated
   */
  const attributes = useMemo(() => {
    let parsedAttributes;
    try {
      parsedAttributes = JSON.parse(defaultAttributes || "{}");
    } catch (e) {
      parsedAttributes = {};
    }

    if (Object.keys(parsedAttributes).length === 0) {
      const currentAttrs = {};
      (SupportedAttributes[templateType] || []).forEach((attr) => {
        const { name } = attr;
        const value = getAttrsFromDefault(name);
        if (value) {
          currentAttrs[name] = value;
        }
      });

      onAttributesChange(JSON.stringify(currentAttrs));
    }

    return parsedAttributes;
  }, [defaultAttributes]);

  /**
   * only parse attributes from tag when mounted, ignore changes during editing
   */
  useEffect(() => {
    const { content } = templateInfo;
    if (content) {
      try {
        const dom = document.createElement("div");
        dom.innerHTML = content;
        const tool = dom.getElementsByTagName(TemplateTag[templateType])[0];
        const attrs = {};
        for (let i = 0; i < tool.attributes.length; i += 1) {
          attrs[tool.attributes[i].nodeName] = tool.attributes[i].nodeValue;
        }
        setInitialTagAttributes(attrs);
      } catch (e) {
        // parse error, skip
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAttributeValue = (name: string) => {
    // get from saved attributes
    if (attributes[name] !== undefined) {
      return attributes[name];
    }
    // get from saved tag
    if (initialTagAttributes[name] !== undefined) {
      return initialTagAttributes[name];
    }
    // get from defined default value
    const definedAttr = (SupportedAttributes[templateType] || []).find(
      (attr) => attr.name === name
    );
    if (definedAttr && definedAttr.defaultValue !== undefined) {
      return definedAttr.defaultValue;
    }
    return undefined;
  };

  const handleAttributeUpdate = (name: string, value: string) => {
    onAttributesChange(JSON.stringify({ ...attributes, [name]: value }));
  };

  const handleAttributeDelete = (name: string) => {
    const newAttrs = { ...attributes };
    if (newAttrs[name]) {
      delete newAttrs[name];
    }
    onAttributesChange(JSON.stringify(newAttrs));
    message.success(
      formatMessage({
        id: "labeling-job-create.wizard.configuration.attributes.form.delete.success",
      })
    );
  };

  const handleFormEdit = (name: string) => {
    setFormEditing(true);
    setFormName(name);
  };

  const handleFormCancel = () => {
    setFormEditing(false);
    setFormName("");
  };

  const handleFormSave = (formConfig?: string) => {
    if (formConfig) {
      handleAttributeUpdate(formName, formConfig);
      handleFormCancel();
    }
  };

  const handleExport = () => {
    const currentAttrs = {};
    (SupportedAttributes[templateType] || []).forEach((attr) => {
      const { name } = attr;
      const value = getAttributeValue(name);
      if (value) {
        currentAttrs[name] = value;
      }
    });
    const anchor = document.createElement("a");
    anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentAttrs)
    )}`;
    anchor.download = `attributes.json`;
    anchor.click();
  };

  const handleImport = () => {
    const uploader = document.createElement("input");
    uploader.type = "file";
    uploader.accept = ".json, .txt";
    uploader.onchange = (e: any) => {
      const { files = [] } = e.target;
      if (files.length > 0) {
        const fileReader = new FileReader();
        fileReader.onload = (event: any) => {
          let result: any;
          try {
            result = JSON.parse(event.target.result);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(err.message);
            return;
          }

          if (result) {
            const data = { ...attributes };
            Object.keys(result).forEach((name: string) => {
              if (
                SupportedAttributes[templateType] &&
                SupportedAttributes[templateType].findIndex(
                  (i) => i.name === name
                ) >= 0
              ) {
                data[name] = result[name] as string;
              }
            });
            onAttributesChange(JSON.stringify(data));
            message.success(
              formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.import.success",
              })
            );
          }
        };
        fileReader.readAsText(files[0]);
      } else {
        message.error(
          formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.import.no-file",
          })
        );
      }
    };
    uploader.click();
  };

  const renderAttributeControl = (attribute: TemplateAttribute) => {
    const {
      type,
      name,
      options = [],
      regex,
      validator,
      placeholder,
    } = attribute;
    switch (type) {
      case TemplateAttributeType.FORM:
        return (
          <>
            <Button onClick={() => handleFormEdit(name)}>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.config",
              })}
            </Button>
            <Popconfirm
              title={formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.confirm",
              })}
              onConfirm={() => handleAttributeDelete(name)}
            >
              <Button type="link">
                {formatMessage({
                  id: "labeling-job-create.wizard.configuration.attributes.form.delete",
                })}
              </Button>
            </Popconfirm>
          </>
        );
      case TemplateAttributeType.CHECKBOX:
        return (
          <Checkbox.Group
            options={options.map((o) => ({
              label: getLocalLabel(o.label),
              value: o.name,
            }))}
            value={(getAttributeValue(name) || "").split(",")}
            onChange={(values) => handleAttributeUpdate(name, values.join(","))}
          />
        );
      case TemplateAttributeType.RADIO:
        return (
          <Radio.Group
            options={options.map((o) => ({
              label: getLocalLabel(o.label),
              value: o.name,
            }))}
            value={getAttributeValue(name)}
            onChange={(e) => handleAttributeUpdate(name, e.target.value)}
          />
        );
      case TemplateAttributeType.INPUT:
        return (
          <Input
            value={getAttributeValue(name)}
            onChange={(e) => {
              const { value } = e.target;
              if (
                value &&
                ((regex && !regex.test(value)) ||
                  (validator && !validator(value)))
              ) {
                return;
              }
              handleAttributeUpdate(name, value);
            }}
            placeholder={placeholder && getLocalLabel(placeholder)}
          />
        );
      case TemplateAttributeType.SWITCH:
        return (
          <Switch
            checked={
              getAttributeValue(name) === true ||
              getAttributeValue(name) === "true"
            }
            onChange={(checked) =>
              handleAttributeUpdate(name, checked.toString())
            }
          />
        );
      case TemplateAttributeType.LIDAR_SIZES:
        return (
          <LidarSizesAttribute
            value={getAttributeValue(name)}
            onChange={(value) => handleAttributeUpdate(name, value)}
          />
        );
      default:
    }
    return null;
  };

  const renderAttribute = (attribute: TemplateAttribute) => {
    const { name, tips } = attribute;
    return (
      <Row
        key={name}
        align="middle"
        style={{
          minHeight: 32,
          padding: "8px 0",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <Col span={5}>
          <b>{name}</b>
        </Col>
        <Col span={5}>{getLocalLabel(attribute.label) || attribute.name}</Col>
        <Col span={14}>
          <div>{renderAttributeControl(attribute)}</div>
          {tips && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#909090" }}>
              {`* ${getLocalLabel(tips)}`}
            </div>
          )}
        </Col>
      </Row>
    );
  };

  return (
    <>
      <div style={{ textAlign: "right" }}>
        <Button type="link" style={{ paddingRight: 0 }} onClick={handleExport}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.export",
          })}
        </Button>
        <Button type="link" style={{ paddingRight: 0 }} onClick={handleImport}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.import",
          })}
        </Button>
      </div>
      {(SupportedAttributes[templateType] || []).map(
        (attribute: TemplateAttribute) => renderAttribute(attribute)
      )}
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ padding: "45px 8px 8px" }}
        visible={formEditing}
        footer={null}
        onCancel={handleFormCancel}
      >
        <FormAttribute
          config={getAttributeValue(formName)}
          ontologySyncDisabled={
            !OntologySyncSupportedTemplates.includes(templateType)
          }
          getOntology={getOntology}
          onSave={handleFormSave}
        />
      </Modal>
    </>
  );
};

export default TemplateAttributes;
