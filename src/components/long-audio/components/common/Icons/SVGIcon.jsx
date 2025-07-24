import React from 'react';
import PropTypes from 'prop-types';
import './SVGIcon.scss';

const SVGIcon = ({ style, color, size, children, ...rest }) => (
  <svg className="b-SVGIcon" fill={color} style={{ height: size, width: size, ...style }} {...rest}>
    {children}
  </svg>
);

SVGIcon.cxBase = 'SVGIcon';
SVGIcon.defaultProps = { color: 'currentColor', size: 24, viewBox: '0 0 24 24' };
SVGIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
  viewBox: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types,react/require-default-props
  style: PropTypes.object,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default SVGIcon;
