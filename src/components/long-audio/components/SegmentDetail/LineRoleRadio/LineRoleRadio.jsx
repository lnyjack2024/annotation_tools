import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import { Radio } from 'antd';
import { setLineRole } from '../../../redux/action';
import { translate } from '../../../constants';
import { isAnnotationReadonly } from '../../../../../utils/tool-mode';
import './LineRoleRadio.scss';
import { Down } from '../../../../common/icons';

const LineRoleRadio = (props) => {
  const { index, role, currentRoles, annotateDisabled, ontology } = props;
  const foldable = ontology.size > 7;
  const [fold, setFold] = useState(foldable);
  const allRoles = useMemo(() => {
    const roles = [];
    [...ontology].forEach(([key, value], i) => {
      if (fold && role === key && i >= 7) {
        roles.unshift({ class_name: key, display_color: value });
      } else {
        roles.push({ class_name: key, display_color: value });
      }
      if (fold) {
        roles.splice(7);
      }
    });
    return roles;
  }, [ontology, fold, role]);
  const handleRadioChange = (e) => {
    props.setLineRole({
      lineIndex: index,
      role: e.target.value,
    });
  };
  return (
    <div className="line-role-radio-container">
      {allRoles.length === 1 && allRoles[0].class_name === 'none' ? null : (
        <>
          <label className="line-role-radio-title" htmlFor="role">{`${translate('role')}${props.index + 1}${props.index === 0 ? `(${translate('primary')})` : ''}: `}</label>
          <Radio.Group
            value={role}
            buttonStyle="solid"
            className="line-role-radio-group"
            onChange={(e) => handleRadioChange(e)}
            disabled={isAnnotationReadonly(props.toolMode) || annotateDisabled}
          >
            {allRoles.map((value, index2) => (
              <Radio.Button
                // eslint-disable-next-line react/no-array-index-key
                key={`line-role-radio-button-${index2}`}
                className="line-role-radio-button"
                value={value.class_name}
                disabled={currentRoles.indexOf(value.class_name) >= 0 && role !== value.class_name}
              >
                <div
                  className="line-role-radio-color"
                  style={{ backgroundColor: value.display_color }}
                />
                {value.class_name}
              </Radio.Button>
            ))}
            {foldable && (
              <div
                className={cx('line-role-radio-button fold', { active: !fold })}
                onClick={() => { setFold(!fold); }}
              >
                <div className="icon"><Down /></div>
              </div>
            )}
          </Radio.Group>
        </>
      )}
    </div>
  );
};

LineRoleRadio.propTypes = {
  setLineRole: PropTypes.func,
};

const mapStateToProps = (state) => ({
  ontology: state.ontology,
  toolMode: state.toolMode,
  annotateDisabled: state.annotateDisabled,
});
const mapDispatchToProps = {
  setLineRole,
};
export default connect(mapStateToProps, mapDispatchToProps)(LineRoleRadio);
