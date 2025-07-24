import React from 'react';
import { observer } from 'mobx-react';
import InstanceInfo from './InstanceInfo';
import InstanceAttributes from './InstanceAttributes';
import PointAttributes from './PointAttributes';
import store from '../../store/RootStore';
import i18n from '../../locales';

const InstancePanel = observer(() => {
  const { isMultiSelected, selectedInstances, selectedInstanceItems } = store.instance;
  if (isMultiSelected || selectedInstances.length <= 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          marginTop: 80,
        }}
      >
        {i18n.translate(isMultiSelected ? 'INSTANCE_MULTI_SELECTED' : 'INSTANCE_NOT_SELECTED')}
      </div>
    );
  }

  const selectedInstance = selectedInstances[0];
  const selectedInstanceItem = selectedInstanceItems.length === 1 ? selectedInstanceItems[0] : undefined;
  return (
    <>
      <InstanceInfo
        instance={selectedInstance}
        instanceItem={selectedInstanceItem}
      />
      <InstanceAttributes
        instance={selectedInstance}
        instanceItem={selectedInstanceItem}
      />
      <PointAttributes />
    </>
  );
});

export default InstancePanel;
