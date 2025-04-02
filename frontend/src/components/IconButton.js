import React from 'react';
import PropTypes from 'prop-types';
import 'bootstrap/dist/css/bootstrap.min.css';

function IconButton({ icon, label, onClick, className = '', variant = 'primary', size = 'md' }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} rounded-pill d-flex align-items-center gap-2 ${className}`}
      onClick={onClick}
    >
      <img src={`/icons/${icon}`} alt={label} width="20" height="20" />
      <span>{label}</span>
    </button>
  );
}

// ✅ Vérification des props pour éviter les erreurs
IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'light', 'dark', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default IconButton;
