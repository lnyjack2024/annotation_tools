import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { generateConfigKeyByKeys } from '../../utils/helper';
import ToolGroupItem from './toolGroupItem';
import { TextIcon, Insertion, Relation } from '../../../common/icons';
import { TAG } from '../../types';
import store from '../../store/RootStore';
import localMessage from '../../locale';
import KeysTransform from './const';

const ToolGroup = observer(({ type, filteredOntologies, setCurrentBrush, currentBrush }) => (
  <div className="tool-group-wrapper">
    {KeysTransform[type] !== TAG.LABEL_QA && (
    <div className="tool-group-title">
      {KeysTransform[type] === TAG.LABEL && (
      <span className="icon">
        <TextIcon />
      </span>
      )}
      {KeysTransform[type] === TAG.INSERTION && (
      <span className="icon">
        <Insertion />
      </span>
      )}
      {KeysTransform[type] === TAG.CONNECTION && (
      <span className="icon">
        <Relation />
      </span>
      )}
      {localMessage(KeysTransform[type])}
    </div>
    )}
    {filteredOntologies[type] && (
      <div>
        {
          filteredOntologies[type].map((ontologyItem) => {
            const key = generateConfigKeyByKeys(ontologyItem.keys)
            return (
              <div className="tool-group" key={key}>
                <ToolGroupItem
                  type={type}
                  ontologiesStatusMap={toJS(store.ontology.ontologiesStatusMap)}
                  updateOntologiesCollapseStatus={store.ontology.updateOntologiesCollapseStatus}
                  key={key}
                  ontologyItem={ontologyItem}
                  setCurrentBrush={setCurrentBrush}
                  currentBrush={currentBrush}
                  reviewable={store.reviewable}
                  reviewMode={store.config.reviewMode}
                  isRework={store.isRework}
                />
              </div>
            )
          })
        }
      </div>
    )}
  </div>
));
export default ToolGroup;
