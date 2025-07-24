import type { Dispatch } from "@umijs/max";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { Job } from "@/types/job";
import { JobStatus, JobTenantType } from "@/types/job";
import { useEffect, useState } from "react";
import {
  EllipsisOutlined,
  MailOutlined,
  MobileOutlined,
  PlusCircleTwoTone,
  UserOutlined,
} from "@ant-design/icons";
import styles from "@/pages/job/job-detail/BPOWorkforce/styles.less";
import type { BPO } from "@/types/vm";
import BpoWorkerAddModal from "@/pages/bpo/bpo-job/job-detail/components/BpoWorkerAddModal";
import InternalWorkerUploadModal from "@/pages/bpo/bpo-job/job-detail/components/InternalWorkerUploadModal";
import InternalWorkerAddModal from "@/pages/bpo/bpo-job/job-detail/components/InternalWorkerAddModal";
import { Button, message, Modal, Popover } from "antd";
import { getJobType } from "@/pages/project/workflow/components/WorkflowCard";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { ConnectState } from "@/models/connect";
import BPOSelect from "@/pages/job/JobCreationWizard/components/BPOSelect";
import { getBpoDetail } from "@/services/vm";

interface Props {
  job: Job;
  readonly: boolean;
  workerNum: number;
  dispatch: Dispatch;
  submitting: boolean;
}

