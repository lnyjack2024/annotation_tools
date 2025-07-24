import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import type { ModalFuncProps } from "antd/lib/modal/Modal";
import { history, useIntl } from "@umijs/max";
// import { debounce } from 'lodash';

import TemplateSelectionList, {
  // TemplateCategory,
  TemplateTypeCategoryMap,
} from "@/pages/project/template-center/components/TemplateSelectionList";
import { openTemplatePreviewPageV3, queryToSearch } from "@/utils/utils";
import { getTemplateTypes } from "@/services/template-v3";

type Props = {
  projectId: string;
} & ModalFuncProps;

const TemplateCreationModal: React.FC<Props> = ({
  projectId,
  onCancel,
  ...modalProps
}) => {
  const { formatMessage } = useIntl();
  // const [activeTab, setActiveTab] = useState<string>();
  const [categories, setCategories] = useState<string[]>([]);
  const containerRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    getTemplateTypes().then((resp) => {
      const templateTypes = resp.data;
      const tabs = new Set<string>();
      templateTypes.forEach((templateType: string) => {
        if (templateType in TemplateTypeCategoryMap) {
          tabs.add(TemplateTypeCategoryMap[templateType].category);
        }
      });

      setCategories([...tabs]);
    });
  }, []);

  // const handleScroll = debounce(() => {
  //   const { scrollTop, clientHeight } = containerRef.current;
  //   const containerTop = scrollTop;
  //   const containerBottom = scrollTop + clientHeight;
  //
  //   const matched: TemplateCategory[] = [];
  //   // TODO cache the DOM
  //   Object.values(TemplateCategory).forEach((id) => {
  //     const el = document.getElementById(id);
  //
  //     const eleTop = el.offsetTop;
  //     const eleBottom = eleTop + el.clientHeight;
  //
  //     const match =
  //       (eleTop >= containerTop && eleBottom <= containerBottom) ||
  //       (eleTop < containerTop && containerTop < eleBottom) ||
  //       (eleTop < containerBottom && containerBottom < eleBottom);
  //
  //     if (match) {
  //       matched.push(id);
  //     }
  //   });
  //
  //   setActiveTab(matched[0]);
  // }, 300);

  return (
    <Modal
      title={
        <>
          <h3 style={{ fontSize: 18, color: "#42526E" }}>
            {formatMessage({ id: "choose-template-type" })}
          </h3>
        </>
      }
      width={1024}
      wrapClassName="custom-modal"
      // bodyStyle={{ height: 620, overflowY: 'auto' }}
      footer={null}
      maskClosable={false}
      onCancel={onCancel}
      {...modalProps}
    >
      <div
        ref={containerRef}
        style={{ height: 560, overflowY: "auto", overflowX: "hidden" }}
        // onScroll={handleScroll}
      >
        <TemplateSelectionList
          categories={categories}
          onTemplateSelect={(templateId) => {
            onCancel?.();
            history.push({
              pathname: `/projects/${projectId}/template-center/edit`,
              search: queryToSearch({
                templateId,
                action: "CREATE",
              }),
            });
          }}
          onTemplatePreview={(templateId) => {
            openTemplatePreviewPageV3({
              templateId,
              projectId,
            });
          }}
        />
      </div>
    </Modal>
  );
};

export default TemplateCreationModal;
