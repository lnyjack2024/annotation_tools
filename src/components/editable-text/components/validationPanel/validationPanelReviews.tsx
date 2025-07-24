import React, { forwardRef, useImperativeHandle, useState, useMemo, useEffect, useReducer, useContext } from 'react';
import { observer } from 'mobx-react';
import { Checkbox, Tooltip } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import cx from 'classnames';
import { Check2Icon, CheckIcon, DeleteReview } from 'src/components/common/icons';
import localMessage from '../../locale';

import store from '../../store/RootStore';
import { ConnectionItem, InsertionItem, LabelItem, MissingItem, ReviewItemResult, ReviewMode, ReviewResultItem, ReviewResultType } from '../../types';
import { generateConfigKeyByKeys, getConfigByKeys } from '../../utils/helper';
import { isConnection } from '../../store/tag_mode';
import { isReviewDone, setReviewState } from '../../store/reworkReviewState';
import { TextToolContext } from '../../TextAnnotationApp';

interface ValidationPanelReviewsProps {
  showConfirmModal: (arg: number) => void
}

export interface ValidationPanelReviewsHandle {
  deleteItemsBySelected: () => void;
}

const ValidationPanelReviews = observer(forwardRef(({ showConfirmModal }: ValidationPanelReviewsProps, ref) => {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [checkedAll, setCheckedAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState(true);
  const [, forceUpdate] = useReducer(
    (x) => x + 1,
    0,
    () => 0,
  );
  const { moveFocusToTag, deleteReviewItemById, deleteReviewItemsById } = useContext(TextToolContext);
  const reviews = store.review.allReviews.filter((r) => r.result !== ReviewItemResult.PASS);
  const noRelatedTag = localMessage('VALIDATION_REVIEW_NO_TAG');
  const noRelatedText = localMessage('VALIDATION_REVIEW_NO_TEXT');
  useImperativeHandle(ref, () => ({
    deleteItemsBySelected
  }));

  const allReviewIds = useMemo(() => reviews.map((reviewItem: ReviewResultItem) => reviewItem.id) || [], [reviews]);

  useEffect(() => {
    setIndeterminate(!!checkedKeys.length && checkedKeys.length < allReviewIds.length);
    setCheckedAll(checkedKeys.length === allReviewIds.length);
  }, [checkedKeys, allReviewIds]);

  // delete item directly
  const onDeleteReviewItem = (reviewId: string) => {
    deleteReviewItemById(reviewId);
    setCheckedKeys([]);
  };

  // delete selected items
  const deleteItemsBySelected = () => {
    deleteReviewItemsById(checkedKeys);
    setCheckedKeys([]);
  };

  const deleteAllReviewItemsHandler = () => {
    if (Object.keys(checkedKeys).length === 0) {
      return;
    }
    showConfirmModal(Object.keys(checkedKeys).length);
  };

  const onSelectItem = (checked: boolean, reviewItem: ReviewResultItem) => {
    let newCheckedRes = [...checkedKeys];
    if (checked) {
      newCheckedRes.push(reviewItem.id);
    } else {
      newCheckedRes = newCheckedRes.filter(((id) => id !== reviewItem.id));
    }
    setCheckedKeys(newCheckedRes);
  };

  const onCheckAllChange = (checked: boolean) => {
    setCheckedAll(checked);

    if (!checked) {
      setCheckedKeys([]);
      return;
    }
    setCheckedKeys(allReviewIds);
  };

  const checkReviewState = (id: string, state: boolean) => {
    setReviewState(id, state);
    forceUpdate();
  };

  const descriptionIcon = (review: { id: any; comment?: string; result?: ReviewResultType; type?: string[]; }) => {
    if (store.reviewable && store.config.reviewMode === ReviewMode.LABELING) {
      const reviewState = isReviewDone(review.id);
      if (reviewState) {
        return (

          <Tooltip placement="left" title={localMessage('VALIDATION_REVIEW_UN_RESOLVE')}>
            <span className="action check">
              <Check2Icon onClick={() => checkReviewState(review.id, !reviewState)} />
            </span>
          </Tooltip>
        );
      }
      return (
        <Tooltip placement="left" title={localMessage('VALIDATION_REVIEW_RESOLVE')}>
          <span className="action check">
            <CheckIcon onClick={() => checkReviewState(review.id, !reviewState)} />
          </span>
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <>
      {store.review.passedCount > 0 && (
        <div className="tips">
          {localMessage('VALIDATION_REVIEW_PASSED_AMOUNT', { values: { count: store.review.passedCount } })}
        </div>
      )}
      {store.config.reviewMode === ReviewMode.REVIEW && store.reviewable && (
        <div className="selected-operation-container">
          <div className="selected-all">
            <Checkbox
              onChange={(e: CheckboxChangeEvent) => onCheckAllChange(e.target.checked)}
              checked={checkedAll}
              indeterminate={indeterminate}
            >
              {localMessage('COMMON_SELECT_ALL')}
            </Checkbox>
          </div>
          <div className="selected-operation-right">
            <span className="selected-info">
              {localMessage('VALIDATION_REVIEW_SELECT_AMOUNT', { values: { checkedResLength: Object.keys(checkedKeys).length } })}
            </span>
            <span
              className="unselect-all"
              onClick={() => setCheckedKeys([])}
            >
              {localMessage('COMMON_CLEAR')}
            </span>
            <span
              className={cx('delete-all', { isDisable: Object.keys(checkedKeys).length === 0 })}
              onClick={deleteAllReviewItemsHandler}
            >
              {localMessage('delete')}
            </span>
          </div>
        </div>
      )}
      {reviews.map((r) => {
        const ontologyItemInfo = store.ontology.getItemById(r.id);
        let textStr = `【${noRelatedText}】`;
        let displayColor;
        let tagName = noRelatedTag;
        if (ontologyItemInfo) {
          const { keys, type, value } = ontologyItemInfo;
          tagName = r.result === ReviewItemResult.MISSING ? value : generateConfigKeyByKeys(keys);
          const config = getConfigByKeys(store.ontology.ontologyConfigMap, keys);
          if (config) {
            displayColor = config.color;
          }
          if (isConnection(type)) {
            let fromText = noRelatedText;
            let toText = noRelatedText;

            const { fromId, toId } = ontologyItemInfo as ConnectionItem;
            const fromOntologyItemInfo = store.ontology.getItemById(fromId);
            const toOntologyItemInfo = store.ontology.getItemById(toId);
            if (fromOntologyItemInfo) {
              fromText = (fromOntologyItemInfo as (MissingItem | LabelItem | InsertionItem)).text || noRelatedText;
            }
            if (toOntologyItemInfo) {
              toText = (toOntologyItemInfo as (MissingItem | LabelItem | InsertionItem)).text || noRelatedText;
            }
            textStr = `【${fromText}】 => 【${toText}】`;
          } else {
            textStr = `【${(ontologyItemInfo as (MissingItem | LabelItem | InsertionItem)).text || noRelatedText}】`;
          }
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
                    checked={checkedKeys.includes(r.id)}
                    onChange={(e: CheckboxChangeEvent) => onSelectItem(e.target.checked, r)}
                  />
                )}
                <div className="name">
                  <div
                    className="cat-color-dot"
                    style={{ backgroundColor: displayColor || '#DC4624' }}
                  />
                  {tagName}
                </div>
                {r.result === ReviewItemResult.REJECT && <span className="result-tag">{localMessage('VALIDATION_REVIEW_REJECT_TAG')}</span>}
                {r.result === ReviewItemResult.MISSING && <span className="result-tag">{localMessage('VALIDATION_REVIEW_MISSING_TAG')}</span>}
              </div>
              <div className="warning-title-right">
                <span
                  className="action"
                  onClick={async () => {
                    // focus and jump
                    if (!ontologyItemInfo) {
                      return;
                    }
                    moveFocusToTag(ontologyItemInfo);
                  }}
                >
                  <ArrowRightOutlined />
                </span>

                {descriptionIcon(r)}
              </div>
            </div>
            <div className="warning-msg">
              <div className="warning-msg-detail">

                {
                  store.config.reviewMode === ReviewMode.REVIEW && (
                    (
                      <span
                        className="action"
                        onClick={() => {
                          onDeleteReviewItem(r.id);
                        }}
                      >
                        <DeleteReview />
                      </span>
                    )
                  )
                }
                {textStr ? `${textStr}` : ''}
              </div>
              <div>{r.type?.join(';')}</div>
              <div
                className="img-container"
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