function TeamHeader({
  job,
  readonly = false,
  workerNum,
  submitting,
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const [bpoInfo, setBpoInfo] = useState<BPO>();
  const [selectedBPO, setSelectedBpo] = useState<BPO>();
  const [visible, setVisible] = useState({
    internalUpload: false,
    internalAdd: false,
    bpoWorker: false,
    publicWorker: false,
    bpoTeam: false,
  });
  const { projectId, bpoFlag, id: jobId, bpoId } = job || {};

  const title = () => {
    const jobType = getJobType(job);

    if (!bpoFlag) {
      return formatMessage({
        id: `workflow.job-type.team.${jobType?.toLowerCase()}`,
      });
    }

    return `${formatMessage({
      id: `workflow.job-type.team.${jobType?.toLowerCase()}`,
    })}: [${bpoInfo?.bpoDisplayId || ""}] ${bpoInfo?.name || ""}`;
  };

  const items = [
    {
      icon: <UserOutlined className={styles["bpo-info-icon"]} />,
      label: formatMessage({ id: "common.contact-name" }),
      key: "contact",
    },
    {
      icon: <MobileOutlined className={styles["bpo-info-icon"]} />,
      label: formatMessage({ id: "project.detail.workforce.contact-phone" }),
      key: "contactPhone",
    },
    {
      icon: <MailOutlined className={styles["bpo-info-icon"]} />,
      label: formatMessage({ id: "common.contact-email" }),
      key: "contactEmail",
    },
  ];

  const showWorkerAddModal = () => {
    const jobType = getJobType(job);

    setVisible({
      ...visible,
      internalUpload: jobType === JobTenantType.PRIVATE,
      bpoWorker: jobType === JobTenantType.COMPANY,
    });
  };

  const getWorkerNum = () => {
    dispatch({
      type: "jobDetailDrawer/getJobWorkerNum",
      payload: {
        jobId,
      },
    });
  };

  const getBpo = async (id: string) => {
    if (!id) {
      return;
    }
    try {
      const resp = await getBpoDetail(id);
      setBpoInfo(resp.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const refreshList = () => {
    setVisible({
      internalUpload: false,
      internalAdd: false,
      bpoWorker: false,
      publicWorker: false,
      bpoTeam: false,
    });
    dispatch({
      type: "jobDetailDrawer/getJobWorkerList",
      payload: { jobId },
    });
    getWorkerNum();
  };

  const changeBPO = () => {
    dispatch({
      type: "jobDetailDrawer/updateJobBpo",
      payload: {
        jobId,
        bpoId: selectedBPO.id || selectedBPO.bpoId,
        bpoName: selectedBPO.name || selectedBPO.bpoName,
        callback: () => {
          setSelectedBpo(null);
          setVisible({ ...visible, bpoTeam: false });
          refreshList();
          getBpo(selectedBPO.id || selectedBPO.bpoId);
        },
      },
    });
  };

  useEffect(() => {
    getBpo(bpoId);
  }, [bpoId]);

  return (
    <div
      style={{
        marginTop: "-16px",
        marginBottom: "16px",
        padding: "0 24px",
        background: "#F6F7F9",
      }}
    >
      <h3 style={{ margin: 0, lineHeight: "52px", color: "#3e5270" }}>
        {title()}
        <span style={{ float: "right", fontSize: 20 }}>
          {workerNum}
          {bpoFlag ? (
            <>
              <Popover
                placement="bottomLeft"
                arrowPointAtCenter={true}
                content={
                  <>
                    <Button
                      style={{ marginRight: 12 }}
                      onClick={() =>
                        setVisible({ ...visible, bpoWorker: true })
                      }
                      disabled={readonly}
                    >
                      {formatMessage({
                        id: `job-detail.workforce.add.COMPANY`,
                      })}
                    </Button>
                    <Button
                      onClick={() =>
                        setVisible({ ...visible, internalUpload: true })
                      }
                      disabled={readonly}
                    >
                      {formatMessage({
                        id: "job-detail.workforce.add.internal",
                      })}
                    </Button>
                  </>
                }
              >
                <PlusCircleTwoTone
                  twoToneColor="#a0aabc"
                  style={{ marginLeft: 12 }}
                  disabled={readonly}
                />
              </Popover>
              {job?.jobStatus !== JobStatus.RUNNING &&
                job?.jobStatus !== JobStatus.PAUSE &&
                !readonly && (
                  <Popover
                    placement="bottomLeft"
                    arrowPointAtCenter={true}
                    content={
                      <>
                        <Button
                          onClick={() =>
                            setVisible({ ...visible, bpoTeam: true })
                          }
                        >
                          {formatMessage({
                            id: "job-detail.bpo-workforce.change-title",
                          })}
                        </Button>
                      </>
                    }
                  >
                    <EllipsisOutlined style={{ marginLeft: 12 }} />
                  </Popover>
                )}
            </>
          ) : (
            !readonly && (
              <Popover
                placement="bottomLeft"
                arrowPointAtCenter={true}
                content={
                  <>
                    <Button
                      style={{ marginRight: 12 }}
                      onClick={() =>
                        setVisible({ ...visible, internalAdd: true })
                      }
                      disabled={readonly}
                    >
                      {formatMessage({
                        id: `job-detail.workforce.select.internal`,
                      })}
                    </Button>
                    <Button onClick={showWorkerAddModal} disabled={readonly}>
                      {formatMessage({
                        id: "job-detail.workforce.add.internal",
                      })}
                    </Button>
                  </>
                }
              >
                <PlusCircleTwoTone
                  twoToneColor="#a0aabc"
                  style={{ marginLeft: 12 }}
                />
              </Popover>
            )
          )}
        </span>
        {bpoInfo && (
          <div style={{ lineHeight: "42px", fontSize: 14 }}>
            {items.map((item) => (
              <span style={{ marginRight: 24 }} key={item.key}>
                {item.icon}
                <span className={styles["bpo-info-value"]}>
                  {bpoInfo?.[item.key]}
                </span>
              </span>
            ))}
          </div>
        )}
      </h3>
      <BpoWorkerAddModal
        visible={visible.bpoWorker}
        jobId={jobId}
        bpoId={bpoInfo?.bpoId}
        isPM
        onClose={() => {
          refreshList();
        }}
      />
      <InternalWorkerAddModal
        projectId={projectId}
        jobId={jobId}
        visible={visible.internalAdd}
        onSave={refreshList}
        onClose={() => {
          setVisible({ ...visible, internalAdd: false });
        }}
      />
      <InternalWorkerUploadModal
        job={job}
        visible={visible.internalUpload}
        onClose={() => {
          setVisible({ ...visible, internalUpload: false });
        }}
        onWorkersChange={refreshList}
      />
      <Modal
        visible={visible.bpoTeam}
        title={formatMessage({ id: "job-detail.bpo-workforce.change-title" })}
        width={600}
        onCancel={() => setVisible({ ...visible, bpoTeam: false })}
        okButtonProps={{ disabled: !selectedBPO, loading: submitting }}
        onOk={changeBPO}
        okText={formatMessage({ id: "common.confirm" })}
      >
        <BPOSelect
          bpoId={bpoId}
          projectId={projectId}
          onChange={(_, bpo) => setSelectedBpo(bpo)}
          width={500}
        />
      </Modal>
    </div>
  );
}

function mapStateToProps({ jobDetailDrawer, loading }: ConnectState) {
  return {
    job: jobDetailDrawer.job,
    workerNum: jobDetailDrawer.workerNum,
    submitting: loading.effects["jobDetailDrawer/updateJobBpo"],
  };
}

export default connect(mapStateToProps)(TeamHeader);
