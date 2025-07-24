import MaterialModal from "@/components/MaterialModal";
import { deleteDataRecords } from "@/services/project";
import { HttpStatus } from "@/types";
import { useState } from "react";
import { Dispatch } from "redux";
import { useIntl } from "@umijs/max";
import { message } from "antd";
import { mapStatusToErrorMessage } from "@/utils";

function DataDeleteModal({
  visible,
  projectId,
  recordIds,
  dispatch,
  onClose,
  onComplete,
}: {
  visible: boolean;
  projectId: string;
  recordIds: number[];
  dispatch: Dispatch;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { formatMessage } = useIntl();

  const handleDelete = () => {
    setDeleting(true);
    deleteDataRecords({ projectId, recordIds })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          message.success(
            formatMessage({ id: "common.message.success.operation" })
          );
          dispatch({ type: "dataCenter/updateSelectedData", payload: [] });
          dispatch({
            type: "dataCenter/getStatistics",
            payload: { projectId },
          });
          onComplete();
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setDeleting(false));
  };

  return (
    <MaterialModal
      visible={visible}
      title={formatMessage({ id: "common.delete" })}
      onClose={onClose}
      onSave={handleDelete}
      saveLoading={deleting}
    >
      <p>{formatMessage({ id: "data.action.delete.tip" })}</p>
      <p>
        {formatMessage(
          { id: "data.action.delete.confirm" },
          { num: recordIds.length }
        )}
      </p>
    </MaterialModal>
  );
}

export default DataDeleteModal;
