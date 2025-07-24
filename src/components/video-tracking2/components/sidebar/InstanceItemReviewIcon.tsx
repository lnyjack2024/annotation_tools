import React from 'react';
import { observer } from 'mobx-react';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import { ReviewResult } from '../../types';

interface InstanceItemReviewIconProps {
  item: InstanceItem;
  camera: string;
}

const InstanceItemReviewIcon = observer(({ item, camera }: InstanceItemReviewIconProps) => {
  const result = store.review.getReviewForInstanceItem(item, camera);
  if (!result || (result !== ReviewResult.REJECT && store.isRework)) {
    return null;
  }

  switch (result) {
    case ReviewResult.APPROVE:
      return (
        <div className="sidebar-category-review">
          <div className="approve" />
        </div>
      );
    case ReviewResult.REJECT:
      return (
        <div className="sidebar-category-review">
          <div className="reject" />
        </div>
      );
    case ReviewResult.SUSPEND:
      return (
        <div className="sidebar-category-review">
          <div className="suspend" />
        </div>
      );
    default:
  }

  return null;
});

export default InstanceItemReviewIcon;
