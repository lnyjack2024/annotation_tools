import { Card, Divider, Button, message } from "antd";
import { BuildOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { Dispatch } from "redux";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import FilterFormComponent from "@/components/FilterFormComponent";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { ConnectState } from "@/models/connect";
import {
  deleteTags,
  updateBPOActiveStatus,
  updateBPOAndGlobalTags,
  addTags,
  deleteBpo,
} from "@/services/vm";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import type { BPO, GlobalTag } from "@/types/vm";
import { BPOActiveStatus, BPOTabs } from "@/types/vm";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";

import { mapStatusToErrorMessage } from "@/utils/utils";
import { HttpStatus } from "@/types/http";
import ApprovedBPOList from "../components/ApprovedBPOList";
import TagsModal from "../components/TagsModal";
import GlobalTagsModal from "../components/GlobalTagsModal";
import BPOCreateModal from "@/pages/bpo/superadmin/BPOCreateModal";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import AddUserSuccessModal from "@/components/AddUserSuccessModal";
import { User } from "@/types/user";

interface BPOListProp {
  globalTags: GlobalTag[];
  totalCount: number;
  bpoList: BPO[];
  dispatch: Dispatch;
  loadingBPO: boolean;
  loadingGlobalTags: boolean;
}

function BPOList({
  globalTags,
  totalCount,
  bpoList,
  dispatch,
  loadingBPO,
  loadingGlobalTags,
}: BPOListProp) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const { queryParams = "" } = location.query;
  const initialFilterValue: any = {
    bpoDisplayId: null,
    bpoName: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    province: [],
    tags: [],
    activeStatus: null,
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  };
  const [filterValues, setFilterValue] = useState(
    queryParams ? JSON.parse(queryParams as string) : initialFilterValue
  );
  const [globalTagsModalVisible, setGlobalTagsModalVisible] = useState(false);

  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedBPO, setSelectedBPO] = useState<BPO>();
  const [updating, setUpdating] = useState(false);
  const [currentBpoId, setCurrentBpoId] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);

  const filterFormItems: FormItem[] = [
    {
      key: "bpoCode",
      label: formatMessage({ id: "bpo-list.bpo.codename" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    {
      key: "bpoName",
      label: formatMessage({ id: "bpo-list.bpo.name" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    {
      key: "contactName",
      label: formatMessage({ id: "bpo-list.bpo.contactName" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    {
      key: "contactPhone",
      label: formatMessage({ id: "bpo-list.bpo.contactPhone" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    {
      key: "contactEmail",
      label: formatMessage({ id: "bpo-list.bpo.contactEmail" }),
      type: FormItemType.Text,
      allowClear: true,
    },
    // {
    //   key: 'tags',
    //   label: formatMessage({ id: 'bpo-list.bpo.tags' }),
    //   type: FormItemType.Multiple,
    //   options: globalTags || [],
    //   optionValueKey: 'id',
    //   optionLabelKey: 'name',
    //   allowClear: true,
    //   loading: loadingGlobalTags,
    // },
    {
      key: "activeStatus",
      label: formatMessage({ id: "bpo-list.bpo.status" }),
      type: FormItemType.Single,
      options: Object.keys(BPOActiveStatus),
      optionLabel: (item) =>
        formatMessage({ id: `bpo-list.bpo.status.${item.toLowerCase()}` }),
      allowClear: true,
    },
  ];

  const pagination = {
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    showSizeChanger: true,
    current: filterValues.pageIndex + 1,
    pageSize: filterValues.pageSize,
    total: totalCount,
    onChange: (page: number, size: number) =>
      setFilterValue({ ...filterValues, pageIndex: page - 1, pageSize: size }),
    showTotal: (total: number) =>
      formatMessage({ id: "common.total.items" }, { items: total }),
  };

  const getList = () => {
    dispatch({
      type: "bpoManagement/getBPOList",
      payload: {
        ...filterValues,
      },
    });
  };

  const getAllTags = () => {
    dispatch({ type: "bpoManagement/getGlobalTags" });
  };

  useEffect(() => {
    getAllTags();
  }, []);

  useEffect(() => {
    getList();
  }, [filterValues, dispatch]);

  const editTag = (bpo: BPO) => {
    setSelectedBPO(bpo);
    setTagsModalVisible(true);
  };

  const updateTags = (tagIds: string[]) => {
    setUpdating(true);
    updateBPOAndGlobalTags(selectedBPO.bpoId, tagIds)
      .then(() => {
        dispatch({
          type: "bpoManagement/getBPOList",
          payload: {
            ...filterValues,
            bpoStatusList: BPOTabs.APPROVED,
          },
        });
        dispatch({ type: "bpoManagement/getGlobalTags" });
        setTagsModalVisible(false);
      })
      .finally(() => setUpdating(false));
  };

  const updateActiveStatus = (bpoId: string, activeStatus: BPOActiveStatus) => {
    setUpdating(true);
    updateBPOActiveStatus(bpoId, activeStatus)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          getList();
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setUpdating(false));
  };

  const deleteCurrentBpo = (bpoId: string) => {
    deleteBpo(bpoId)
      .then(() => {
        getList();
      })
      .finally();
  };

  const addGlobalTag = (val: string) => {
    setUpdating(true);
    addTags(val)
      .then((resp) => {
        if (resp.status === HttpStatus.OK || resp.status === 40023) {
          dispatch({ type: "bpoManagement/getGlobalTags" });
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .finally(() => {
        setUpdating(false);
      });
  };

  const deleteGlobalTag = (id: string) => {
    setUpdating(true);
    deleteTags(id)
      .then((resp) => {
        if (resp.status !== HttpStatus.OK) {
          message.error(mapStatusToErrorMessage(resp));
        } else {
          dispatch({ type: "bpoManagement/getGlobalTags" });
        }
      })
      .finally(() => {
        setUpdating(false);
      });
  };

  return (
    <HeaderContentWrapperComponent
      title={formatMessage({ id: "menu.vm.bpo-list" })}
      titleIcon={<BuildOutlined />}
      actions={[
        // <Button
        //   key="tag"
        //   type="primary"
        //   onClick={() => setGlobalTagsModalVisible(true)}
        // >
        //   {formatMessage({ id: 'bpo-list.bpo.tag.global' })}
        // </Button>,
        <Button
          key="create"
          style={{ marginLeft: 8 }}
          onClick={() => setCreateModalVisible(true)}
        >
          {formatMessage({ id: "bpo-list.bpo.create" })}
        </Button>,
      ]}
    >
      <>
        <Card
          bordered={false}
          className="with-shadow"
          style={{ marginTop: 20 }}
        >
          <FilterFormComponent
            formItems={filterFormItems}
            formStyle={{ marginBottom: 0 }}
            formItemStyle={{ marginBottom: 15 }}
            initialValue={filterValues}
            onFilterValueChange={(val) =>
              setFilterValue({
                ...val,
                pageIndex: 0,
                pageSize: filterValues.pageSize,
              })
            }
            searchMode="click"
          />
          <Divider style={{ margin: "0 0 15px" }} />
          <ApprovedBPOList
            pagination={pagination}
            bpoList={bpoList}
            editTag={editTag}
            updateBPOActiveStatus={updateActiveStatus}
            updating={updating}
            loading={loadingBPO}
            onUpdate={(bpoId: string) => {
              setCurrentBpoId(bpoId);
              setCreateModalVisible(true);
            }}
            onDelete={deleteCurrentBpo}
          />
        </Card>
        <TagsModal
          visible={tagsModalVisible}
          tags={globalTags}
          selectedTags={selectedBPO?.tags || []}
          onCancel={() => setTagsModalVisible(false)}
          updateTags={updateTags}
          updating={updating}
        />
        <GlobalTagsModal
          visible={globalTagsModalVisible}
          tags={globalTags}
          onCancel={() => setGlobalTagsModalVisible(false)}
          addGlobalTag={addGlobalTag}
          deleteGlobalTag={deleteGlobalTag}
          updating={updating}
        />
        <BPOCreateModal
          bpoId={currentBpoId}
          allTags={globalTags}
          visible={createModalVisible}
          onSave={(user: User) => {
            setCurrentBpoId(null);
            setCreateModalVisible(false);
            setCreatedUser(user);
            getList();
          }}
          onClose={() => {
            setCurrentBpoId(null);
            setCreateModalVisible(false);
          }}
        />
        <AddUserSuccessModal
          username={createdUser?.uniqueName}
          password={createdUser?.initialPassword}
          visible={!!createdUser}
          onClose={() => setCreatedUser(null)}
        />
      </>
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ bpoManagement, loading }: ConnectState) {
  return {
    totalCount: bpoManagement.bpoCount,
    bpoList: bpoManagement.bpoList,
    globalTags: bpoManagement.globalTags,
    loadingBPO: loading.effects["bpoManagement/getBPOList"],
    loadingGlobalTags: loading.effects["bpoManagement/getGlobalTags"],
  };
}

export default connect(mapStateToProps)(BPOList);
