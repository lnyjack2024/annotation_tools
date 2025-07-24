import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { message } from "antd";
import type { GlobalTag } from "@/types/vm";
import {
  activateUser,
  assignRole,
  createUser,
  deleteUser,
  getAllRoles,
  getPrivateUserCount,
  getPrivateUserLimit,
  getUserList,
  getUserTags,
  inactivateUser,
  UserFilter,
} from "@/services/user";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { Role, RoleType } from "@/types/auth";
import { ConnectState } from "@/models/connect";
import WorkerList from "@/components/WorkerList";
import { NewUser } from "@/types/user";

function WorkforceManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tags, setTags] = useState<GlobalTag[]>([]);
  const [total, setTotal] = useState(0);
  const [workerNum, setWorkerNum] = useState({ count: 0, limit: 0 });

  const addWorker = (values: NewUser) => {
    return createUser(values);
  };

  const getRoles = async () => {
    try {
      const resp = await getAllRoles();
      setRoles(
        resp.data.filter(
          (item) => item.type !== RoleType.BPO && item.name !== "Auditor"
        )
      );
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const getTags = async () => {
    try {
      const resp = await getUserTags();
      setTags(resp.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const getUsers = async (
    filterValues: UserFilter,
    sortInfo: Record<string, any>
  ) => {
    setLoading(true);
    try {
      const resp = await getUserList({ ...filterValues, ...(sortInfo || {}) });
      setUsers(resp.data.results);
      setTotal(resp.data.totalElements);
      getCount();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = (userId: string | number) => {
    return deleteUser({ userId });
  };
  const enableWorker = (userId: string | number) => {
    return activateUser({ userId });
  };
  const disableWorker = (userId: string | number) => {
    return inactivateUser({ userId });
  };
  const getCount = () => {
    Promise.all([getPrivateUserCount(), getPrivateUserLimit()])
      .then((resp) => {
        const [countResp, limitResp] = resp;
        setWorkerNum({ count: countResp.data, limit: limitResp.data });
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)));
  };
  const roleChange = (userId: number | string, roleId: string[]) => {
    return assignRole({ userId, roleId });
  };

  useEffect(() => {
    getRoles();
    getTags();
  }, []);

  return (
    <WorkerList
      tags={tags}
      roles={roles}
      users={users}
      workerNum={workerNum}
      total={total}
      loading={loading}
      deleteUser={deleteWorker}
      addUser={addWorker}
      disableUser={disableWorker}
      enableUser={enableWorker}
      getUsers={getUsers}
      tagRefresh={getTags}
      roleChange={roleChange}
      type={RoleType.INTERNAL}
    />
  );
}

function mapStateToProps({ user }: ConnectState) {
  return {
    currentUser: user.currentUser,
  };
}

export default connect(mapStateToProps)(WorkforceManagement);
