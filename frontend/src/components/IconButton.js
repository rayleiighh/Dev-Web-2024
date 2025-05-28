import React from 'react';
import PropTypes from 'prop-types';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../pages/Dashboard.css'; 

function IconButton({ icon, label, onClick, className = '', variant = 'primary', size = 'md' }) {
  return (
    <button
      className={`icon-button btn btn-${variant} btn-${size} d-flex align-items-center ${className}`}
      onClick={onClick}
    >
      <img
        src={`/icons/${icon}`} 
        alt={label}
        className="icon-img"
        draggable="false"
      />
      {label && <span className="icon-label">{label}</span>}
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'light', 'dark', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default IconButton;
