import { useState } from "react";
import { Button, message, Spin } from "antd";
import { useIntl } from "@umijs/max";

import { mapStatusToErrorMessage } from "@/utils/utils";

import { getTemplateIdByJobId, getTemplateById } from "@/services/template-v3";

type Props = {
  jobId: string;
  onInstructionClick: (content: string) => void;
};

function JobManual({ jobId, onInstructionClick }: Props) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);

  const getJobTemplate = async () => {
    const templateId = await getTemplateIdByJobId(jobId).then(
      (resp) => resp.data
    );
    return getTemplateById(templateId).then((resp) => resp.data);
  };

  const viewInstruction = async () => {
    setLoading(true);
    try {
      const template = await getJobTemplate();
      onInstructionClick(template.instruction);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Button type="link" style={{ padding: 0 }} onClick={viewInstruction}>
        {formatMessage({ id: "job.template-instruction.title" })}
      </Button>
    </Spin>
  );
}

export default JobManual;
