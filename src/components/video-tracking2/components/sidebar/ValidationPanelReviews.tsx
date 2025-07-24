import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { Checkbox, Dropdown, Menu } from 'antd';
import { ArrowRightOutlined, MoreOutlined } from '@ant-design/icons';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import cx from 'classnames';
import { getReviewRelatedInstanceInfo } from '../review/ReviewModal';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewMode, ReviewResult } from '../../types';
import ReviewItem from '../../model/ReviewItem';

interface ValidationPanelReviewsProps {
  setPreviewImg: (src: string) => void;
  showConfirmModal: (arg: number, type: string) => void
}

export interface ValidationPanelReviewsHandle {
  deleteAllByCollapsePanel: () => void;
  deleteItemsBySelected: () => void;
}

const ValidationPanelReviews = observer(forwardRef(({ setPreviewImg, showConfirmModal }: ValidationPanelReviewsProps, ref) => {
  const [checkedRes, setCheckedRes] = useState<{ [key: string]: ReviewItem }>({});
  const reviews = store.review.allReviews.filter((r) => r.result === ReviewResult.REJECT);

  useImperativeHandle(ref, () => ({
    deleteAllByCollapsePanel,
    deleteItemsBySelected
  }));

  // delete item directly
  const deleteReviewItem = (reviewItem: ReviewItem) => {
    store.review.deleteReviews({ [reviewItem.id]: reviewItem });
    setCheckedRes({});
  };

  // delete selected items
  const deleteItemsBySelected = () => {
    store.review.deleteReviews(checkedRes);
    setCheckedRes({});
  };

  // delete all items belong to review panel
  const deleteAllByCollapsePanel = () => {
    store.review.clearReviewsAndAnchors();
    setCheckedRes({});
  };

  const deleteAllReviewItemsHandler = () => {
    if (Object.keys(checkedRes).length === 0) {
      return;
    }
    showConfirmModal(Object.keys(checkedRes).length, 'deleteItemsBySelected');
  };

  const clickWarningOperate = ({ key }: any, reviewItem: ReviewItem) => {
    if (key === 'DELETEITEM') {
      deleteReviewItem(reviewItem);
    }
  };

  const ReviewActionList = [{
    name: i18n.translate('VALIDATION_REVIEW_DELETE_ITEM'),
    key: 'DELETEITEM'
  }];

  const menu = (reviewItem: ReviewItem) => (
    <Menu onClick={(e) => clickWarningOperate(e, reviewItem)}>
      {ReviewActionList.map((item) => (
        <Menu.Item key={item.key}>
          <span>{item.name}</span>
        </Menu.Item>
      ))}
    </Menu>
  );

  const onSelectItem = (checked: boolean, reviewItem: ReviewItem) => {
    let newCheckedRes = { ...checkedRes };
    if (checked) {
      newCheckedRes = { ...newCheckedRes, [reviewItem.id]: reviewItem };
    } else {
      delete newCheckedRes[reviewItem.id];
    }
    setCheckedRes({ ...newCheckedRes });
  };

  const onCheckAllChange = (checked: boolean) => {
    if (!checked) {
      setCheckedRes({});
      return;
    }
    const obj: { [key: string]: ReviewItem } = {};
    if (reviews && reviews.length) {
      reviews.forEach((reviewItem: ReviewItem) => {
        obj[reviewItem.id] = reviewItem;
      });
    }
    setCheckedRes(obj);
  };

  return (
    <>
      {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
        <div className="selected-operation-container">
          <div className="selected-all">
            <Checkbox
              onChange={(e: CheckboxChangeEvent) => onCheckAllChange(e.target.checked)}
              checked={checkedRes && Object.keys(checkedRes).length === reviews.length}
            >
              {i18n.translate('COMMON_SELECT_ALL')}
            </Checkbox>
          </div>
          <div className="selected-operation-right">
            <span className="selected-info">
              {i18n.translate('VALIDATION_REVIEW_SELECT_AMOUNT', { values: { checkedResLength: Object.keys(checkedRes).length } })}
            </span>
            <span
              className="unselect-all"
              onClick={() => setCheckedRes({})}
            >
              {i18n.translate('COMMON_CLEAR')}
            </span>
            <span
              className={cx('delete-all', { isDisable: Object.keys(checkedRes).length === 0 })}
              onClick={deleteAllReviewItemsHandler}
            >
              {i18n.translate('COMMON_DELETE')}
            </span>
          </div>
        </div>
      )}
      {reviews.map((r) => {
        const { infoStr, instance, instanceItem } = getReviewRelatedInstanceInfo(r);
        let displayColor;
        if (instanceItem) {
          displayColor = instanceItem.categoryItemRef.displayColor;
        } else if (instance) {
          displayColor = '#FFFFFF';
        }
        return (
          <div
            key={r.id}
            className="warning-item"
          >
            <div className="warning-title">
              <div className="warning-title-left">
                {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
                  <Checkbox
                    checked={!!checkedRes[r.id]}
                    onChange={(e: CheckboxChangeEvent) => onSelectItem(e.target.checked, r)}
                  />
                )}
                <div className="name">
                  <div
                    className="cat-color-dot"
                    style={{ backgroundColor: displayColor || '#DC4624' }}
                  />
                  {infoStr}
                </div>
              </div>
              <div className="warning-title-right">
                {instance && (
                  <div
                    className="action"
                    onClick={() => {
                      store.frame.setFrame(r.frameIndex);
                      if (instanceItem) {
                        store.instance.selectInstanceItem(instanceItem, true);
                      } else if (instance) {
                        store.instance.selectInstance(instance, true);
                      }
                    }}
                  >
                    <ArrowRightOutlined />
                  </div>
                )}
                {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
                  <Dropdown overlay={() => menu(r)} trigger={['click']} overlayClassName="custom-ant-dropdown">
                    <span onClick={(e) => e.preventDefault()}>
                      <MoreOutlined />
                    </span>
                  </Dropdown>
                )}
              </div>
            </div>
            <div className="warning-msg">
              {!store.frame.isSingleCamera && `[C${store.frame.cameraNames.indexOf(r.camera) + 1}] `}
              {`[${i18n.translate('FRAME_ATTRIBUTES_FRAME', { values: { frame: r.frameIndex + 1 } })}] `}
              {r.type?.join(';')}
              <div
                className="img-container"
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName === 'IMG') {
                    setPreviewImg((e.target as HTMLImageElement).src);
                  }
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: r.comment || '' }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}));
export default ValidationPanelReviews;
