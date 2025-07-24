import { Modal, Result, Skeleton } from "antd";
import { useIntl } from "@umijs/max";

import NewProjectForm from "@/pages/project/components/NewProjectForm";
import type { Project } from "@/types/project";

type ProjectFormModalProp = {
  visible: boolean;
  submitting: boolean;
  isAdmin: boolean;
  loadingAccess: boolean;
  errorMessage: string;
  onCancel: () => void;
  handleSubmit: (params: Project) => void;
  project: Project;
};
export default function ProjectFormModal({
  visible,
  onCancel,
  handleSubmit,
  submitting,
  errorMessage,
  isAdmin,
  loadingAccess,
  project,
}: ProjectFormModalProp) {
  const { formatMessage } = useIntl();
  return (
    <Modal
      visible={visible}
      maskClosable={false}
      title={formatMessage({
        id: project ? "project-list.update" : "menu.project-create",
      })}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Skeleton loading={loadingAccess}>
        {project && !isAdmin ? (
          <Result
            status="403"
            subTitle={formatMessage({ id: "project-access.no-access" })}
          />
        ) : (
          <NewProjectForm
            initialValue={{
              ...project,
            }}
            onSubmit={handleSubmit}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        )}
      </Skeleton>
    </Modal>
  );
}
