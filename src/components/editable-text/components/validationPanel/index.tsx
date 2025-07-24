import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import cx from 'classnames';
import Modal from 'src/components/common/modal/Modal';
import localMessage from '../../locale';
import { Warning, Sync } from '../../../common/icons';
import store from '../../store/RootStore';
import { ReviewMode, ValidationType } from '../../types';
import ValidationPanelReviews, { ValidationPanelReviewsHandle } from './validationPanelReviews';
import ValidationItem from './ValidationItem';

const ValidationPanel = observer(() => {
  const [activeKey, setActiveKey] = useState<ValidationType | ValidationType[]>([ValidationType.SCRIPT]);
  const [isModalVisibile, setIsModalVisibile] = useState(false);
  const [deleteItemsAmount, setDeleteItemsAmount] = useState<number | null>(null);

  const ValidationPanelReviewsRef = useRef<ValidationPanelReviewsHandle>(null);

  const titles = {
    [ValidationType.SCRIPT]: localMessage('VALIDATION_TYPE_SCRIPT'),
  };

  const showConfirmModal = (amount: number) => {
    setIsModalVisibile(true);
    setDeleteItemsAmount(amount);
  };

  const handleDeleteOk = () => {
    if (ValidationPanelReviewsRef && ValidationPanelReviewsRef.current) {
      ValidationPanelReviewsRef.current.deleteItemsBySelected();
    }
    setIsModalVisibile(false);
  };

  const handleDeleteCancel = () => {
    setIsModalVisibile(false);
  };

  const renderWarnings = (type: ValidationType) => {
    const warnings = store.validation.warnings.filter((w) => w.type === type);
    if (warnings.length <= 0) {
      return null;
    }
    return (
      <Collapse.Panel
        key={type}
        header={titles[type]}
        extra={(
          <div>
            <span className="result-count">
              {warnings.length}
            </span>
          </div>
        )}
      >
        {warnings.map((warning) => <ValidationItem key={warning.id} warning={warning} />)}
      </Collapse.Panel>
    );
  };
  return (
    <div className="scroller">
      <div className="sidebar-validation-header">
        <div>
          <Warning />
          <span style={{ paddingLeft: 8 }}>
            {localMessage('VALIDATION_TITLE', { values: { count: store.validation.warningCount } })}
          </span>
        </div>
        <div>
          <div
            className={cx('icon-button', {
              spinning: store.validation.checking,
            })}
            onClick={store.validation.sync}
          >
            <Sync />
          </div>
        </div>
      </div>
      <div className="sidebar-validation-content">
        <Collapse
          activeKey={activeKey}
          onChange={(activeKeys) => setActiveKey(activeKeys as (ValidationType | ValidationType[]))}
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
          {store.review.unPassedCount > 0 && (
            <Collapse.Panel
              forceRender
              key="reviews"
              className="collapse-panel-reviews"
              header={(
                <div className="collapse-header-customer-wrapper">
                  <div
                    className="collapse-header-customer"
                  >
                    {localMessage('VALIDATION_REVIEWS')}
                    <div style={{ display: 'flex' }}>
                      <div className="collapse-title-extra">
                        <span className="result-count">
                          {store.review.unPassedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            >
              <ValidationPanelReviews
                ref={ValidationPanelReviewsRef}
                showConfirmModal={showConfirmModal}
              />
            </Collapse.Panel>
          )}
          {Object.values(ValidationType).map((type) => renderWarnings(type))}
        </Collapse>
      </div>
      {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
        <Modal
          title={localMessage('VALIDATION_REVIEW_DELETE_TITLE')}
          maskClosable={false}
          visible={isModalVisibile}
          className="reviews-delete-modal"
          draggable={false}
          onClose={handleDeleteCancel}
        >
          <p style={{ padding: 12 }}>
            <span>
              {localMessage('VALIDATION_REVIEW_DELETE_SELECTED_ITEMS')}
              {localMessage('VALIDATION_REVIEW_DELETE_AMOUNT', { values: { deleteItemsAmount } })}
            </span>
          </p>

          <div className="review-action">
            <div
              className="review-btn cancel"
              onClick={handleDeleteCancel}
            >
              {localMessage('cancel')}
            </div>
            <div
              className="review-btn confirm"
              onClick={handleDeleteOk}
            >
              {localMessage('confirm')}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});

export default ValidationPanel;
