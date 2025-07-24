import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { Outlet, history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "redux";

import type { ConnectState } from "@/models/connect";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

interface Props {
  children?: ReactNode;
  dispatch: Dispatch;
  assignedNum: number;
}

const { TabPane } = Tabs;

enum TaskTabKey {
  todo = "todo",
  assigned = "assigned",
  history = "history",
}

function WorkerJobs({ children, dispatch, assignedNum }: Props) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();

  const [activeTabKey, setActiveTabKey] = useState<TaskTabKey>(TaskTabKey.todo);

  const TaskTabs = [
    {
      name: formatMessage({ id: "menu.tasks.todo" }),
      key: TaskTabKey.todo,
      path: "/worker-jobs/tasks/in-progress",
    },
    {
      name: formatMessage({ id: "menu.tasks.assigned" }),
      key: TaskTabKey.assigned,
      path: "/worker-jobs/tasks/pending",
    },
    {
      name: formatMessage({ id: "menu.tasks.history" }),
      key: TaskTabKey.history,
      path: "/worker-jobs/tasks/history",
    },
  ];

  useEffect(() => {
    setActiveTabKey(
      TaskTabs.find((item) => location.pathname.endsWith(item.path))?.key
    );
    dispatch({ type: "workerJob/getAssignedJobsNum" });
  }, [location.pathname]);

  return (
    <HeaderContentWrapperComponent
      title={TaskTabs.find((item) => item.key === activeTabKey)?.name}
    >
      <Tabs
        defaultActiveKey={activeTabKey}
        style={{ margin: "-24px -24px 8px" }}
        tabBarStyle={{ background: "white", paddingLeft: 48 }}
        activeKey={activeTabKey}
        onChange={(tab) => {
          const { path } = TaskTabs.find((item) => item.key === tab);
          router.push({
            pathname: path,
          });
        }}
      >
        {TaskTabs.map((item) => {
          return (
            <TabPane
              tab={
                item.key === TaskTabKey.assigned ? (
                  <span>
                    {item.name}{" "}
                    <span style={{ color: "#f56c6c" }}>({assignedNum})</span>
                  </span>
                ) : (
                  item.name
                )
              }
              key={item.key}
            />
          );
        })}
      </Tabs>
      <Outlet />
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ workerJob }: ConnectState) {
  return {
    assignedNum: workerJob.assignedNum,
  };
}

export default connect(mapStateToProps)(WorkerJobs);
