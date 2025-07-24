import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Select, Form } from 'antd';
import { ImageTextField } from '@appen-china/easy-form';
import ReviewItem from '../../model/ReviewItem';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewResult } from '../../types';
import './ReviewModal.scss';

export function getReviewRelatedInstanceInfo(review: ReviewItem) {
  const { instanceId, instanceItemId } = review;
  let infoStr;
  let instance;
  let instanceItem;
  if (instanceId) {
    // has related instance
    instance = store.instance.getInstanceById(instanceId);
    if (instance) {
      if (instanceItemId) {
        // has related instance item
        instanceItem = instance.items[instanceItemId];
        if (instanceItem) {
          infoStr = instanceItem.label;
        } else {
          infoStr = `${instance.label}-${i18n.translate('REVIEW_NO_ITEM')}`;
        }
      } else {
        infoStr = instance.label;
      }
    } else {
      infoStr = i18n.translate('REVIEW_NO_INSTANCE');
    }
  } else {
    infoStr = i18n.translate('REVIEW_NO_RELATED');
  }
  return { infoStr, instance, instanceItem };
}

const reviewModalWidth = 388;
const reviewModalHeightSmall = 140;
const reviewModalHeightLarge = 306;

const ReviewModal = observer(() => {
  const [typeError, setTypeError] = useState(false);
  const downPoint = useRef<{ x: number; y: number } | null>(null);
  const downPosition = useRef<{ x: number; y: number } | null>(null);
  const dropdownVisible = useRef(false);

  const { reviewModalVisible } = store.config;
  const { reviewLayer, reviewLayerOffset, selectedAnchor, editingReview, reviewResultTypes } = store.review;

  useEffect(() => {
    setTypeError(false);
  }, [editingReview, editingReview?.type, editingReview?.result]);

  const handleDelete = () => {
    if (editingReview && selectedAnchor) {
      store.review.deleteReview(editingReview, selectedAnchor);
      store.review.unselectReview();
      store.config.setReviewModalVisible(false);
    }
  };

  const handleSave = () => {
    if (editingReview) {
      if (editingReview.result === ReviewResult.REJECT && (!editingReview.type || editingReview.type.length <= 0)) {
        setTypeError(true);
        return;
      }
      store.review.updateReview(editingReview);
      store.review.unselectReview();
      store.config.setReviewModalVisible(false);
    }
  };

  if (!reviewModalVisible || !reviewLayer || !selectedAnchor || !editingReview) {
    return null;
  }

  const { x, y } = reviewLayer.toGlobal({ x: editingReview.x, y: editingReview.y });
  const left = x + reviewLayerOffset.x;
  const top = y + reviewLayerOffset.y;

  let modalLeft = left + 32;
  let modalTop = top - 32;
  const { clientWidth, clientHeight } = document.body;
  if (modalLeft + reviewModalWidth > clientWidth) {
    modalLeft = left - reviewModalWidth - 32;
  }
  const modalHeight = editingReview.result === ReviewResult.APPROVE ? reviewModalHeightSmall : reviewModalHeightLarge;
  if (modalTop + modalHeight > clientHeight) {
    modalTop = top - modalHeight;
  }
  return (
    <div
      className="review-modal-mask"
      onMouseMove={(e) => {
        if (downPosition.current && downPoint.current && reviewLayer) {
          const offsetX = e.clientX - downPosition.current.x;
          const offsetY = e.clientY - downPosition.current.y;
          const { x: px, y: py } = reviewLayer.toLocal({ x: downPoint.current.x + offsetX, y: downPoint.current.y + offsetY });
          selectedAnchor.setPosition(px, py);
          store.review.updateReviewInfo(editingReview, { x: px, y: py });
        }
      }}
      onMouseUp={() => {
        downPosition.current = null;
        downPoint.current = null;
      }}
      onMouseDown={() => {
        if (!dropdownVisible.current) {
          handleSave();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="review-anchor-ghost"
        style={{ left: left - 16, top: top - 30 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          downPosition.current = { x: e.clientX, y: e.clientY };
          downPoint.current = { x, y };
        }}
      />
      <div
        className="review-modal"
        style={{ width: reviewModalWidth, left: modalLeft, top: modalTop }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="review-modal-title">
          {i18n.translate('REVIEW_MODAL_LABEL')}
        </div>
        <div className="review-modal-content">
          <div className="review-info">
            {`[${getReviewRelatedInstanceInfo(editingReview).infoStr}]`}
            {`[${i18n.translate('FRAME_ATTRIBUTES_FRAME', { values: { frame: store.frame.currentFrame + 1 } })}]`}
          </div>
          <div className="review-result">
            {reviewResultTypes.map((type) => (
              <div
                key={type}
                className={cx('review-btn', {
                  [type]: true,
                  active: editingReview.result === type,
                })}
                onClick={() => store.review.updateReviewResult(editingReview, type, selectedAnchor)}
              >
                {i18n.translate(`REVIEW_${type.toUpperCase()}`)}
              </div>
            ))}
          </div>
          {editingReview.result !== ReviewResult.APPROVE && (
            <>
              <Form.Item
                required={editingReview.result === ReviewResult.REJECT}
                labelCol={{ span: 24 }}
                label={i18n.translate('REVIEW_REASON_LABEL')}
                validateStatus={typeError ? 'error' : ''}
              >
                <Select
                  mode="multiple"
                  size="small"
                  value={editingReview.type}
                  onChange={(type) => store.review.updateReviewInfo(editingReview, { type })}
                  onDropdownVisibleChange={(open) => {
                    dropdownVisible.current = open;
                  }}
                >
                  {store.review.issueTypes.map((item) => (
                    <Select.Option value={item} key={item}>{item}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <ImageTextField
                style={{ height: 84 }}
                uploader={store.saveFile}
                value={editingReview.comment}
                onChange={(comment) => store.review.updateReviewInfo(editingReview, { comment })}
              />
            </>
          )}
          <div className="review-action">
            <div
              className="review-btn"
              onClick={handleDelete}
            >
              {i18n.translate('COMMON_DELETE')}
            </div>
            <div
              className="review-btn save"
              onClick={handleSave}
            >
              {i18n.translate('COMMON_SAVE')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReviewModal;
