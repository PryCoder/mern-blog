import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Card, 
    Avatar, 
    Badge, 
    Button, 
    Modal, 
    TextInput, 
    Alert,
    Spinner 
} from 'flowbite-react';
import { 
    HiChevronRight, 
    HiX, 
    HiHeart, 
    HiOutlineHeart,
    HiChat, 
    HiPaperAirplane,
    HiEye,
    HiClock,
    HiLocationMarker,
    HiHashtag
} from 'react-icons/hi';

export default function StoriesFeedPage() {
    const [stories, setStories] = useState([]);
    const [viewingStory, setViewingStory] = useState(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyText, setReplyText] = useState('');
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState([]);
    const [reactionEmoji, setReactionEmoji] = useState('❤️');
    const [storyDetails, setStoryDetails] = useState(null);
    const navigate = useNavigate();
    const { storyId } = useParams();
    const timerRef = React.useRef(null);

    // API: Get following stories
    useEffect(() => {
        fetchFollowingStories();
    }, []);

    // API: Get specific story if URL has storyId
    useEffect(() => {
        if (storyId) {
            fetchStory(storyId);
        }
    }, [storyId]);

    const fetchFollowingStories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/stories/following', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStories(data.stories);
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
            setError('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    // API: Get specific story
    const fetchStory = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStoryDetails(data.story);
                openStoryViewer([{ user: data.story.userId, stories: [data.story] }], 0, 0);
            }
        } catch (err) {
            console.error('Error fetching story:', err);
        }
    };

    // API: View story
    const markAsViewed = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (err) {
            console.error('Error marking as viewed:', err);
        }
    };

    // API: React to story
    const reactToStory = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/react`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emoji: reactionEmoji })
            });
        } catch (err) {
            console.error('Error reacting to story:', err);
        }
    };

    // API: Reply to story
    const replyToStory = async () => {
        if (!replyText.trim() || !viewingStory) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${viewingStory._id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: replyText })
            });
            setReplyText('');
        } catch (err) {
            console.error('Error replying to story:', err);
        }
    };

    // API: Get story viewers
    const fetchViewers = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${storyId}/viewers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setViewersList(data.viewers);
                setShowViewers(true);
            }
        } catch (err) {
            console.error('Error fetching viewers:', err);
        }
    };

    // API: Delete story
    const deleteStory = async (storyId) => {
        if (!window.confirm('Are you sure you want to delete this story?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchFollowingStories(); // Refresh list
            setViewingStory(null);
        } catch (err) {
            console.error('Error deleting story:', err);
        }
    };

    // API: Archive story
    const archiveStory = async (storyId, highlightAlbum = '') => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ highlightAlbum })
            });
        } catch (err) {
            console.error('Error archiving story:', err);
        }
    };

    const openStoryViewer = (storiesList, userIdx, storyIdx) => {
        const story = storiesList[userIdx]?.stories[storyIdx];
        if (!story) return;

        setCurrentUserIndex(userIdx);
        setCurrentStoryIndex(storyIdx);
        setViewingStory(story);
        
        // Mark as viewed
        markAsViewed(story._id);
        
        // Start timer for next story
        startStoryTimer(story.duration);
    };

    const startStoryTimer = (duration) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        
        timerRef.current = setTimeout(() => {
            nextStory();
        }, duration * 1000);
    };

    const nextStory = () => {
        const currentUser = stories[currentUserIndex];
        
        if (currentStoryIndex < currentUser.stories.length - 1) {
            const nextIdx = currentStoryIndex + 1;
            openStoryViewer(stories, currentUserIndex, nextIdx);
        } else if (currentUserIndex < stories.length - 1) {
            openStoryViewer(stories, currentUserIndex + 1, 0);
        } else {
            closeStoryViewer();
        }
    };

    const previousStory = () => {
        if (currentStoryIndex > 0) {
            openStoryViewer(stories, currentUserIndex, currentStoryIndex - 1);
        } else if (currentUserIndex > 0) {
            const prevUser = stories[currentUserIndex - 1];
            openStoryViewer(stories, currentUserIndex - 1, prevUser.stories.length - 1);
        }
    };

    const closeStoryViewer = () => {
        setViewingStory(null);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Stories</h1>

                {error && (
                    <Alert color="failure" className="mb-6">
                        {error}
                    </Alert>
                )}

                {/* Stories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    {stories.map((userStories, userIdx) => (
                        <Card 
                            key={userStories.user._id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => openStoryViewer(stories, userIdx, 0)}
                        >
                            <div className="text-center">
                                <div className="relative inline-block mb-2">
                                    <Avatar 
                                        img={userStories.user.profilePicture}
                                        rounded
                                        size="lg"
                                        className={`ring-4 ${userStories.hasUnviewed ? 'ring-red-500' : 'ring-gray-300'}`}
                                    />
                                    {userStories.hasUnviewed && (
                                        <Badge color="red" className="absolute -top-1 -right-1">
                                            NEW
                                        </Badge>
                                    )}
                                </div>
                                <p className="font-medium">{userStories.user.username}</p>
                                <p className="text-sm text-gray-500">
                                    {userStories.stories.length} {userStories.stories.length === 1 ? 'story' : 'stories'}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Create Story Button */}
                <div className="text-center mb-12">
                    <Button 
                        gradientDuoTone="purpleToPink" 
                        onClick={() => navigate('/stories/create')}
                        size="lg"
                    >
                        Create Your Own Story
                    </Button>
                </div>

                {/* Story Viewer Modal */}
                <Modal 
                    show={!!viewingStory} 
                    onClose={closeStoryViewer}
                    size="4xl"
                    position="center"
                >
                    {viewingStory && (
                        <>
                            <Modal.Header className="border-b-0">
                                <div className="flex items-center space-x-3">
                                    <Avatar 
                                        img={stories[currentUserIndex]?.user.profilePicture}
                                        rounded
                                    />
                                    <div>
                                        <p className="font-bold">{stories[currentUserIndex]?.user.username}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(viewingStory.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <Button color="gray" size="xs" onClick={closeStoryViewer}>
                                    <HiX className="w-5 h-5" />
                                </Button>
                            </Modal.Header>
                            <Modal.Body className="p-0">
                                <div className="relative bg-black">
                                    {viewingStory.mediaType === 'image' ? (
                                        <img 
                                            src={viewingStory.mediaUrl} 
                                            alt="Story" 
                                            className="w-full max-h-[70vh] object-contain"
                                        />
                                    ) : (
                                        <video 
                                            src={viewingStory.mediaUrl} 
                                            autoPlay 
                                            controls 
                                            className="w-full max-h-[70vh]"
                                            onEnded={nextStory}
                                        />
                                    )}

                                    {/* Progress Bars */}
                                    <div className="absolute top-0 left-0 right-0 p-4 flex space-x-1">
                                        {stories[currentUserIndex]?.stories.map((_, idx) => (
                                            <div 
                                                key={idx}
                                                className="h-1 flex-1 bg-gray-300 rounded-full overflow-hidden"
                                            >
                                                <div 
                                                    className={`h-full ${idx === currentStoryIndex ? 'bg-white animate-pulse' : idx < currentStoryIndex ? 'bg-white' : 'bg-gray-600'}`}
                                                    style={{
                                                        width: idx === currentStoryIndex ? '100%' : idx < currentStoryIndex ? '100%' : '0%'
                                                    }}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Story Info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                                        {viewingStory.caption && (
                                            <p className="text-white text-lg mb-2">{viewingStory.caption}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {viewingStory.location && (
                                                <Badge color="gray" icon={HiLocationMarker}>
                                                    {viewingStory.location}
                                                </Badge>
                                            )}
                                            {viewingStory.hashtags?.map((tag, idx) => (
                                                <Badge key={idx} color="gray" icon={HiHashtag}>
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="border-t-0">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex space-x-3">
                                        <Button 
                                            color="gray" 
                                            size="sm"
                                            onClick={() => reactToStory(viewingStory._id)}
                                        >
                                            <HiOutlineHeart className="w-5 h-5 mr-1" />
                                            Like
                                        </Button>
                                        <Button 
                                            color="gray" 
                                            size="sm"
                                            onClick={() => fetchViewers(viewingStory._id)}
                                        >
                                            <HiEye className="w-5 h-5 mr-1" />
                                            {viewingStory.viewsCount}
                                        </Button>
                                        <Button 
                                            color="gray" 
                                            size="sm"
                                            onClick={() => archiveStory(viewingStory._id)}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button 
                                            color="failure" 
                                            size="sm"
                                            onClick={() => deleteStory(viewingStory._id)}
                                        >
                                            Delete
                                        </Button>
                                        <Button 
                                            gradientDuoTone="purpleToPink" 
                                            size="sm"
                                            onClick={() => archiveStory(viewingStory._id, 'Highlights')}
                                        >
                                            Add to Highlights
                                        </Button>
                                    </div>
                                </div>

                                {/* Reply Input */}
                                <div className="w-full mt-4">
                                    <div className="flex space-x-2">
                                        <TextInput
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Reply to story..."
                                            className="flex-1"
                                            onKeyPress={(e) => e.key === 'Enter' && replyToStory()}
                                        />
                                        <Button onClick={replyToStory}>
                                            <HiPaperAirplane className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Modal.Footer>
                        </>
                    )}
                </Modal>

                {/* Viewers Modal */}
                <Modal show={showViewers} onClose={() => setShowViewers(false)}>
                    <Modal.Header>Story Viewers</Modal.Header>
                    <Modal.Body>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {viewersList.map((viewer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                    <div className="flex items-center space-x-3">
                                        <Avatar img={viewer.user.profilePicture} rounded size="sm" />
                                        <div>
                                            <p className="font-medium">{viewer.user.username}</p>
                                            <p className="text-sm text-gray-500">
                                                Viewed {new Date(viewer.viewedAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
}