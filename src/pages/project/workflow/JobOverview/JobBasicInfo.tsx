import { useState } from "react";
import { Button, Col, Row } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { dateFormat } from "@/utils/time-util";
import type { Job } from "@/types/job";
import JobInfoItem from "@/components/JobInfoItem";
import type { ContactInfo } from "@/pages/job/job-detail/components/ContactEditModal";
import ContactEditModal from "@/pages/job/job-detail/components/ContactEditModal";

interface Props {
  job: Job;
  readonly: boolean;
  updating: boolean;
  onUpdateJob: (params: any, callback: () => void) => void;
}

function JobBasicInfo({ job, updating, readonly, onUpdateJob }: Props) {
  const { formatMessage } = useIntl();
  const [visible, setVisible] = useState({ contact: false });
  const { jobDisplayId, contactEmail, createdTime } = job || {};

  const handleContactSave = (contact: ContactInfo) => {
    onUpdateJob(contact, () => {
      setVisible({ ...visible, contact: false });
    });
  };

  const items = [
    {
      key: "jobDisplayId",
      title: formatMessage({ id: "jobId" }),
      content: jobDisplayId,
    },
    {
      key: "contact",
      title: (
        <span>
          {formatMessage({ id: "job-detail.contact" })}
          {!readonly && (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => setVisible({ ...visible, contact: true })}
              icon={<EditOutlined />}
            />
          )}
        </span>
      ),
      content: contactEmail,
    },
    {
      key: "creation",
      title: formatMessage({ id: "job-detail.creation" }),
      content: dateFormat(createdTime),
    },
  ];

  return (
    <div style={{ padding: 24, borderBottom: "1px solid #dcdfe3" }}>
      <Row gutter={[16, 16]}>
        {items.map((item) => {
          const { key, title, content } = item;
          return (
            <Col span={12} key={key}>
              <JobInfoItem title={title} content={content} />
            </Col>
          );
        })}
      </Row>
      <ContactEditModal
        visible={visible.contact}
        contact={{ contactEmail: job?.contactEmail }}
        submitting={updating}
        onCancel={() => setVisible({ ...visible, contact: false })}
        onSubmit={handleContactSave}
      />
    </div>
  );
}

export default JobBasicInfo;
