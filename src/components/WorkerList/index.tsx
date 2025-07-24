import { useEffect, useState } from "react";
import { FormattedMessage, useIntl, history, useModel } from "@umijs/max";
import { EditOutlined, EllipsisOutlined } from "@ant-design/icons";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Divider,
  Dropdown,
  Menu,
  message,
  Table,
  TablePaginationConfig,
} from "antd";
import FilterFormComponent from "@/components/FilterFormComponent";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import { BaseResp, FormItem, FormItemType } from "@/types/common";
import { GlobalTag } from "@/types/vm";
import AddWorkerModal from "@/pages/workforce/components/AddWorkerModal";
import AddUserSuccessModal from "@/components/AddUserSuccessModal";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { ColumnProps } from "antd/es/table";
import { BPOUser, NewUser, User, UserStatus } from "@/types/user";
import { Role } from "@/types/auth";
import CopyToClipboard from "react-copy-to-clipboard";
import GlobalTagsAction from "@/pages/workforce/components/GlobalTagsAction";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import RoleEditModal from "@/components/WorkerList/RoleEditModal";
import SafeDeleteUser from "@/components/SafeDeleteUser";
import { SorterResult } from "antd/lib/table/interface";
import { enableEmailAuth } from "@/utils";

interface Props {
  isBpo?: boolean;
  disabled?: boolean;
  bpoId?: string;
  bpoName?: string;
  loading: boolean;
  total: number;
  workerNum: { count: number; limit: number };
  users: User[];
  roles: Role[];
  tags: GlobalTag[];
  type: string;
  tagRefresh: () => void;
  deleteUser: (userId: number | string) => PromiseLike<BaseResp<User>>;
  enableUser: (userId: number | string) => PromiseLike<BaseResp<User>>;
  disableUser: (userId: number | string) => PromiseLike<BaseResp<User>>;
  roleChange: (
    userId: number | string,
    roleId: string[]
  ) => PromiseLike<BaseResp<User>>;
  addUser: (user: NewUser) => PromiseLike<BaseResp<User>>;
  getUsers: (values: UserFilter, sortInfo?: Record<string, any>) => void;
}

export enum OperationType {
  CREATE = "CREATE",
  RESET = "RESET",
}

enum ActionType {
  ADD = "ADD",
  DELETE = "DELETE",
  ACTIVATE = "ACTIVATE",
  INACTIVATE = "INACTIVATE",
  ROLE_CHANGE = "ROLE_CHANGE",
}

export type UserFilter = {
  pageIndex: number;
  pageSize: number;
  name?: string;
  role?: number;
  tags?: string[];
  activeStatus?: string;
};

