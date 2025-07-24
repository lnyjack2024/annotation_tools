import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import Modal from 'src/components/common/modal/Modal';
import { Warning } from '../../../common/icons';
import ImagePreview from '../../../common/modal/ImagePreview';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewResult, ReviewMode } from '../../types';
import ValidationPanelReviews, { ValidationPanelReviewsHandle } from './ValidationPanelReviews';

const ValidationPanel = observer(() => {
  const reviews = store.review.allReviews.filter((r) => r.result === ReviewResult.REJECT);
  const [previewImg, setPreviewImg] = useState('');
  const [deleteType, setDeleteType] = useState('');
  const [deleteItemsAmount, setDeleteItemsAmount] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const [isModalVisibile, setIsModalVisibile] = useState(false);
  const ValidationPanelReviewsRef = useRef<ValidationPanelReviewsHandle>(null);

  const showConfirmModal = (amount: number, type?: string) => {
    setIsModalVisibile(true);
    setDeleteItemsAmount(amount);
    setDeleteType(type || '');
  };

  const handleDeleteOk = () => {
    if (ValidationPanelReviewsRef && ValidationPanelReviewsRef.current) {
      if (!deleteType) {
        ValidationPanelReviewsRef.current.deleteAllByCollapsePanel();
      } else if (deleteType === 'deleteItemsBySelected') {
        ValidationPanelReviewsRef.current.deleteItemsBySelected();
      }
    }
    setIsModalVisibile(false);
  };

  const handleDeleteCancel = () => {
    setIsModalVisibile(false);
    setDeleteType('');
  };

  return (
    <div className="scroller">
      <div className="sidebar-validation-header">
        <div>
          <Warning />
          <span style={{ paddingLeft: 8 }}>
            {i18n.translate('VALIDATION_TITLE', { values: { count: store.review.warningCount } })}
          </span>
        </div>
      </div>
      <div className="sidebar-validation-content">
        <Collapse
          activeKey={activeKey}
          onChange={(activeKeys) => setActiveKey(activeKeys)}
          ghost
          expandIcon={({ isActive }) => (
            <CaretRightOutlined
              style={{
                ...isActive ? {
                  top: 11,
                  transform: 'rotate(90deg)',
                } : {
                  color: 'rgba(255, 255, 255, 0.6)',
                },
              }}
            />
          )}
        >
          {!store.isLabeling && reviews && reviews.length > 0 && (
            <Collapse.Panel
              forceRender
              key="reviews"
              className="collapse-panel-reviews"
              header={(
                <div className="collapse-header-customer-wrapper">
                  <div
                    className="collapse-header-customer"
                  >
                    {i18n.translate('VALIDATION_REVIEWS')}
                    <div className="collapse-title-extra">
                      <span className="result-count">
                        {reviews.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            >
              <ValidationPanelReviews
                ref={ValidationPanelReviewsRef}
                setPreviewImg={setPreviewImg}
                showConfirmModal={showConfirmModal}
              />
            </Collapse.Panel>
          )}
        </Collapse>
      </div>
      {previewImg && <ImagePreview maskClosable src={previewImg} onClose={() => setPreviewImg('')} />}
      {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
        <Modal
          title={i18n.translate('VALIDATION_REVIEW_DELETE_TITLE')}
          maskClosable={false}
          visible={isModalVisibile}
          className="reviews-delete-modal"
          draggable={false}
          onClose={handleDeleteCancel}
        >
          <p style={{ padding: 12 }}>
            {deleteType === 'deleteItemsBySelected' ? (
              <span>
                {i18n.translate('VALIDATION_REVIEW_DELETE_SELECTED_ITEMS')}
                {i18n.translate('VALIDATION_REVIEW_DELETE_AMOUNT', { values: { deleteItemsAmount } })}
              </span>
            ) : (
              <span>
                {i18n.translate('VALIDATION_REVIEW_DELETE_ALL_BELONG')}
                {i18n.translate('VALIDATION_REVIEW_DELETE_AMOUNT', { values: { deleteItemsAmount } })}
              </span>
            )}
          </p>

          <div className="review-action">
            <div
              className="review-btn cancel"
              onClick={handleDeleteCancel}
            >
              {i18n.translate('COMMON_CANCEL')}
            </div>
            <div
              className="review-btn confirm"
              onClick={handleDeleteOk}
            >
              {i18n.translate('COMMON_OK')}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});

export default ValidationPanel;
