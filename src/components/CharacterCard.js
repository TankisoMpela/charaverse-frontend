import React, { useState } from 'react';
// import { Link } from 'react-router-dom'; // You can uncomment this if you switch to Link later

const CharacterCard = ({ character }: { character: any }) => {
    const [imageLoadingError, setImageLoadingError] = useState(false);
    // FIX 1: Access avatar directly from character, not character.data
    const [imageUrl, setImageUrl] = useState(character?.avatar);

    const handleImageError = (event: any) => {
        if (!imageLoadingError) {
            console.error('Error loading image:', imageUrl);
            setImageLoadingError(true);
            setImageUrl('https://via.placeholder.com/150'); // Fallback image
            event.target.onerror = null; // Prevent infinite loop
        }
    };

    // FIX 2: Check for essential character properties (like 'name'), not just 'data'
    // 'name' is a required field in your schema, so it's a good indicator for a valid character.
    if (!character || !character.name) {
        return (
            <div className="character-card">
                <div className="character-image-wrapper">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="Character Unavailable"
                        className="character-image"
                    />
                </div>
                <div className="character-info">
                    <h3 className="character-name">Character Unavailable</h3>
                </div>
            </div>
        );
    }

    // FIX 3: Access category directly; no need to split as it's a single string now.
    const category = character.category || 'Unknown';
    // FIX 4: Access tags directly; it's already an array, no need to split.
    const tags = character.tags || []; // Ensure 'tags' is always an array

    return (
        // IMPORTANT: We use character._id for the URL, matching your MongoDB ObjectId
        <div className="character-card" onClick={() => { window.location.href = `/chat?charId=${character._id}`; }}>
            {category && (
                <div className="character-badge">
                    {category}
                </div>
            )}
            <div className="character-image-wrapper">
                <img
                    src={imageUrl}
                    // FIX 5: Access name directly for alt text
                    alt={character.name}
                    className="character-image"
                    onError={handleImageError}
                    loading="lazy"
                />
            </div>
            <div className="character-info">
                {/* FIX 6: Access name and description directly */}
                <h3 className="character-name">{character.name}</h3>
                <p className="character-description">{character.description}</p>
                <div className="character-tags">
                    {/* Tags is already an array, just join it */}
                    {tags.join(', ')}
                </div>
            </div>
        </div>
    );
};

export default CharacterCard;