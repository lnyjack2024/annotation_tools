import { useEffect, useState } from "react";
import { Button, Popconfirm, Radio, Modal, message } from "antd";
import { getLocale, useIntl } from "umi";
import { base64Encode } from "@/utils/string-util";
import EasyFormConfig from "@appen-china/easy-form-config";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import type { Ontology } from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor";

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
  title?: string;
}

export const ONTOLOGY_FIELD_NAME = "ef-ontology";

/**
 * add or update ef-ontology field options
 * @param config form config
 * @param ontology ontology array
 */
function syncOntologyField(config: Config, ontology: Ontology[]) {
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

const FormAttribute = ({
  config: defaultConfig,
  ontologySyncDisabled,
  defaultOntology,
  getOntology,
  onSave,
  title,
}: FormAttributeProps) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [formConfig, setFormConfig] = useState<Config>(null);
  const [size, setSize] = useState<FormSize>(FormSize.DEFAULT);
  const [ontology, setOntology] = useState<Ontology[]>([]);

  useEffect(() => {
    try {
      const configStr = Buffer.from(defaultConfig || "", "base64").toString(
        "utf-8"
      );
      const { size: formSize, ...restConfig } = JSON.parse(configStr);
      setFormConfig(restConfig);
      if (formSize && Object.values(FormSize).includes(formSize)) {
        setSize(formSize);
      } else {
        setSize(FormSize.DEFAULT);
      }
    } catch (e) {
      setFormConfig(null);
      setSize(FormSize.DEFAULT);
    }
  }, [defaultConfig]);

  useEffect(() => {
    let o = defaultOntology;
    if (!o && getOntology) {
      o = getOntology();
    }
    setOntology(o);
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
      <div
        style={{
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.attributes.form.size",
          })}
          <Radio.Group value={size} onChange={(e) => setSize(e.target.value)}>
            <Radio.Button value={FormSize.LARGE}>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.size.large",
              })}
            </Radio.Button>
            <Radio.Button value={FormSize.DEFAULT}>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.size.default",
              })}
            </Radio.Button>
            <Radio.Button value={FormSize.SMALL}>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.size.small",
              })}
            </Radio.Button>
          </Radio.Group>
        </div>
        {!ontologySyncDisabled && (
          <Popconfirm
            placement="bottomRight"
            title={formatMessage({
              id: "labeling-job-create.wizard.configuration.attributes.form.sync.alert",
            })}
            onConfirm={handleOntologySync}
          >
            <Button>
              {formatMessage({
                id: "labeling-job-create.wizard.configuration.attributes.form.sync",
              })}
            </Button>
          </Popconfirm>
        )}
      </div>
      <EasyFormConfig
        locale={getLocale()}
        config={formConfig}
        onSubmit={handleSave}
      />
    </>
  );
};

export default FormAttribute;
