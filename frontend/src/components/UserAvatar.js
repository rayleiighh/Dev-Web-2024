import React from 'react';
import PropTypes from 'prop-types';
import './UserAvatar.css'; // Assure-toi qu’il existe

function UserAvatar({ avatarUrl, editable = false, onEdit }) {
  const defaultAvatar = '/images/avatar-default.svg';

  return (
    <div className="user-avatar">
      <img
        src={avatarUrl || defaultAvatar}
        alt="Avatar utilisateur"
        className="avatar-image"
      />

      {editable && (
        <button
          className="edit-avatar-btn"
          onClick={onEdit}
          title="Changer la photo"
        >
          <i className="bi bi-pencil-fill"></i>
        </button>
      )}
    </div>
  );
}

UserAvatar.propTypes = {
  avatarUrl: PropTypes.string,
  editable: PropTypes.bool,
  onEdit: PropTypes.func
};

export default UserAvatar;
