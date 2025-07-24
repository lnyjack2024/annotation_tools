import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewResult } from '../../types';

export const frameLabelHeight = 20;

interface ItemLabelProps {
  itemKey: string;
  separator: string;
  prefix?: React.ReactNode;
}

const ItemLabel = observer(({ itemKey, separator, prefix }: ItemLabelProps) => {
  const { selectedInstances, selectedInstanceItems, getInstanceById } = store.instance;
  const { currentCamera, isSingleCamera, cameraNames } = store.frame;

  const [instanceId, instanceItemId, camera] = itemKey.split(separator);
  const cameraIndex = cameraNames.indexOf(camera);
  const instance = getInstanceById(instanceId);
  const instanceItem = (instance?.items || [])[instanceItemId];
  const instanceSelected = selectedInstances.indexOf(instance) >= 0;
  const instanceItemSelected = selectedInstanceItems.indexOf(instanceItem) >= 0 && camera === currentCamera;

  let reviewResult;
  if (instanceItem) {
    reviewResult = store.review.getReviewResultForInstanceItem(instanceItem, camera);
  } else if (instance) {
    const isSingle = instance.isSingle && isSingleCamera;
    if (isSingle) {
      reviewResult = store.review.getReviewResultForInstanceItem(Object.values(instance.items)[0], camera);
    } else if (!instanceSelected) {
      reviewResult = store.review.getReviewResultForInstance(instance);
    }
  }

  if (reviewResult && reviewResult !== ReviewResult.REJECT && store.isRework) {
    reviewResult = undefined;
  }

  return (
    <div
      key={itemKey}
      className={cx(`frame-item-label frame-item-instance-${instanceId} ${instanceItem ? `frame-item-instance-item-${instanceItem.id}` : ''}`, {
        dark: !instance || instanceSelected,
        selected: instanceItemSelected || (instanceSelected && !instanceItem && selectedInstanceItems.filter((item) => item.instance === instance).length <= 0),
      })}
      style={{ height: frameLabelHeight }}
      onClick={() => {
        if (instanceItem) {
          store.instance.selectInstanceItem(instanceItem);
        } else if (instance) {
          store.instance.selectInstance(instance);
        }
      }}
    >
      {prefix}
      {!instance && i18n.translate('PROGRESS_GLOBAL_LABEL')}
      {instance && !instanceItem && (
        <>
          <div>
            <div
              className="frame-item-label-dot"
              style={{ backgroundColor: instance.categoryRef.displayColor }}
            />
            {instance.label}
          </div>
          <div
            className={cx('frame-item-label-review', {
              approved: reviewResult === ReviewResult.APPROVE,
              rejected: reviewResult === ReviewResult.REJECT,
              pending: reviewResult === ReviewResult.SUSPEND,
            })}
          />
        </>
      )}
      {instance && instanceItem && (
        <>
          <div />
          <div className="frame-item-label-sub">
            {`${instanceItem.itemLabel}${isSingleCamera ? '' : `-C${cameraIndex + 1}`}`}
            <div
              className={cx('frame-item-label-review', {
                approved: reviewResult === ReviewResult.APPROVE,
                rejected: reviewResult === ReviewResult.REJECT,
                pending: reviewResult === ReviewResult.SUSPEND,
              })}
            />
          </div>
        </>
      )}
    </div>
  );
});

export default ItemLabel;
