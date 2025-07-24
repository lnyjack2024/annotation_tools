import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { translate } from '../../../constants';
import { setMeasurement } from '../../../redux/action';
import { LineMeasurement } from '../../../../common/icons';
import Dropdown from '../../../../common/dropdown/Dropdown';
import './Measurement.scss';

const catchMeasurementKey = 'long_audio_measurement';

const Measurements = ({ measurements, selectedMeasurement, setMeasurement: set }) => {
  useEffect(() => {
    let selected = Number(localStorage.getItem(catchMeasurementKey));
    if (!selected || measurements?.indexOf(selected) < 0) {
      selected = measurements[0];
    }
    handleSelect(selected);
  }, []);

  const handleSelect = (v) => {
    set({ selectedMeasurement: v });
    localStorage.setItem(catchMeasurementKey, v);
  };

  const hided = selectedMeasurement < 0;
  const menus = [
    { label: translate('HIDE_LABEL'), value: -1, active: hided },
    ...measurements.map((m) => ({ label: `${m} s`, value: m, active: m === selectedMeasurement })),
  ];
  return measurements.length > 0 && (
    <div className="audio-measurements-button">
      <span className={`measurement-icon${hided ? '' : ' active'}`}>
        <LineMeasurement />
      </span>
      <Dropdown
        arrow
        style={{ height: '100%' }}
        menu={menus}
        onClick={(label, index, item) => handleSelect(item.value)}
      >
        <span className="measurement-time">
          {hided ? translate('HIDE_LABEL') : `${selectedMeasurement}s`}
        </span>
      </Dropdown>
    </div>
  );
};

const mapStateToProps = (state) => ({
  measurements: state.measurements,
  selectedMeasurement: state.selectedMeasurement,
});
const mapDispatchToProps = {
  setMeasurement,
};
export default connect(mapStateToProps, mapDispatchToProps)(Measurements);
