import { message, Card, Row, Col } from "antd";
import { pathToRegexp } from "path-to-regexp";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import RecordDetailHeader from "./components/RecordDetailHeader";
import { useEffect, useState } from "react";
import { getProjectDataDetail } from "@/services/project";
import { mapStatusToErrorMessage } from "@/utils";
import { useDispatch } from "@umijs/max";
import RecordDetailTab from "./components/RecordDetailTab";
import RecordDataInfo from "./components/RecordDataInfo";

function RecordDetail() {
  const location = useLocationWithQuery();
  const [recordData, setRecordData] = useState(null);
  const dispatch = useDispatch();

  const [, projectId, recordId] =
    pathToRegexp("/projects/:projectId/:recordId/:tabName").exec(
      location.pathname
    ) || [];

  useEffect(() => {
    refreshRecordData();
  }, []);

  const refreshRecordData = () => {
    getProjectDataDetail({ recordId: Number(recordId), projectId })
      .then((resp) => {
        setRecordData(resp.data);
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)));
  };

  return (
    <>
      <RecordDetailHeader
        recordData={recordData}
        projectId={projectId}
        dispatch={dispatch}
        onRefresh={refreshRecordData}
      />
      <Card style={{ marginTop: 16, height: "100%" }}>
        <Row>
          <Col span={16} style={{ borderRight: "1px solid #dcdfe3" }}>
            <RecordDetailTab recordData={recordData} />
          </Col>
          <Col span={8}>
            <RecordDataInfo recordData={recordData} />
          </Col>
        </Row>
      </Card>
    </>
  );
}

export default RecordDetail;
