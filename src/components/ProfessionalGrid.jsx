import React from 'react';
import ProfessionalCard from './ProfessionalCard';

function ProfessionalGrid({ professionals }) {
  return (
    <div className="professional-grid">
      {professionals.map((p) => (
        <ProfessionalCard key={p.id} professional={p} />
      ))}
    </div>
  );
}

export default ProfessionalGrid;
