import { useEffect, useState } from "react";
import { message } from "antd";
import { connect } from "react-redux";
import WorkerList, { UserFilter } from "@/components/WorkerList";
import {
  activeBpoUser,
  assignRole,
  createBpoUser,
  deleteBpoUser,
  getAllRoles,
  getBpoUserList,
  getBpoUserTags,
} from "@/services/user";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { Role, RoleType } from "@/types/auth";
import { Tag } from "@/pages/bpo/components/BPOTagComponent";
import { ConnectState } from "@/models/connect";
import { NewUser, UserStatus } from "@/types/user";
import { pathToRegexp } from "path-to-regexp";
import { getBpoDetail } from "@/services/vm";
import { HttpStatus } from "@/types/http";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { BPO, BPOActiveStatus } from "@/types/vm";

function BpoWorkerList() {
  const [loading, setLoading] = useState(false);
  const location = useLocationWithQuery();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [workerNum, setWorkerNum] = useState({ count: 0, limit: 0 });
  const [bpoInfo, setBpoInfo] = useState<BPO>(null);
  const pathSegments: string[] =
    pathToRegexp(`/bpo/:jobId/workforce`).exec(location.pathname) || [];
  const [, bpoId] = pathSegments;
  const getRoles = async () => {
    try {
      const resp = await getAllRoles();
      setRoles(resp.data.filter((item: Role) => item.type === RoleType.BPO));
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };
  const addWorker = (values: NewUser) => {
    return createBpoUser({ ...values, bpoId });
  };
  const deleteWorker = (userId: string | number) => {
    return deleteBpoUser({ userId, bpoId });
  };
  const enableWorker = (userId: string | number) => {
    return activeBpoUser({ userId, bpoId, activeStatus: UserStatus.ACTIVE });
  };
  const roleChange = (userId: string | number, roleId: string[]) => {
    return assignRole({ userId, bpoId, roleId });
  };
  const disableWorker = (userId: string | number) => {
    return activeBpoUser({ userId, bpoId, activeStatus: UserStatus.INACTIVE });
  };
  const getTags = async () => {
    try {
      const resp = await getBpoUserTags(bpoId);
      setTags(resp.data || []);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };
  const getDetail = async () => {
    try {
      const resp = await getBpoDetail(bpoId);
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      } else {
        setWorkerNum({
          count: resp.data.currentWorkerNumber,
          limit: resp.data.workerNumber,
        });
        setBpoInfo(resp.data);
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  const getUsers = async (
    filterValues: UserFilter,
    sortInfo: Record<string, any>
  ) => {
    setLoading(true);
    try {
      const resp = await getBpoUserList({
        ...filterValues,
        ...(sortInfo || {}),
        bpoId,
      });
      setUsers(resp.data.results);
      setTotal(resp.data.totalElements);
      getDetail();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getRoles();
    getTags();
  }, []);
  return (
    <WorkerList
      isBpo
      bpoId={bpoId}
      bpoName={bpoInfo?.name}
      disabled={bpoInfo?.activeStatus === BPOActiveStatus.INACTIVE}
      tags={tags}
      roles={roles}
      users={users}
      total={total}
      loading={loading}
      workerNum={workerNum}
      deleteUser={deleteWorker}
      addUser={addWorker}
      disableUser={disableWorker}
      enableUser={enableWorker}
      getUsers={getUsers}
      tagRefresh={getTags}
      roleChange={roleChange}
      type={RoleType.BPO}
    />
  );
}

function mapStateToProps({ user }: ConnectState) {
  return {
    currentUser: user.currentUser,
  };
}

export default connect(mapStateToProps)(BpoWorkerList);
