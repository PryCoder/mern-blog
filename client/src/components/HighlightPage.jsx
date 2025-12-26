import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Card, 
    Avatar, 
    Badge, 
    Button, 
    Modal, 
    TextInput,
    Alert,
    Spinner,
    Dropdown
} from 'flowbite-react';
import { 
    HiCollection, 
    HiPlus, 
    HiDotsVertical,
    HiTrash,
    HiPencil,
    HiEye,
    HiClock
} from 'react-icons/hi';

export default function HighlightsPage() {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');
    const [activeStoriesCount, setActiveStoriesCount] = useState(0);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const { userId } = useParams();
    const currentUserId = localStorage.getItem('userId');

    // API: Get user highlights
    useEffect(() => {
        fetchHighlights();
        fetchStoriesCount();
    }, [userId]);

    const fetchHighlights = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/user/${userId || currentUserId}/highlights`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setHighlights(data.highlights);
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Error fetching highlights:', err);
            setError('Failed to load highlights');
        } finally {
            setLoading(false);
        }
    };

    // API: Get stories count
    const fetchStoriesCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/user/${userId || currentUserId}/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setActiveStoriesCount(data.activeStoriesCount);
            }
        } catch (err) {
            console.error('Error fetching stories count:', err);
        }
    };

    // API: Archive story to highlights (simulated)
    const addToHighlight = async (storyId, albumName) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/stories/${storyId}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ highlightAlbum: albumName })
            });
            fetchHighlights(); // Refresh
        } catch (err) {
            console.error('Error adding to highlights:', err);
        }
    };

    const createHighlightAlbum = async () => {
        if (!newAlbumName.trim()) return;

        try {
            // This is a simulated API call - you'd need to create this endpoint
            const token = localStorage.getItem('token');
            const response = await fetch('/api/stories/create-highlight-album', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    albumName: newAlbumName.trim(),
                    userId: userId || currentUserId
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewAlbumName('');
                fetchHighlights();
            }
        } catch (err) {
            console.error('Error creating album:', err);
        }
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Highlights</h1>
                        <p className="text-gray-600">
                            {activeStoriesCount > 0 
                                ? `${activeStoriesCount} active stories` 
                                : 'No active stories'}
                        </p>
                    </div>
                    
                    {(!userId || userId === currentUserId) && (
                        <Button 
                            gradientDuoTone="purpleToPink"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <HiPlus className="w-5 h-5 mr-2" />
                            New Highlight
                        </Button>
                    )}
                </div>

                {error && (
                    <Alert color="failure" className="mb-6">
                        {error}
                    </Alert>
                )}

                {/* Active Stories Count Badge */}
                {activeStoriesCount > 0 && (
                    <Card className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <HiClock className="w-6 h-6 text-green-500" />
                                <div>
                                    <p className="font-semibold">You have {activeStoriesCount} active stories</p>
                                    <p className="text-sm text-gray-600">They will expire in 24 hours</p>
                                </div>
                            </div>
                            <Link to="/stories">
                                <Button color="light">View Stories</Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Highlights Grid */}
                {highlights.length === 0 ? (
                    <Card className="text-center py-12">
                        <HiCollection className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Highlights Yet</h3>
                        <p className="text-gray-600 mb-6">
                            Save your favorite stories to highlights to keep them longer than 24 hours
                        </p>
                        {(!userId || userId === currentUserId) && (
                            <Button 
                                gradientDuoTone="purpleToPink"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Create Your First Highlight
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {highlights.map((album, idx) => (
                            <Card 
                                key={idx}
                                className="relative group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                {/* Album Cover */}
                                <div 
                                    className="aspect-square rounded-lg overflow-hidden mb-3 cursor-pointer"
                                    onClick={() => setSelectedAlbum(album)}
                                >
                                    <img 
                                        src={album.coverImage} 
                                        alt={album.albumName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all"></div>
                                </div>

                                {/* Album Info */}
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{album.albumName}</h3>
                                            <p className="text-sm text-gray-600">
                                                {album.stories.length} {album.stories.length === 1 ? 'story' : 'stories'}
                                            </p>
                                        </div>
                                        
                                        {(!userId || userId === currentUserId) && (
                                            <Dropdown
                                                arrowIcon={false}
                                                inline
                                                label={
                                                    <Button color="light" size="xs">
                                                        <HiDotsVertical className="w-5 h-5" />
                                                    </Button>
                                                }
                                            >
                                                <Dropdown.Item icon={HiPencil}>
                                                    Rename
                                                </Dropdown.Item>
                                                <Dropdown.Item icon={HiTrash}>
                                                    Delete
                                                </Dropdown.Item>
                                                <Dropdown.Item icon={HiEye}>
                                                    View Details
                                                </Dropdown.Item>
                                            </Dropdown>
                                        )}
                                    </div>
                                </div>

                                {/* New Badge */}
                                {album.stories.some(s => 
                                    new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                ) && (
                                    <Badge color="green" className="absolute top-2 right-2">
                                        NEW
                                    </Badge>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Album Details Modal */}
                {selectedAlbum && (
                    <Modal show={!!selectedAlbum} onClose={() => setSelectedAlbum(null)} size="2xl">
                        <Modal.Header>
                            {selectedAlbum.albumName}
                        </Modal.Header>
                        <Modal.Body>
                            <div className="grid grid-cols-2 gap-4">
                                {selectedAlbum.stories.map((story, idx) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden">
                                        {story.mediaType === 'image' ? (
                                            <img 
                                                src={story.mediaUrl} 
                                                alt="" 
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <video 
                                                src={story.mediaUrl}
                                                className="w-full h-48 object-cover"
                                            />
                                        )}
                                        <div className="p-3">
                                            <p className="text-sm truncate">{story.caption || 'No caption'}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(story.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Modal.Body>
                    </Modal>
                )}

                {/* Create Album Modal */}
                <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
                    <Modal.Header>
                        Create New Highlight
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Album Name
                                </label>
                                <TextInput
                                    value={newAlbumName}
                                    onChange={(e) => setNewAlbumName(e.target.value)}
                                    placeholder="e.g., Travel, Memories, Friends"
                                    required
                                />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Tip:</span> Highlights let you save your favorite stories 
                                    beyond the 24-hour limit. You can organize them into albums.
                                </p>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            color="gray"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            gradientDuoTone="purpleToPink"
                            onClick={createHighlightAlbum}
                            disabled={!newAlbumName.trim()}
                        >
                            Create Album
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
}