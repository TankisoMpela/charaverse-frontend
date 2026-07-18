import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessionalCard = ({ professional }) => {
  const navigate = useNavigate();
  const { id, name, title, description, avatar, category } = professional;

  return (
    <div
      className="professional-card"
      onClick={() => navigate(`/chat?profId=${id}`)}
    >
      <div className="card-avatar">
        {avatar ? (
          <img src={avatar} alt={name} />
        ) : (
          <div className="avatar-placeholder">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="card-body">
        <span className="card-category">{category || 'Consultant'}</span>
        <h3 className="card-name">{name}</h3>
        <p className="card-title">{title}</p>
        <p className="card-desc">{description}</p>
      </div>
      <div className="card-footer">
        <span className="card-org">Mpela Co.</span>
      </div>
    </div>
  );
};

export default ProfessionalCard;
