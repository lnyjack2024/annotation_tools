import React, { useEffect, useState, useMemo } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { cloneDeep, debounce } from 'lodash';
import cx from 'classnames';
import { Input } from 'antd';
import { generateConfigKeyByKeys } from '../../utils/helper';
import localMessage from '../../locale';
import ToolGroup from './toolGroup';
import store from '../../store/RootStore';
import { MISSING_LABEL } from '../../store/constant';

const Toolbar = observer((props) => {
  const {
    currentBrush,
    setCurrentBrush,
    contentReadyOnly,
    inputEnable,
  } = props;
  const [scrollTop, setScrollTop] = useState(0);
  const [isFocus, setIsFocus] = useState(false);
  const [filterValue, setFilterValue] = useState();
  const [typeSet, setTypeSet] = useState(new Set());

  const [filteredOntologies, setFilteredOntologies] = useState();
  useEffect(() => {
    setFilteredOntologies(cloneDeep(store.ontology.ontologies));
  }, [store.ontology.ontologies]);

  useEffect(() => {
    if (filteredOntologies) {
      const set = new Set();
      Object.entries(filteredOntologies).forEach(([key]) => {
        if (!set.has(key)) set.add(key);
      });
      setTypeSet(set);
    }
  }, [filteredOntologies]);

  const filterOntologiesBySearch = (arr, value) => {
    const newChildren = [];
    arr?.forEach((item) => {
      if ((item.displayName || item.text).includes(value)) {
        newChildren.push(item);
      } else {
        const children = filterOntologiesBySearch(item.children, value);
        if (children) {
          item.children = cloneDeep(children);
          newChildren.push(item);
        }
      }
    });
    return newChildren.length > 0 ? newChildren : undefined;
  };

  const handleSearch = (value) => {
    if (value) {
      const newFilteredOntologies = {};
      if (store.ontology.ontologies && typeSet.size !== 0) {
        Array.from(typeSet).forEach((type) => {
          newFilteredOntologies[type] = filterOntologiesBySearch(store.ontology.ontologies[type], value);
        });
      }
      setFilteredOntologies(newFilteredOntologies);
    } else {
      setFilteredOntologies(store.ontology.ontologies);
    }
  };

  const filteredResultEmpty = useMemo(() => {
    if (filteredOntologies && Object.keys(filteredOntologies).length > 0) {
      return !(Object.values(filteredOntologies).some((item) => item && item.length > 0));
    }
    return true;
  }, [filteredOntologies]);

  const toggleCollapseAll = (collapseStatus) => {
    store.ontology.updateOntologiesCollapseStatusAll(collapseStatus);
  };

  const onChange = (e) => {
    setFilterValue(e.target.value);
    onInputChange(e.target.value);
  };

  const onInputChange = debounce((value) => {
    handleSearch(value);
  }, 100);

  const isCollapseAll = useMemo(() => {
    if (!store.ontology.ontologiesStatusMap || store.ontology.ontologiesStatusMap.size === 0) {
      return true;
    }
    const missKeys = generateConfigKeyByKeys(MISSING_LABEL.keys);
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of store.ontology.ontologiesStatusMap) {
      if (key !== missKeys) {
        if (!value.isCollapse) {
          return false;
        }
      }
    }
    return true;
  }, [toJS(store.ontology.ontologiesStatusMap)]);

  const currentFixedText = useMemo(() => {
    if (currentBrush) {
      const keys = currentBrush.keys.reduce((prev, cur, index) => {
        let key = generateConfigKeyByKeys([cur]);
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          key = generateConfigKeyByKeys([last, cur]);
        }
        prev.push(key);
        return prev;
      }, []);
      return keys.map((key) => {
        const item = store.ontology.ontologyConfigMap.get(key);
        return {
          color: item.color,
          text: item.displayName || item.text
        };
      });
    }
    return '';
  }, [currentBrush]);
  return (
    <div className="tool-wrapper">
      { contentReadyOnly ? null : (
        <button
          className={`edit-trigger ${(currentBrush === null && inputEnable) ? 'tool-item-focus' : ''}`}
          onClick={() => setCurrentBrush(null, !inputEnable)}
        >
          {localMessage('EDIT_TEXT')}
        </button>
      )}
      <div className={cx('filter-container', { isFocus })}>
        <Input
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          value={filterValue}
          className="filter-input"
          placeholder={localMessage('COMMON_SEARCH')}
          prefix={<SearchOutlined />}
          allowClear
          onPressEnter={() => {
            handleSearch(filterValue);
          }}
          onChange={onChange}
        />
      </div>
      {filterValue && (
      <div className="filter-result-title">
        {filteredResultEmpty ? `${localMessage('COMMON_SEARCH__NO_RESULT')}` : `${localMessage('COMMON_SEARCH_RESULT')}` }
      </div>
      )}
      {!filteredResultEmpty && (
      <>
        {store.reviewable && (
        <div className="review-info-tips">
          <div>
            <CheckCircleFilled style={{ color: '#51CD44', marginRight: 4 }} />
            {`${localMessage('REVIEW_APPROVE_TIP')}`}
          </div>
          <div>
            <CloseCircleFilled style={{ color: '#D45058', marginRight: 4 }} />
            {`${localMessage('REVIEW_REJECT_TIP')}`}
          </div>
        </div>
        )}
        { typeSet?.has('labels_qa') && filteredOntologies.labels_qa && (
        <div className="tag-container-review">
          <ToolGroup type="labels_qa" filteredOntologies={filteredOntologies} setCurrentBrush={setCurrentBrush} currentBrush={currentBrush} />
        </div>
      )}
        <div
          className="collapse-button"
          onClick={() => toggleCollapseAll(!isCollapseAll)}
        >
          {isCollapseAll ? <RightOutlined /> : <DownOutlined /> }
          <span style={{ marginLeft: 6 }}>
            {isCollapseAll ? localMessage('EXPAND_ALL') : localMessage('COLLAPSE_ALL')}
          </span>
        </div>
        <div className="tag-container-wrapper">
          {currentBrush && scrollTop > 0 && (
          <div className="tool-group-fixed">
            {currentFixedText.map((item, index) => (
              <div className="item-left" key={item.text}>
                <span className="item-left-color" style={{ background: item.color }} />
                <span className="item-left-text">
                  {item.text}
                </span>
                {index + 1 !== currentFixedText.length && (<span className="item-left-split">/</span>)}
              </div>
            ))}
          </div>
          )}
          {
          filteredOntologies && typeSet.size !== 0 && (
            <div className="tag-container" onScroll={(e) => setScrollTop(e.target.scrollTop)}>
              { Array.from(typeSet).map((type) => {
                if (!filteredOntologies[type] || type === 'labels_qa') {
                  return null;
                }
                return (
                  <ToolGroup key={type} type={type} filteredOntologies={filteredOntologies} setCurrentBrush={setCurrentBrush} currentBrush={currentBrush} />
                );
              })}
            </div>
          )
        }
        </div>
      </>
      )}
    </div>
  );
});

export default Toolbar;
