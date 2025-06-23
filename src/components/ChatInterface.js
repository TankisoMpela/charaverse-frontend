// client/src/components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatInterface.css'; // Ensure this file exists for styling

// IMPORTANT: Install FontAwesome if you haven't already for the icons
// npm install @fortawesome/fontawesome-free
// You might need to import it in your main App.js or index.js if icons don't show:
// import '@fortawesome/fontawesome-free/css/all.min.css';


const ChatInterface = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const characterId = queryParams.get('charId');

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [character, setCharacter] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading state for all data
    const [error, setError] = useState(null); // Centralized error state
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [chatBackground, setChatBackground] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false); // AI typing indicator
    const [isHistoryLoading, setIsHistoryLoading] = useState(false); // New: for history loading specificially

    // NEW: State for the AI's conversation summary (memory)
    const [contextSummary, setContextSummary] = useState("");

    const messagesEndRef = useRef(null); // Ref for auto-scrolling

    // !!! IMPORTANT: Replace with your actual user ID from MongoDB or a proper auth context !!!
    // This ID must correspond to an existing user in your MongoDB database.
    // Example: "682c693aac2d33184f6c4bd0"
    const DUMMY_USER_ID = "682c693aac2d33184f6c4bd0"; // MAKE SURE THIS IS A VALID USER ID FROM YOUR DB!


    // Effect to fetch initial chat data (character, user, and history)
    useEffect(() => {
        const fetchAllChatData = async () => {
            if (!characterId) {
                setError(new Error("Character ID not found in URL. Please navigate from a Character Card."));
                setLoading(false);
                return;
            }
            if (DUMMY_USER_ID === "YOUR_ACTUAL_USER_ID_FROM_DB" || !DUMMY_USER_ID || DUMMY_USER_ID.length !== 24) { // Basic validation
                setError(new Error("User ID is not configured or is invalid. Please replace 'DUMMY_USER_ID' in ChatInterface.js with a real, 24-character MongoDB user ID."));
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch character data
                const characterResponse = await fetch(`http://localhost:3001/api/characters/${characterId}`);
                if (!characterResponse.ok) {
                    throw new Error(`Failed to fetch character: ${characterResponse.statusText}`);
                }
                const charData = await characterResponse.json();
                setCharacter(charData);

                // FIX: Set default chat background to character's avatar (avatar is now top-level)
                if (charData?.avatar) {
                    setChatBackground(charData.avatar);
                }

                // 2. Fetch user data
                const userResponse = await fetch(`http://localhost:3001/api/users/${DUMMY_USER_ID}`);
                if (!userResponse.ok) {
                    throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
                }
                const userData = await userResponse.json();
                setUser(userData);

                // 3. Fetch chat history (now also retrieves contextSummary)
                setIsHistoryLoading(true); // Indicate history is loading
                const historyResponse = await fetch(`http://localhost:3001/api/chat/history/${DUMMY_USER_ID}/${characterId}`);
                if (!historyResponse.ok) {
                    throw new Error(`Failed to fetch chat history: ${historyResponse.statusText}`);
                }
                const historyData = await historyResponse.json();

                if (historyData.messages && historyData.messages.length > 0) {
                    setMessages(historyData.messages);
                } else {
                    // FIX: Changed from charData?.data?.first_mes to charData?.first_mes
                    if (charData?.first_mes) {
                        setMessages([{ sender: 'ai', text: charData.first_mes }]);
                    }
                }
                // NEW: Set the context summary from fetched history
                setContextSummary(historyData.contextSummary || "");

                setLoading(false); // All data fetched
                setIsHistoryLoading(false); // History loading complete
            } catch (err) {
                setError(err);
                setLoading(false);
                setIsHistoryLoading(false);
                console.error("Error fetching initial chat data:", err);
            }
        };

        fetchAllChatData();
    }, [characterId, DUMMY_USER_ID]); // Rerun if charId or DUMMY_USER_ID changes

    // Effect for auto-scrolling when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        // Prevent sending empty messages, if user/character data isn't loaded, or if AI is already typing
        if (input.trim() === '' || !user || !character || isAiTyping) {
            console.warn('Attempted to send empty message, or missing user/character data, or AI is already typing.');
            return;
        }

        const userMessage = { sender: 'user', text: input.trim() };
        // Add user's message to display immediately in the UI
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInput(''); // Clear input field

        setIsAiTyping(true); // Set AI to typing state
        setError(null); // Clear any previous errors

        try {
            // Send message to backend's /api/chat/send endpoint
            const response = await fetch('http://localhost:3001/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user._id,
                    characterId: character._id,
                    message: userMessage.text, // This is the user's current message
                    userName: user.username,   // NEW: Send user's username
                    contextSummary: contextSummary, // NEW: Send current context summary
                }),
            });

            if (!response.ok) {
                const errorData = await response.json(); // Get error details from backend
                // FIX: Removed the extra 'new' keyword
                throw new Error(errorData.message || `Failed to send message: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Backend response:', data);

            // Update messages with AI response
            if (data.response && data.response.text) {
                setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: data.response.text }]);
            } else {
                console.warn("Backend response did not contain a text message:", data);
                setMessages(prevMessages => [...prevMessages, { sender: 'system', text: "AI response was empty or malformed." }]);
            }

            // NEW: Update context summary from the backend's response
            if (data.newContextSummary !== undefined) {
                setContextSummary(data.newContextSummary);
            }

            // Update user state with new message counts and unlocked images
            setUser(prevUser => {
                const charIdStr = character._id.toString(); // Ensure character._id is treated as a string for map key consistency
                const newUnlockedImages = data.newlyUnlockedImages
                    ? [
                        ...(prevUser.unlockedImages || []),
                        ...data.newlyUnlockedImages.map(url => ({
                            characterId: character._id, // Store as ObjectId in DB, but value is string here
                            imageUrl: url,
                        }))
                    ]
                    : prevUser.unlockedImages;

                return {
                    ...prevUser,
                    messageCounts: {
                        ...(prevUser.messageCounts || {}),
                        [charIdStr]: data.newMessageCount || (prevUser.messageCounts && prevUser.messageCounts[charIdStr])
                    },
                    unlockedImages: newUnlockedImages
                };
            });

            // Notify user about new unlocks
            if (data.newlyUnlockedImages && data.newlyUnlockedImages.length > 0) {
                alert(`Congratulations! You've unlocked new images: ${data.newlyUnlockedImages.join(', ')}`);
            }

        } catch (err) {
            console.error('Error sending message or processing response:', err);
            setError(new Error(`Failed to send message: ${err.message}. Please try again.`));
            // Add a temporary system message to the chat for immediate feedback
            setMessages(prevMessages => [...prevMessages, { sender: 'system', text: `Error: ${err.message}` }]);
        } finally {
            setIsAiTyping(false); // Always reset AI typing state after the request
        }
    };

    // --- NEW CHAT FUNCTIONALITY ---
    const handleNewChat = async () => {
        if (!user || !character) {
            console.warn("Cannot start new chat, user or character data not loaded.");
            setError(new Error("Cannot start new chat: User or character data not available."));
            return;
        }
        setError(null); // Clear any previous errors

        try {
            // 1. Delete history from backend
            const deleteResponse = await fetch(`http://localhost:3001/api/chat/history/${user._id}/${character._id}`, {
                method: 'DELETE',
            });

            // FIX: Handle 404 gracefully - it means no history found, which is fine for a new chat
            if (deleteResponse.ok) { // This means a 2xx status (e.g., 200 OK)
                console.log('Chat history cleared on backend.');
            } else if (deleteResponse.status === 404) {
                console.warn('No chat history found for this user/character. Proceeding with new chat.');
            } else { // Handle other HTTP errors as actual failures
                const errorData = await deleteResponse.json();
                throw new Error(errorData.message || `Failed to delete chat history: ${deleteResponse.statusText}`);
            }

            // 2. Reset frontend state, including contextSummary
            setMessages([]); // Clear all messages in the UI
            setInput(''); // Clear input field
            setIsGalleryOpen(false); // Close gallery if open
            setContextSummary(""); // NEW: Reset context summary on new chat

            // 3. Set the character's first message as the new start (if it exists)
            // FIX: Changed from character?.data?.first_mes to character?.first_mes
            if (character?.first_mes) {
                setMessages([{ sender: 'ai', text: character.first_mes }]);
            }

            // Optionally, you could also reset the user's messageCounts for this character to 0 if desired
            // This would require another API call to update the user document or integrate into the delete history API
            // For now, we're just clearing the chat history for a fresh conversation.

        } catch (err) {
            console.error('Error starting new chat:', err);
            setError(new Error(`Failed to start new chat: ${err.message}`));
        }
    };
    // --- END NEW CHAT FUNCTIONALITY ---

    const toggleGallery = () => {
        setIsGalleryOpen(!isGalleryOpen);
    };

    const handleSetBackground = (imageUrl) => {
        setChatBackground(imageUrl);
        setIsGalleryOpen(false); // Close gallery after selection
    };

    const handleGoBack = () => {
        navigate('/'); // Navigate back to the home page (where character cards are)
    };

    // Conditional rendering based on loading and error states
    if (loading || isHistoryLoading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading chat and history...</div>;
    }

    // Centralized error display for initial load or significant errors
    if (error) {
        return (
            <div className="chat-error-page">
                <div className="alert-error">
                    <strong>Error:</strong> {error.message}
                    <button className="alert-close-button" onClick={() => setError(null)}>X</button>
                    <p style={{ marginTop: '10px', fontSize: '0.9em' }}>Please ensure your backend server is running and accessible and your `DUMMY_USER_ID` is correctly set in `ChatInterface.js`.</p>
                    <button onClick={handleGoBack} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Go Back Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-interface-container" style={{ backgroundImage: chatBackground ? `url(${chatBackground})` : 'none' }}>
            {/* IN-CHAT ERROR DISPLAY (for transient errors like send failures) */}
            {error && (
                <div className="alert-error top-right">
                    {error.message}
                    <button className="alert-close-button" onClick={() => setError(null)}>X</button>
                </div>
            )}

            <div className="chat-header"> {/* This header will be sticky via CSS */}
                <button onClick={handleGoBack} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                {/* FIX: Access character name directly */}
                <h2>Chatting with {character?.name || 'Character'}</h2>
                <button onClick={handleNewChat} className="new-chat-button"> {/* New Chat Button */}
                    New Chat
                </button>
                <button onClick={toggleGallery} className="gallery-button">
                    {isGalleryOpen ? 'Close Gallery' : 'Open Gallery'}
                </button>
            </div>

            {isGalleryOpen && (
                <div className="gallery-overlay">
                    <div className="gallery-content">
                        <button onClick={toggleGallery} className="gallery-close-button">
                            <i className="fas fa-times"></i> Close Gallery
                        </button>
                        <h3>Image Gallery</h3>

                        <h4>Unlocked Images ({user?.unlockedImages?.filter(img => String(img.characterId) === String(character?._id)).length || 0} / {character?.rewardImages?.length || 0})</h4>
                        <div className="unlocked-images-grid">
                            {user?.unlockedImages && character && user.unlockedImages
                                .filter(img => String(img.characterId) === String(character._id)) // Ensure string comparison for ObjectIds
                                .map((img, index) => (
                                    <img
                                        key={index}
                                        src={img.imageUrl}
                                        alt={`Unlocked ${index}`}
                                        onClick={() => handleSetBackground(img.imageUrl)}
                                        className="gallery-image unlocked"
                                        title="Click to set as background"
                                    />
                                ))
                            }
                            {(!user?.unlockedImages || user.unlockedImages.filter(img => String(img.characterId) === String(character._id)).length === 0) && (
                                <p>No images unlocked for this character yet. Keep chatting!</p>
                            )}
                        </div>

                        <h4>Locked Images</h4>
                        <div className="locked-images-grid">
                            {character?.rewardImages && character.rewardImages.map((reward, index) => {
                                const isUnlocked = user?.unlockedImages && user.unlockedImages.some(
                                    (unlocked) => String(unlocked.characterId) === String(character._id) && unlocked.imageUrl === reward.url
                                );
                                // Ensure messageCounts access is robust with string keys
                                const currentMessages = user?.messageCounts?.[String(character._id)] || 0;
                                const messagesNeeded = reward.unlockThreshold - currentMessages;

                                return (
                                    <div key={index} className={`gallery-image-wrapper ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                        <img
                                            src={isUnlocked ? reward.url : 'https://via.placeholder.com/150?text=LOCKED'}
                                            alt={`Reward ${index}`}
                                            className={`gallery-image ${isUnlocked ? '' : 'blurred'}`}
                                            style={!isUnlocked ? { filter: 'blur(5px)' } : {}}
                                        />
                                        {!isUnlocked && (
                                            <div className="lock-overlay">
                                                <i className="fas fa-lock"></i>
                                                <p>{messagesNeeded > 0 ? `${messagesNeeded} more messages` : 'Unlocked!'}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {(!character?.rewardImages || character.rewardImages.length === 0) && (
                                <p>This character has no reward images configured on the backend.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-messages" ref={messagesEndRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                ))}
                {isAiTyping && (
                    <div className="message ai typing-indicator">
                        AI is typing...
                    </div>
                )}
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isAiTyping ? "Waiting for AI..." : "Type your message"}
                    disabled={isAiTyping || loading || isHistoryLoading}
                    aria-label={isAiTyping ? "Waiting for AI response" : "Type your message"}
                />
                <button onClick={handleSendMessage} disabled={isAiTyping || loading || isHistoryLoading} aria-label="Send message">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;