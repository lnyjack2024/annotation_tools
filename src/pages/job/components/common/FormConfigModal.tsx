import { Modal } from "antd";
import FormAttribute from "./FormAttribute";
import { Ontology } from "@/types/ontology";

interface FormConfigModalProps {
  open: boolean;
  title?: string;
  config?: string;
  onSave: (config?: string) => void;
  onCancel: () => void;
  getOntology?: () => Ontology[];
}

const uploadUrl = "/api-gw/project/file/img-upload";

const FormConfigModal = ({
  open,
  title,
  config,
  onSave,
  onCancel,
  getOntology,
}: FormConfigModalProps) => (
  <Modal
    destroyOnClose
    centered
    closable={false}
    width="calc(100% - 48px)"
    wrapClassName="form-config-modal"
    style={{
      padding: 0,
      height: "calc(100vh - 48px)",
      overflow: "hidden",
    }}
    open={open}
    footer={null}
    onCancel={onCancel}
  >
    <FormAttribute
      title={title}
      config={config}
      onSave={onSave}
      onCancel={onCancel}
      needOptionReference
      uploadUrl={uploadUrl}
      ontologySyncDisabled={getOntology === undefined}
      getOntology={getOntology}
    />
  </Modal>
);

export default FormConfigModal;
