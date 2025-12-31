import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Modal, 
    Avatar, 
    Button, 
    TextInput,
    Spinner,
    Dropdown 
} from 'flowbite-react';
import { 
    HiChevronLeft, 
    HiChevronRight, 
    HiX, 
    HiHeart, 
    HiOutlineHeart,
    HiOutlineChat, 
    HiPaperAirplane,
    HiOutlinePaperAirplane,
    HiOutlineEmojiHappy,
    HiDotsVertical,
    HiEye,
    HiPlus,
    HiMusicNote,
    HiLocationMarker,
    HiClock
} from 'react-icons/hi';
import { FaRegSmile } from 'react-icons/fa';

export default function InstagramStories() {
    const [stories, setStories] = useState([]);
    const [showStoryViewer, setShowStoryViewer] = useState(false);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState([]);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [storyTimeLeft, setStoryTimeLeft] = useState(0);
    
    const progressIntervalRef = useRef(null);
    const storyTimerRef = useRef(null);
    const navigate = useNavigate();
    const { storyId } = useParams();

    // Instagram-like gradient colors for story rings
    const gradientColors = [
        'from-purple-500 via-pink-500 to-red-500',
        'from-blue-500 via-cyan-500 to-green-500',
        'from-yellow-500 via-orange-500 to-red-500',
        'from-green-500 via-teal-500 to-blue-500',
        'from-pink-500 via-rose-500 to-red-500',
        'from-indigo-500 via-purple-500 to-pink-500'
    ];

    // Fetch stories
    useEffect(() => {
        fetchFollowingStories();
    }, []);

    const fetchFollowingStories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/stories/following', {
                headers: { 'Authorization': `Bearer ${token}` },credentials: 'include', 
            }); 
            
            const data = await response.json();
            if (response.ok) {
                setStories(data.stories);
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
        }
    };

    const openStoryViewer = (userIndex, storyIndex = 0) => {
        const userStories = stories[userIndex];
        if (!userStories || userStories.stories.length === 0) return;

        setCurrentUserIndex(userIndex);
        setCurrentStoryIndex(storyIndex);
        setShowStoryViewer(true);
        setProgress(0);
        setIsPaused(false);
        
        // Start progress
        startProgress(userStories.stories[storyIndex].duration);
        
        // Mark as viewed
        markAsViewed(userStories.stories[storyIndex]._id);
    };

    const startProgress = (duration) => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        
        const totalTime = duration * 1000; // Convert to milliseconds
        const interval = 100; // Update every 100ms
        let elapsed = 0;
        
        progressIntervalRef.current = setInterval(() => {
            if (!isPaused) {
                elapsed += interval;
                const newProgress = (elapsed / totalTime) * 100;
                setProgress(newProgress);
                
                // Calculate time left
                const timeLeft = Math.max(0, (totalTime - elapsed) / 1000);
                setStoryTimeLeft(Math.ceil(timeLeft));
                
                if (newProgress >= 100) {
                    clearInterval(progressIntervalRef.current);
                    nextStory();
                }
            }
        }, interval);
    };

    const pauseStory = () => {
        setIsPaused(true);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    const resumeStory = () => {
        setIsPaused(false);
        const currentStory = getCurrentStory();
        if (currentStory) {
            const remainingTime = ((100 - progress) / 100) * currentStory.duration;
            startProgress(remainingTime);
        }
    };

    const nextStory = () => {
        const currentUser = stories[currentUserIndex];
        
        if (currentStoryIndex < currentUser.stories.length - 1) {
            // Next story from same user
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
            const nextStory = currentUser.stories[currentStoryIndex + 1];
            markAsViewed(nextStory._id);
            startProgress(nextStory.duration);
        } else if (currentUserIndex < stories.length - 1) {
            // Next user
            const nextUserIndex = currentUserIndex + 1;
            const nextUser = stories[nextUserIndex];
            if (nextUser && nextUser.stories.length > 0) {
                setCurrentUserIndex(nextUserIndex);
                setCurrentStoryIndex(0);
                setProgress(0);
                markAsViewed(nextUser.stories[0]._id);
                startProgress(nextUser.stories[0].duration);
            } else {
                closeStoryViewer();
            }
        } else {
            closeStoryViewer();
        }
    };

    const previousStory = () => {
        if (currentStoryIndex > 0) {
            // Previous story from same user
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
            const prevStory = stories[currentUserIndex].stories[currentStoryIndex - 1];
            startProgress(prevStory.duration);
        } else if (currentUserIndex > 0) {
            // Previous user
            const prevUserIndex = currentUserIndex - 1;
            const prevUser = stories[prevUserIndex];
            if (prevUser && prevUser.stories.length > 0) {
                setCurrentUserIndex(prevUserIndex);
                setCurrentStoryIndex(prevUser.stories.length - 1);
                setProgress(0);
                const prevStory = prevUser.stories[prevUser.stories.length - 1];
                startProgress(prevStory.duration);
            }
        }
    };

    const closeStoryViewer = () => {
        setShowStoryViewer(false);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
        setProgress(0);
        setIsPaused(false);
    };

    const markAsViewed = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }, credentials: 'include', 
            });
        } catch (err) {
            console.error('Error marking as viewed:', err);
        }
    };

    const reactToStory = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/react`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }, credentials: 'include', 
                body: JSON.stringify({ emoji: '❤️' })
            });
            setShowReactions(true);
            setTimeout(() => setShowReactions(false), 2000);
        } catch (err) {
            console.error('Error reacting:', err);
        }
    };

    const replyToStory = async () => {
        if (!replyText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const currentStory = getCurrentStory();
            await fetch(`/api/stories/${currentStory._id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }, credentials: 'include', 
                body: JSON.stringify({ text: replyText })
            });
            setReplyText('');
        } catch (err) {
            console.error('Error replying:', err);
        }
    };

    const fetchViewers = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${storyId}/viewers`, {
                headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include', 
            });
            const data = await response.json();
            if (response.ok) {
                setViewersList(data.viewers);
                setShowViewers(true);
                pauseStory();
            }
        } catch (err) {
            console.error('Error fetching viewers:', err);
        }
    };

    const getCurrentStory = () => {
        if (!stories[currentUserIndex] || !stories[currentUserIndex].stories[currentStoryIndex]) {
            return null;
        }
        return stories[currentUserIndex].stories[currentStoryIndex];
    };

    const getCurrentUser = () => {
        if (!stories[currentUserIndex]) return null;
        return stories[currentUserIndex].user;
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showStoryViewer) return;
            
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextStory();
            } else if (e.key === 'ArrowLeft') {
                previousStory();
            } else if (e.key === 'Escape') {
                closeStoryViewer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showStoryViewer, currentUserIndex, currentStoryIndex]);

    // Instagram-like reaction emojis
    const reactions = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="instagram-stories-container">
            {/* Instagram Stories Header Bar */}
            <div className="stories-header-bar bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
                    
                    {/* Your Story (Add Story) */}
                    <div className="flex-shrink-0">
                        <div 
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => navigate('/stories/create')}
                        >
                            <div className="relative mb-2">
                                <div className="w-16 h-16 rounded-full border-2 border-gray-300 overflow-hidden">
                                    <img
                                        src={localStorage.getItem('profilePicture') || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                                        alt="Your story"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <HiPlus className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="text-xs">Your story</span>
                        </div>
                    </div>

                    {/* Following Stories */}
                    {stories.map((userStories, index) => (
                        <div 
                            key={userStories.user._id}
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => openStoryViewer(index, 0)}
                        >
                            <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                    {/* Instagram-like gradient ring */}
                                    <div className={`w-16 h-16 rounded-full p-0.5 ${gradientColors[index % gradientColors.length]} bg-gradient-to-r`}>
                                        <div className="w-full h-full rounded-full bg-white p-0.5">
                                            <img
                                                src={userStories.user.profilePicture}
                                                alt={userStories.user.username}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    {/* Unviewed indicator */}
                                    {userStories.hasUnviewed && (
                                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <span className="text-xs truncate max-w-[64px]">
                                    {userStories.user.username}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Instagram Story Viewer */}
            {showStoryViewer && getCurrentStory() && getCurrentUser() && (
                <div className="instagram-story-viewer fixed inset-0 z-50 bg-black">
                    
                    {/* Progress Bars (Instagram Style) */}
                    <div className="absolute top-0 left-0 right-0 p-3 flex space-x-1 z-50">
                        {stories[currentUserIndex].stories.map((_, idx) => (
                            <div 
                                key={idx}
                                className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden"
                            >
                                <div 
                                    className={`h-full ${idx === currentStoryIndex ? 'bg-white' : idx < currentStoryIndex ? 'bg-white' : 'bg-gray-600'}`}
                                    style={{
                                        width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%',
                                        transition: idx === currentStoryIndex ? 'width 0.1s linear' : 'none'
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>

                    {/* Header with User Info */}
                    <div className="absolute top-12 left-4 right-4 z-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full p-0.5 ${gradientColors[currentUserIndex % gradientColors.length]} bg-gradient-to-r`}>
                                <div className="w-full h-full rounded-full bg-white p-0.5">
                                    <img
                                        src={getCurrentUser().profilePicture}
                                        alt={getCurrentUser().username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{getCurrentUser().username}</p>
                                <p className="text-gray-300 text-sm">
                                    {storyTimeLeft > 0 ? `${storyTimeLeft}s` : 'Now'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => setIsPaused(!isPaused)}
                                className="text-white hover:text-gray-300"
                            >
                                {isPaused ? (
                                    <HiClock className="w-5 h-5" />
                                ) : (
                                    <span className="text-xs font-semibold">Pause</span>
                                )}
                            </button>
                            <button 
                                onClick={closeStoryViewer}
                                className="text-white hover:text-gray-300"
                            >
                                <HiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Story Content */}
                    <div 
                        className="w-full h-full flex items-center justify-center"
                        onMouseDown={pauseStory}
                        onMouseUp={resumeStory}
                        onTouchStart={pauseStory}
                        onTouchEnd={resumeStory}
                    >
                        {getCurrentStory().mediaType === 'image' ? (
                            <img 
                                src={getCurrentStory().mediaUrl} 
                                alt="Story" 
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <video 
                                src={getCurrentStory().mediaUrl}
                                autoPlay
                                muted
                                playsInline
                                className="max-w-full max-h-full object-contain"
                                onEnded={nextStory}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons (Invisible click areas) */}
                    <div className="absolute inset-0 flex">
                        <div 
                            className="w-1/2 h-full cursor-pointer"
                            onClick={previousStory}
                        />
                        <div 
                            className="w-1/2 h-full cursor-pointer"
                            onClick={nextStory}
                        />
                    </div>

                    {/* Reaction Popup */}
                    {showReactions && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-6xl animate-bounce">❤️</div>
                        </div>
                    )}

                    {/* Instagram Story Bottom Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-50">
                        
                        {/* Caption and Music/Location Tags */}
                        {(getCurrentStory().caption || getCurrentStory().location) && (
                            <div className="mb-4 max-w-lg mx-auto">
                                {getCurrentStory().caption && (
                                    <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg mb-2">
                                        {getCurrentStory().caption}
                                    </p>
                                )}
                                <div className="flex items-center space-x-3">
                                    {getCurrentStory().location && (
                                        <div className="flex items-center bg-black bg-opacity-50 px-3 py-1.5 rounded-full">
                                            <HiLocationMarker className="w-4 h-4 text-white mr-1" />
                                            <span className="text-white text-xs">{getCurrentStory().location}</span>
                                        </div>
                                    )}
                                    {/* Music Sticker (like Instagram) */}
                                    <div className="flex items-center bg-black bg-opacity-50 px-3 py-1.5 rounded-full">
                                        <HiMusicNote className="w-4 h-4 text-white mr-1" />
                                        <span className="text-white text-xs">Original Audio</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Instagram-like Reply Input */}
                        <div className="max-w-lg mx-auto">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 relative">
                                    <TextInput
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Send message"
                                        className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                                        onFocus={pauseStory}
                                        onBlur={resumeStory}
                                        onKeyPress={(e) => e.key === 'Enter' && replyToStory()}
                                    />
                                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <FaRegSmile className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                <button
                                    onClick={replyToStory}
                                    className="text-blue-400 hover:text-blue-300"
                                    disabled={!replyText.trim()}
                                >
                                    <HiOutlinePaperAirplane className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => reactToStory(getCurrentStory()._id)}
                                    className="text-red-500 hover:text-red-400"
                                >
                                    <HiHeart className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => fetchViewers(getCurrentStory()._id)}
                                    className="text-white hover:text-gray-300"
                                >
                                    <HiEye className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {/* Instagram-style Quick Reactions */}
                            <div className="flex justify-center space-x-4 mt-4">
                                {reactions.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            reactToStory(getCurrentStory()._id);
                                            setShowReactions(true);
                                            setTimeout(() => setShowReactions(false), 2000);
                                        }}
                                        className="text-2xl hover:scale-125 transition-transform"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Instagram-style Bottom Navigation */}
                    <div className="absolute bottom-24 right-4 flex flex-col items-end space-y-3">
                        <Dropdown
                            arrowIcon={false}
                            inline
                            label={
                                <button className="bg-black bg-opacity-50 p-2 rounded-full">
                                    <HiDotsVertical className="w-6 h-6 text-white" />
                                </button>
                            }
                        >
                            <Dropdown.Item onClick={() => fetchViewers(getCurrentStory()._id)}>
                                View Viewers
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => {/* Archive */}}>
                                Save to Highlights
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => {/* Share */}}>
                                Share Story
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => {/* Delete */}} className="text-red-600">
                                Delete Story
                            </Dropdown.Item>
                        </Dropdown>
                    </div>
                </div>
            )}

            {/* Viewers Modal (Instagram Style) */}
            <Modal 
                show={showViewers} 
                onClose={() => {
                    setShowViewers(false);
                    resumeStory();
                }}
                size="md"
            >
                <Modal.Header className="border-b border-gray-200">
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold">Viewers</h3>
                        <span className="text-sm text-gray-500">{viewersList.length} views</span>
                    </div>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                        {viewersList.map((viewer, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100"
                            >
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={viewer.user.profilePicture}
                                        alt={viewer.user.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium">{viewer.user.username}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(viewer.viewedAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                                    Message
                                </button>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            {/* Empty State */}
            {stories.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center mb-4">
                        <HiPlus className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Stories Available</h3>
                    <p className="text-gray-500 text-center mb-6">
                        When your friends share stories, they'll appear here.
                    </p>
                    <Button 
                        gradientDuoTone="purpleToPink"
                        onClick={() => navigate('/stories/create')}
                    >
                        Share Your First Story
                    </Button>
                </div>
            )}

            {/* Create Story Floating Button (Mobile) */}
            <button
                onClick={() => navigate('/stories/create')}
                className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
                <HiPlus className="w-7 h-7 text-white" />
            </button>
        </div>
    );
}