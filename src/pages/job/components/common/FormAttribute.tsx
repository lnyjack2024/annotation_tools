import { useEffect, useState } from "react";
import { Button, Modal, Popconfirm, message } from "antd";
import { EasyFormGraphConfig } from "@appen-china/easy-form-config";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import { useIntl, getLocale } from "umi";
import { base64Decode, base64Encode } from "@/utils/string-util";
import { Ontology } from "../JobTemplateEditor/tool-config/OntologyEditor";

enum FormSize {
  DEFAULT = "default",
  SMALL = "small",
  LARGE = "large",
}

interface FormAttributeProps {
  config?: string;
  ontologySyncDisabled: boolean;
  defaultOntology?: Ontology[];
  getOntology?: () => Ontology[];
  onSave: (config?: string) => void;
  onCancel?: () => void;
  uploadUrl?: string;
  needOptionReference?: boolean;
  title?: string;
}

export const ONTOLOGY_FIELD_NAME = "ef-ontology";

/**
 * add or update ef-ontology field options
 * @param config form config
 * @param ontology ontology array
 */
function syncOntologyField(config: Config | undefined, ontology: Ontology[]) {
  const newConfig: Config = { fields: [], ...config };
  const newOptions = ontology.map((o: Ontology) => ({
    value: o.class_name,
    label: o.class_name,
  }));
  const originOntologyField = newConfig.fields.find(
    (f) => f.name === ONTOLOGY_FIELD_NAME
  );
  if (originOntologyField) {
    originOntologyField.type = "RADIO" as Config["fields"][0]["type"];
    originOntologyField.valueType =
      "string" as Config["fields"][0]["valueType"];
    originOntologyField.options = newOptions;
  } else {
    newConfig.fields.splice(0, 0, {
      name: ONTOLOGY_FIELD_NAME,
      type: "RADIO",
      valueType: "string",
      options: newOptions,
    } as Config["fields"][0]);
  }
  return newConfig;
}

function FormAttribute({
  config: defaultConfig,
  ontologySyncDisabled,
  defaultOntology,
  getOntology,
  onSave,
  onCancel,
  uploadUrl,
  needOptionReference = false,
  title,
}: FormAttributeProps) {
  const { formatMessage } = useIntl();

  const [formConfig, setFormConfig] = useState<Config>();
  const [size, setSize] = useState<FormSize>(FormSize.DEFAULT);
  const [ontology, setOntology] = useState<Ontology[]>([]);

  useEffect(() => {
    const configStr = base64Decode(defaultConfig || "");
    if (configStr) {
      const { size: formSize, ...restConfig } = configStr;
      setFormConfig(restConfig);
      if (formSize && Object.values(FormSize).includes(formSize)) {
        setSize(formSize);
      } else {
        setSize(FormSize.DEFAULT);
      }
    } else {
      setFormConfig(undefined);
      setSize(FormSize.DEFAULT);
    }
  }, [defaultConfig]);

  useEffect(() => {
    let o = defaultOntology;
    if (!o && getOntology) {
      o = getOntology();
    }
    setOntology(o || []);
  }, [defaultOntology, getOntology]);

  const save = (config: Config) => {
    const allConfig = { ...config, size };
    if (allConfig.fields.length === 0) {
      // empty form
      onSave(undefined);
    } else {
      onSave(base64Encode(allConfig));
    }
  };

  const handleSave = (config: Config) => {
    const ontologyFieldIndex = config.fields.findIndex(
      (f) => f.name === ONTOLOGY_FIELD_NAME
    );
    if (ontologyFieldIndex >= 0 && !ontologySyncDisabled) {
      // check options are the same with ontology
      const { options = [] } = config.fields[ontologyFieldIndex];
      if (
        options.some(
          (option) =>
            ontology.findIndex((o: Ontology) => o.class_name === option.value) <
            0
        ) ||
        options.length !== ontology.length
      ) {
        Modal.confirm({
          title: formatMessage({
            id: "labeling-job-create.wizard.configuration.attributes.form.ontology.alert",
          }),
          onOk: () => save(config),
          okText: formatMessage({ id: "common.confirm" }),
        });
        return;
      }
    }

    save(config);
  };

  const handleOntologySync = () => {
    if (ontologySyncDisabled) return;
    setFormConfig(syncOntologyField(formConfig, ontology));
    message.success(
      formatMessage({
        id: "labeling-job-create.wizard.configuration.attributes.form.sync.success",
      })
    );
  };
  return (
    <>
      {!ontologySyncDisabled && (
        <div
          style={{ padding: 16, display: "flex", justifyContent: "flex-end" }}
        >
          <Popconfirm
            placement="bottomRight"
            title={formatMessage({
              id: "labeling-job-create.wizard.configuration.attributes.form.sync.alert",
            })}
            onConfirm={handleOntologySync}
            okText={formatMessage({ id: "common.confirm" })}
            cancelText={formatMessage({ id: "common.cancel" })}
          >
            <Button>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.sync",
              })}
            </Button>
          </Popconfirm>
        </div>
      )}
      <EasyFormGraphConfig
        locale={getLocale()}
        config={formConfig}
        onSubmit={handleSave}
        onCancel={onCancel}
        needOptionReference={needOptionReference}
        uploadUrl={uploadUrl}
        title={title}
      />
    </>
  );
}

export default FormAttribute;
