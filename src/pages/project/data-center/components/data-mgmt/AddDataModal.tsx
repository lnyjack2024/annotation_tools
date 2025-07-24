import type { ModalCommonProp } from "@/types/common";
import { Button, Form, FormInstance, message, Modal } from "antd";
import { useState } from "react";
import { useIntl, useDispatch } from "@umijs/max";
import AddDataForm from "@/pages/project/data-center/components/data-mgmt/AddDataForm";
import AddTypeSelectionComponent from "@/pages/project/data-center/components/data-mgmt/AddTypeSelection";
import { SourceType } from "@/types/dataset";
import {
  addProjectDataPoolData,
  preUploadOriginaFile,
  uploadCsvData,
} from "@/services/project";
import { HttpStatus } from "@/types";
import { getUploadingFileCount } from "@/utils";
interface AddDataModalProp extends ModalCommonProp {
  projectId: string;
  handleSubmitSuccess: () => void;
  addTypes?: SourceType[];
  isPushData?: boolean;
  formData?: FormInstance[];
  batchNum?: number;
}

const MaxOriFileUploadingCount = 3;

export default function AddDataModal({
  visible,
  onCancel,
  projectId,
  handleSubmitSuccess,
  addTypes = [
    SourceType.ORIGINAL_UPLOADED,
    SourceType.UPLOADED,
    SourceType.CSV_ZIP,
  ],
  isPushData = false,
  formData = null,
}: AddDataModalProp) {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [form] = formData || Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentType, setCurrentType] = useState<SourceType>();
  const [submitting, setSubmitting] = useState(false);

  const title = (
    <>
      {currentStep === 0 &&
        formatMessage({
          id: isPushData
            ? "project.detail.data-center.add-data.upload-type"
            : "project.detail.data-center.add-data.select-type",
        })}
      {currentStep === 1 &&
        formatMessage({
          id: isPushData
            ? "data.batch.add"
            : `project.detail.data-center.add-data.select-type.${currentType?.toLowerCase()}`,
        })}
    </>
  );

  const onSelect = (type: SourceType) => {
    setCurrentType(type);
    setCurrentStep(1);
  };

  const afterClose = () => {
    setCurrentType(null);
    setCurrentStep(0);
    setSubmitting(false);
    form.resetFields();
  };

  function handleSubmit() {
    form
      .validateFields()
      .then(
        ({ file, dataType, batchName, batchNum }) => {
          setSubmitting(true);
          if (currentType === SourceType.UPLOADED) {
            const api = isPushData ? addProjectDataPoolData : uploadCsvData;
            return api({
              projectId,
              file,
              dataType,
              batchName,
              batchNum,
            });
          }

          if (currentType === SourceType.ORIGINAL_UPLOADED) {
            if (getUploadingFileCount() >= MaxOriFileUploadingCount) {
              throw new Error(
                formatMessage({
                  id: "project.detail.data-center.upload.maxsize.error",
                })
              );
            }
            return preUploadOriginaFile({
              projectId,
              recordDataType: dataType,
              batchName,
              fileName: file.name,
              fileLength: file.size,
              batchNum,
            }).then((resp) => {
              if (resp.status === HttpStatus.OK) {
                const fileId = resp.data;
                dispatch({
                  type: "uploadProgress/uploadOriginalZipData",
                  payload: {
                    projectId,
                    file,
                    recordDataType: dataType,
                    prjResourceId: fileId,
                    size: file.size,
                    batchNum,
                    onProgress: (
                      payload: ProgressEvent<EventTarget> & { id: number }
                    ) => {
                      payload.id = fileId;
                      dispatch({
                        type: "uploadProgress/updateUploadProgress",
                        payload,
                      });
                    },
                  },
                });
              }
            });
          }
          return null;
        },
        (err) => {
          throw err;
        }
      )
      .then(() => {
        message.success(
          formatMessage({
            id:
              currentType === SourceType.ORIGINAL_UPLOADED
                ? "project.detail.data-center.add-data.message.uploading"
                : "common.message.success.add",
          })
        );
        handleSubmitSuccess();
      })
      .catch(({ message: msg, status }) => {
        if (!msg && !status) {
          return;
        }
        const errorMsg = formatMessage({
          id: status + "",
        });
        const errorTip = [55074, 55075, 55076, 55077, 55040].includes(status)
          ? errorMsg
          : msg;
        message.error(errorTip);
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <Modal
      title={title}
      className="custom-modal"
      visible={visible}
      width={650}
      onCancel={onCancel}
      afterClose={afterClose}
      footer={null}
      maskClosable={false}
      destroyOnClose
    >
      {currentStep === 0 && (
        <AddTypeSelectionComponent select={onSelect} addTypes={addTypes} />
      )}
      {currentStep === 1 && (
        <>
          <AddDataForm
            form={form}
            projectId={projectId}
            sourceType={currentType}
            fileAccept={currentType === SourceType.UPLOADED ? ".csv" : ".zip"}
            isPushData={isPushData}
          />
          <div className="text-right">
            <Button
              type="primary"
              ghost
              onClick={onCancel}
              className="btn-width"
            >
              {formatMessage({ id: "common.cancel" })}
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              className="margin-left-2 btn-width"
              loading={submitting}
            >
              {formatMessage({ id: "common.confirm" })}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
