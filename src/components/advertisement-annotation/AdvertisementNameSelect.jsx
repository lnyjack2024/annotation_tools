import React from 'react';
import { Select } from 'antd';
import { UNDEFINED_COLOR } from './AnnotationForm';

class AdvertisementNameSelect extends React.Component {
  shouldComponentUpdate(prevProps) {
    if (prevProps.advertisementName === this.props.advertisementName &&
        prevProps.item === this.props.item &&
        prevProps.index === this.props.index &&
        prevProps.tempOption === this.props.tempOption &&
        prevProps.historySelect === this.props.historySelect) {
      return false;
    }
    return true;
  }

  render() {
    const {
      item,
      advertisementName,
      tempOption,
      advertisementNameMap,
      index,
      historySelect,
      disabled,
    } = this.props;
    return (
      <Select
        showSearch
        disabled={disabled}
        className="advertisement-attribute-select"
        optionFilterProp="children"
        getPopupContainer={() => document.getElementById('root')}
        placeholder="请选择识别结果"
        value={item.name}
        onChange={(e) => this.props.handleSelectChange(e, 'name', item.key)}
        onSearch={(e) => this.props.handleSelectSearch(e, 'name', item.key)}
        onFocus={(e) => window.disableAdvertisementHotKeys = true}
        onBlur={(e) => {
          this.props.handleSelectBlur(e, 'name', item.key);
          window.disableAdvertisementHotKeys = false;
        }}
      >
        {
          historySelect.length ? (
            <Select.OptGroup
              label="history selected"
            >
              {
              historySelect.map((name) => (
                <Select.Option key={name} value={name}>
                  <div className="advertisement-color-tag" style={{ background: advertisementNameMap.get(name) || UNDEFINED_COLOR }} />
                  {name}
                </Select.Option>
              ))
            }
            </Select.OptGroup>
          )
            : null
        }
        <Select.OptGroup
          label="selection"
        >
          {
            advertisementName.map((name) => {
              if (historySelect.indexOf(name.value) === -1) {
                return (
                  <Select.Option value={name.value} key={name.value}>
                    <div className="advertisement-color-tag" style={{ background: advertisementNameMap.get(name.value) || UNDEFINED_COLOR }} />
                    {name.value}
                  </Select.Option>
                );
              }
              return null;
            })
          }
          {/*{
            tempOption == null || advertisementNameMap.has(tempOption) || tempOption === ''
              ? null
              : (
                <Select.Option value={tempOption}>
                  <div className="advertisement-color-tag" style={{ background: UNDEFINED_COLOR }} />
                  {tempOption}
                </Select.Option>
              )
          }*/}
        </Select.OptGroup>
      </Select>
    );
  }
}

export default AdvertisementNameSelect;
