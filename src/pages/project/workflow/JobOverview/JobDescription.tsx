import { Button, Empty, Modal } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Truncate from "@/components/Truncate";
import TinymceEditor from "@/components/TinymceEditor";
import { useIntl } from "@umijs/max";
import type { Job } from "@/types/job";
import { useEffect, useState } from "react";

interface Props {
  job: Job;
  readonly: boolean;
  updating: boolean;
  onUpdateJob?: (params: any, callback: () => void) => void;
}

function JobDescription({ job, updating, readonly, onUpdateJob }: Props) {
  const { formatMessage } = useIntl();
  const { description } = job || {};
  const [content, setContent] = useState<string>();
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    setContent(description);
  }, [description]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ color: "#848899", lineHeight: "32px" }}>
        {formatMessage({
          id: "labeling-job-create.wizard.complete.form.description",
        })}
        {!readonly && (
          <Button
            type="link"
            style={{ padding: 0 }}
            icon={<EditOutlined />}
            onClick={() => setEditable(true)}
          />
        )}
      </div>
      {description ? (
        <Truncate html={description} className="editor-content-img w-e-text" />
      ) : (
        <Empty
          description={formatMessage(
            { id: "common.empty.with-label" },
            {
              label: formatMessage({
                id: "labeling-job-create.wizard.complete.form.description",
              }),
            }
          )}
        />
      )}

      <Modal
        visible={editable}
        title={formatMessage({
          id: "labeling-job-create.wizard.complete.form.description",
        })}
        width={800}
        centered
        maskClosable={false}
        onCancel={() => setEditable(false)}
        onOk={() =>
          onUpdateJob?.({ description: content }, () => {
            setEditable(false);
          })
        }
        okText={formatMessage({ id: "common.confirm" })}
        okButtonProps={{ disabled: !content, loading: updating }}
      >
        <TinymceEditor value={content} onChange={setContent} />
      </Modal>
    </div>
  );
}

export default JobDescription;
