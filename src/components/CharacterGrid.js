import React from 'react';
import CharacterCard from './CharacterCard';

function CharacterGrid({ characters }) {
    console.log('Characters prop in CharacterGrid:', characters);
    return (
        <div className="character-grid">
            {characters.map(character => (
                <CharacterCard key={character._id} character={character} />
            ))}
        </div>
    );
}

export default CharacterGrid;