function WorkerList({
  isBpo = false,
  disabled = false,
  bpoId = "",
  bpoName = "",
  loading,
  total,
  workerNum,
  users,
  roles,
  tags,
  type,
  tagRefresh,
  deleteUser,
  enableUser,
  disableUser,
  addUser,
  getUsers,
  roleChange,
}: Props) {
  const { formatMessage } = useIntl();
  const { initialState } = useModel("@@initialState");
  const [filterValues, setFilterValues] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [visible, setVisible] = useState(false);
  const [resetUser, setResetUser] = useState<User>(null);
  const [roleUser, setRoleUser] = useState<User>(null);
  const [createdWorker, setCreatedWorker] = useState(null);
  const [sortInfo, setSortInfo] = useState(null);
  const [operationMode, setOperationMode] = useState<OperationType>(null);
  const { currentUser } = initialState;

  const filterFormItems: FormItem[] = [
    {
      key: "name",
      label: formatMessage({ id: "common.username" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    {
      key: "role",
      label: formatMessage({ id: "bpo-worker.table.column.role" }),
      options: roles,
      optionValueKey: "code",
      optionLabel: (item: Role) =>
        formatMessage({ id: `common.role.${item.name}` }),
      type: FormItemType.Single,
      allowClear: true,
    },
    // bpoId
    //   ? null
    //   : {
    //       key: 'tags',
    //       label: formatMessage({ id: 'bpo-list.bpo.tags' }),
    //       type: FormItemType.Multiple,
    //       options: tags,
    //       optionLabelKey: 'name',
    //       optionValueKey: 'id',
    //       allowClear: true,
    //     },
    {
      key: "activeStatus",
      label: formatMessage({ id: "bpo-list.bpo.status" }),
      type: FormItemType.Single,
      options: Object.keys(UserStatus),
      optionLabel: (item: string) =>
        formatMessage({ id: `common.user.status.${item.toLowerCase()}` }),
      allowClear: true,
    },
    enableEmailAuth()
      ? {
          key: "email",
          label: formatMessage({ id: "common.email" }),
          type: FormItemType.Text,
          allowClear: true,
        }
      : null,
  ].filter((item) => !!item);

  const getActions = (record: User) => {
    return [
      record.activeStatus === UserStatus.TO_BE_ACTIVE ? (
        <CopyToClipboard
          key="copyToClipboard"
          text={formatMessage(
            { id: "common.username.copy.text" },
            { username: record.uniqueName, password: record.initialPassword }
          )}
          onCopy={() => message.success("Copy Successfully")}
        >
          <Button type="link">
            {formatMessage({ id: "common.username.copy" })}
          </Button>
        </CopyToClipboard>
      ) : (
        <Button
          key="reset"
          type="link"
          onClick={() => setResetUser(record)}
          disabled={disabled}
        >
          {formatMessage({ id: "menu.password-forget" })}
        </Button>
      ),
      <SafeDeleteUser
        user={record}
        disabled={disabled}
        onDelete={() => handleAction(ActionType.DELETE, record)}
      />,
      record.activeStatus === UserStatus.INACTIVE && (
        <Menu.Item
          style={{ textAlign: "center" }}
          key="activate"
          onClick={() => handleAction(ActionType.ACTIVATE, record)}
        >
          <Button type="link" disabled={disabled}>
            {formatMessage({ id: "bpo-list.bpo.operation.activate" })}
          </Button>
        </Menu.Item>
      ),
      record.activeStatus === UserStatus.ACTIVE && (
        <Menu.Item
          style={{ textAlign: "center" }}
          key="inactivate"
          onClick={() => handleAction(ActionType.INACTIVATE, record)}
        >
          <Button type="link" danger disabled={disabled}>
            {formatMessage({
              id: "bpo-list.bpo.operation.inactivate",
            })}
          </Button>
        </Menu.Item>
      ),
    ].filter((item) => !!item);
  };

  const editRole = (user: User) => {
    setRoleUser(user);
  };

  const columns: ColumnProps<User>[] = [
    {
      key: "uniqueName",
      title: formatMessage({ id: "common.username" }),
      dataIndex: "uniqueName",
      render: (uniqueName: string) => {
        return (
          <span>
            {uniqueName === currentUser.name && (
              <span
                style={{
                  float: "left",
                  width: 28,
                  height: 22,
                  marginRight: 8,
                  background: "#227a7a",
                  borderRadius: 2,
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                {formatMessage({ id: "common.me" })}
              </span>
            )}
            {uniqueName}
          </span>
        );
      },
    },
    {
      key: "role",
      title: formatMessage({ id: "bpo-worker.table.column.role" }),
      dataIndex: "role",
      render: (roleIds: number[], record: User) => {
        const currentRoles =
          roles.length > 0
            ? (roleIds || [])
                .map((roleId) => roles.find((item) => item.id === roleId))
                .filter((i) => i)
            : [];
        const isSuperAdmin = !!currentRoles.find((item) => !item.type);

        const roleDisplayText = currentRoles
          .map((item) => formatMessage({ id: `common.role.${item.name}` }))
          .join(", ");

        return (
          <div>
            {roleDisplayText}
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={isSuperAdmin || disabled}
              onClick={() => editRole(record)}
            />
          </div>
        );
      },
    },
    // bpoId
    //   ? null
    //   : {
    //       key: 'bpo-tags',
    //       title: formatMessage({ id: 'bpo-worker.table.column.tag' }),
    //       render: (record: User) => {
    //         return (
    //           <WorkerTagsAction
    //             tags={tags}
    //             user={record}
    //             isBpo={isBpo}
    //             onRefresh={() => getUsers(filterValues)}
    //           />
    //         );
    //       },
    //     },
    {
      key: "activeStatus",
      title: formatMessage({ id: "bpo-list.bpo.status" }),
      dataIndex: "activeStatus",
      render: (activeStatus: string) => {
        return (
          <Badge
            color={
              activeStatus === UserStatus.ACTIVE
                ? "#52c41a"
                : activeStatus === UserStatus.TO_BE_ACTIVE
                ? "#f56c6c"
                : "#7a869a"
            }
            text={
              <FormattedMessage
                id={`common.user.status.${activeStatus.toLowerCase()}`}
              />
            }
          />
        );
      },
    },
    {
      key: "latestLoginTime",
      title: formatMessage({ id: "common.last.login" }),
      dataIndex: "latestLoginTime",
      sorter: true,
    },
    enableEmailAuth()
      ? {
          key: "email",
          title: formatMessage({ id: "common.email" }),
          dataIndex: "email",
        }
      : null,
    {
      key: "operation",
      title: formatMessage({ id: "common.operation" }),
      render: (record: User) => {
        if (record.uniqueName === currentUser.name) {
          return null;
        }
        const superAdminRole = roles.find((item) => !item.type);
        const isSuperAdmin = !!(record.role || []).find(
          (item) => item === superAdminRole?.id
        );
        if (isSuperAdmin) {
          return null;
        }
        const actions = getActions(record);
        if (actions.length === 0) {
          return null;
        }
        return (
          <>
            {actions[0]}
            {actions.length > 1 && (
              <Dropdown
                placement="bottomRight"
                trigger={["hover"]}
                overlay={
                  <Menu style={{ textAlign: "center" }}>
                    {actions.slice(1)}
                  </Menu>
                }
              >
                <EllipsisOutlined
                  style={{ cursor: "pointer", fontSize: 20 }}
                  disabled={disabled}
                />
              </Dropdown>
            )}
          </>
        );
      },
    },
  ].filter((item) => !!item);

  const handleAction = async (
    type: ActionType,
    user: User | BPOUser | NewUser,
    values: Record<string, any> = {}
  ) => {
    try {
      const userId = isBpo ? (user as BPOUser).workerId : (user as User).id;
      let resp;
      switch (type) {
        case ActionType.ADD:
          resp = await addUser(user);
          if (resp.data) {
            setCreatedWorker(resp.data);
            setVisible(false);
          }
          break;
        case ActionType.DELETE:
          resp = await deleteUser(userId);
          break;
        case ActionType.ACTIVATE:
          resp = await enableUser(userId);
          break;
        case ActionType.INACTIVATE:
          resp = await disableUser(userId);
          break;
        case ActionType.ROLE_CHANGE:
          resp = await roleChange(userId, values.roleId);
          break;
      }
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      } else {
        setRoleUser(null);
        await getUsers(filterValues);
      }
      return resp;
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }

    return null;
  };

  const handleTableChange = (
    pageParam: TablePaginationConfig,
    filterParam: any,
    newSorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    const { order } = newSorter as SorterResult<User>;

    let mappedOrder;

    switch (order) {
      case "descend":
        mappedOrder = "DESC";
        break;
      case "ascend":
        mappedOrder = "ASC";
        break;
      default:
        mappedOrder = null;
    }

    setSortInfo({ sortByLatestTime: mappedOrder });
  };

  useEffect(() => {
    getUsers(filterValues, sortInfo);
  }, [filterValues, sortInfo]);

  return (
    <HeaderContentWrapperComponent
      title={
        bpoId
          ? formatMessage({ id: "bpo.title.name" }, { name: bpoName })
          : formatMessage({
              id: "menu.workforce",
            })
      }
      backTitle={
        bpoId ? (
          <Breadcrumb>
            <Breadcrumb.Item
              onClick={(e) => {
                e.preventDefault();
                history.replace("/bpo-list");
              }}
            >
              {formatMessage({ id: "menu.vm.bpo-list" })}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {formatMessage({ id: "menu.workers-management" })}
            </Breadcrumb.Item>
          </Breadcrumb>
        ) : null
      }
      actions={[
        <span key="workerNum" style={{ color: "#3e5270", marginRight: 16 }}>
          {formatMessage({ id: "common.user.count" }, workerNum)}
        </span>,
        <Button
          key="worker"
          type="primary"
          disabled={workerNum.limit <= workerNum.count || disabled}
          onClick={() => setVisible(true)}
        >
          {formatMessage({ id: "job-detail.workforce.add" })}
        </Button>,
        bpoId ? null : (
          <GlobalTagsAction
            key="bpo-tags"
            tags={tags}
            onRefresh={tagRefresh}
            isBpo={isBpo}
          />
        ),
      ]}
    >
      <Card bordered={false} className="with-shadow" style={{ marginTop: 20 }}>
        <FilterFormComponent
          formItems={filterFormItems}
          formStyle={{ marginBottom: 0 }}
          formItemStyle={{ marginBottom: 15 }}
          initialValue={filterValues}
          onFilterValueChange={(val) =>
            setFilterValues({
              ...val,
              pageIndex: 0,
              pageSize: filterValues.pageSize,
            })
          }
          searchMode="click"
        />
        <Divider style={{ margin: "0 0 15px" }} />
        <Table
          scroll={{ x: "max-content" }}
          className="tableStriped"
          rowKey="id"
          columns={columns}
          dataSource={users}
          onChange={handleTableChange}
          pagination={{
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showSizeChanger: true,
            current: filterValues.pageIndex + 1,
            pageSize: filterValues.pageSize,
            total,
            onChange: (page: number, size: number) =>
              setFilterValues({
                ...filterValues,
                pageIndex: page - 1,
                pageSize: size,
              }),
            showTotal: (total: number) =>
              formatMessage({ id: "common.total.items" }, { items: total }),
          }}
          loading={loading}
        />
        <AddWorkerModal
          visible={visible}
          onSave={(user: NewUser) => {
            // TODO we should handle the following type issue
            return handleAction(ActionType.ADD, user);
          }}
          roles={roles.filter((item) => item.type === type)}
          tags={tags}
          onClose={() => setVisible(false)}
        />
        <AddUserSuccessModal
          username={createdWorker?.uniqueName}
          password={createdWorker?.initialPassword}
          type={operationMode}
          visible={!!createdWorker}
          onClose={() => {
            setCreatedWorker(null);
            getUsers(filterValues);
          }}
        />
        <ResetPasswordModal
          user={resetUser}
          visible={!!resetUser}
          onSuccess={(user: User) => {
            setCreatedWorker(user);
            setOperationMode(OperationType.RESET);
            setResetUser(null);
          }}
          onClose={() => setResetUser(null)}
        />
        <RoleEditModal
          user={roleUser}
          onClose={() => setRoleUser(null)}
          roles={roles.filter((item) => item.type === type)}
          onUpdate={(v) =>
            handleAction(ActionType.ROLE_CHANGE, roleUser, { roleId: v })
          }
        />
      </Card>
    </HeaderContentWrapperComponent>
  );
}

export default WorkerList;
