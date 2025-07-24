import { Progress, Button } from "antd";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import MaterialModal from "@/components/MaterialModal";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { ConnectState } from "@/models/connect";
import type { BigDataProcess } from "@/pages/project/models/dataCenter";
import type { Dispatch } from "redux";

interface Props {
  visible: boolean;
  projectId: string;
  bigDataProgress: BigDataProcess;
  dispatch: Dispatch;
  onRefresh: () => void;
}

function DataActionProgress({
  visible,
  projectId,
  onRefresh,
  bigDataProgress,
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const currentProgress = bigDataProgress[projectId];
  const {
    type,
    progress = 0,
    failureNum = 0,
    successNum = 0,
    allNum,
  } = currentProgress || {};

  const close = () => {
    if (progress === 1) {
      dispatch({
        type: "dataCenter/updateVisible",
        payload: { progressModalVisible: false },
      });
      dispatch({ type: "dataCenter/clearProgress", payload: { projectId } });
      onRefresh();
    } else {
      dispatch({
        type: "dataCenter/updateVisible",
        payload: { progressModalVisible: false },
      });
    }
  };

  // const retry = () => {
  //   if (type === 'release') {
  //   } else {
  //     dispatch({
  //       type: 'dataCenter/turnBack',
  //       payload: { projectId, backTo: { recordList: failureList } },
  //     });
  //   }
  // };

  // const copy = () => {
  //   if (copyTextToClipboard(failureList.join(','))) {
  //     message.success(formatMessage({ id: 'worker.actions.copy-success' }));
  //   }
  // };

  return (
    <MaterialModal
      title={formatMessage(
        { id: "project.detail.data-center.big-data.process.title" },
        {
          type:
            type &&
            formatMessage({
              id: `project.detail.data-center.big-data.${type}`,
            }),
          num: allNum,
        }
      )}
      visible={visible}
      onClose={close}
      showFooter={false}
    >
      {progress !== 1 && (
        <div>
          <p style={{ marginBottom: 40, color: "#42526e" }}>
            {formatMessage({ id: "project.detail.data-center.big-data.tip" })}
          </p>
          <p
            style={{
              margin: 0,
              color: "#42526e",
              fontWeight: "bold",
              fontSize: 20,
              textAlign: "center",
            }}
          >
            {(progress * 100).toFixed(2)}%
          </p>
          <Progress
            style={{ marginBottom: 40 }}
            percent={progress * 100}
            showInfo={false}
          />
          <p style={{ marginBottom: 40, color: "#42526e" }}>
            {formatMessage({ id: "project.detail.data-center.big-data.tip2" })}
          </p>
          <div style={{ textAlign: "right" }}>
            <Button onClick={close}>
              {formatMessage({ id: "project.detail.data-center.run.backend" })}
            </Button>
          </div>
        </div>
      )}
      {progress === 1 && (
        <div style={{ color: "#42526e" }}>
          <p style={{ marginBottom: 16 }}>
            {formatMessage({ id: "project.detail.data-center.run.done" })}
          </p>
          <span style={{ marginRight: 40 }}>
            <CheckCircleFilled style={{ marginRight: 4, color: "#227a7a" }} />
            {successNum} {formatMessage({ id: "common.unit.row" })}
          </span>
          <span>
            <CloseCircleFilled style={{ marginRight: 4, color: "#f56c6c" }} />
            {failureNum} {formatMessage({ id: "common.unit.row" })}
          </span>
          {/* <Divider style={{ margin: '16px 0' }} /> */}
          {/* <p> */}
          {/*  {formatMessage( */}
          {/*    { id: 'project.detail.data-center.action.fail.num' }, */}
          {/*    { */}
          {/*      num: failureNum, */}
          {/*      type: formatMessage({ id: `project.detail.data-center.big-data.${type}` }), */}
          {/*    }, */}
          {/*  )} */}
          {/* </p> */}
          {/* <p style={{ position: 'relative', paddingRight: 40, marginBottom: 40 }}> */}
          {/*  {formatMessage({ id: 'job-detail.dataset' })}: {failureList.join(', ')} */}
          {/*  <Button */}
          {/*    style={{ position: 'absolute', right: 0, height: 16 }} */}
          {/*    type="link" */}
          {/*    icon={<CopyOutlined />} */}
          {/*    onClick={copy} */}
          {/*  /> */}
          {/* </p> */}
          <div style={{ overflow: "hidden", marginTop: 40 }}>
            {/* {failureNum ? ( */}
            {/*  <Button danger onClick={retry}> */}
            {/*    {formatMessage({ id: 'project.detail.data-center.all-retry' })} */}
            {/*  </Button> */}
            {/* ) : null} */}
            <Button style={{ float: "right" }} onClick={close}>
              {formatMessage({ id: "common.close" })}
            </Button>
          </div>
        </div>
      )}
    </MaterialModal>
  );
}

function mapStateToProps({ dataCenter }: ConnectState) {
  return {
    bigDataProgress: dataCenter.bigDataProgress,
    visible: dataCenter.modalVisible.progressModalVisible,
  };
}

export default connect(mapStateToProps)(DataActionProgress);
