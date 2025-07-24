import React from "react";
import { Col, Row, Typography } from "antd";
import { useIntl } from "@umijs/max";

import styles from "@/pages/job/styles.less";
import privateJobSvg from "@/assets/icons/private-job.svg";
import bpoJobSvg from "@/assets/icons/bpo-job.svg";
import type { JobCategory } from "@/pages/project/workflow/WorkflowCreation/components/JobForm";

type Props = {
  onNext: (category: JobCategory) => void;
};

const JobTypeSelect: React.FC<Props> = ({ onNext }) => {
  const { formatMessage } = useIntl();

  return (
    <Row>
      <Col md={12} sm={12} xs={24} style={{ textAlign: "center" }}>
        <button
          type="button"
          className={styles.jobTypeContainer}
          onClick={(e) => {
            e.preventDefault();
            onNext("private-job");
          }}
        >
          <div>
            <img
              src={privateJobSvg}
              className={styles.icon}
              alt="Private job"
            />
          </div>
          <Typography.Text strong>
            {formatMessage({ id: "job.list.private" })}
          </Typography.Text>
        </button>
      </Col>
      <Col md={12} sm={12} xs={24} style={{ textAlign: "center" }}>
        <button
          type="button"
          className={styles.jobTypeContainer}
          onClick={(e) => {
            e.preventDefault();
            onNext("bpo-job");
          }}
        >
          <div>
            <img src={bpoJobSvg} className={styles.icon} alt="BPO job" />
          </div>
          <Typography.Text strong>
            {formatMessage({ id: "job.list.bpo" })}
          </Typography.Text>
        </button>
      </Col>
    </Row>
  );
};

export default JobTypeSelect;
