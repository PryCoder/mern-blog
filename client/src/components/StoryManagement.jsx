import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Badge, 
    Button, 
    Table, 
    Modal, 
    Alert,
    Spinner,
    Dropdown
} from 'flowbite-react';
import { 
    HiTrash, 
    HiArchive, 
    HiEye, 
    HiClock,
    HiOutlineRefresh,
    HiDotsVertical
} from 'react-icons/hi';

export default function StoryManagementPage() {
    const [userStories, setUserStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStory, setSelectedStory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [highlightAlbum, setHighlightAlbum] = useState('');
    const [stats, setStats] = useState({
        totalStories: 0,
        activeStories: 0,
        totalViews: 0
    });

    // Fetch user's stories
    useEffect(() => {
        fetchUserStories();
        fetchStoriesCount();
    }, []);

    const fetchUserStories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            // Using getFollowingStories API but filtering for current user
            const response = await fetch('/api/stories/following', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (response.ok) {
                // Filter to show only current user's stories
                const currentUserStories = data.stories.find(
                    storyGroup => storyGroup.user._id === userId
                );
                setUserStories(currentUserStories?.stories || []);
                
                // Calculate stats
                const totalViews = currentUserStories?.stories.reduce(
                    (sum, story) => sum + (story.viewsCount || 0), 0
                ) || 0;
                
                const activeStories = currentUserStories?.stories.filter(
                    story => new Date(story.expiresAt) > new Date()
                ).length || 0;
                
                setStats({
                    totalStories: currentUserStories?.stories.length || 0,
                    activeStories,
                    totalViews
                });
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
            setError('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    // API: Get stories count
    const fetchStoriesCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const response = await fetch(`/api/stories/user/${userId}/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStats(prev => ({
                    ...prev,
                    activeStories: data.activeStoriesCount
                }));
            }
        } catch (err) {
            console.error('Error fetching stories count:', err);
        }
    };

    // API: Delete story
    const handleDeleteStory = async () => {
        if (!selectedStory) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${selectedStory._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setUserStories(prev => prev.filter(story => story._id !== selectedStory._id));
                setShowDeleteModal(false);
                setSelectedStory(null);
                fetchUserStories(); // Refresh
            }
        } catch (err) {
            console.error('Error deleting story:', err);
            setError('Failed to delete story');
        }
    };

    // API: Archive story
    const handleArchiveStory = async () => {
        if (!selectedStory) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${selectedStory._id}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    highlightAlbum: highlightAlbum.trim() || 'Archived'
                })
            });

            if (response.ok) {
                setShowArchiveModal(false);
                setSelectedStory(null);
                setHighlightAlbum('');
                fetchUserStories(); // Refresh
            }
        } catch (err) {
            console.error('Error archiving story:', err);
            setError('Failed to archive story');
        }
    };

    // API: View story details
    const viewStoryDetails = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${storyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Open story in viewer or show details
                console.log('Story details:', data.story);
                // You can implement a modal to show details
            }
        } catch (err) {
            console.error('Error fetching story details:', err);
        }
    };

    // API: Get story viewers
    const viewStoryViewers = async (storyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/stories/${storyId}/viewers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Show viewers in modal
                alert(`This story has ${data.viewers.length} viewers`);
            }
        } catch (err) {
            console.error('Error fetching viewers:', err);
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
                <h1 className="text-3xl font-bold mb-8">Manage Your Stories</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Stories</p>
                                <p className="text-3xl font-bold">{stats.totalStories}</p>
                            </div>
                            <HiOutlineRefresh className="w-8 h-8 text-blue-500" />
                        </div>
                    </Card>
                    
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Stories</p>
                                <p className="text-3xl font-bold">{stats.activeStories}</p>
                            </div>
                            <HiClock className="w-8 h-8 text-green-500" />
                        </div>
                    </Card>
                    
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Views</p>
                                <p className="text-3xl font-bold">{stats.totalViews}</p>
                            </div>
                            <HiEye className="w-8 h-8 text-purple-500" />
                        </div>
                    </Card>
                </div>

                {error && (
                    <Alert color="failure" className="mb-6">
                        {error}
                    </Alert>
                )}

                {/* Stories Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Story</Table.HeadCell>
                                <Table.HeadCell>Type</Table.HeadCell>
                                <Table.HeadCell>Views</Table.HeadCell>
                                <Table.HeadCell>Status</Table.HeadCell>
                                <Table.HeadCell>Expires</Table.HeadCell>
                                <Table.HeadCell>Actions</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {userStories.map((story) => (
                                    <Table.Row key={story._id} className="bg-white">
                                        <Table.Cell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded overflow-hidden">
                                                    {story.mediaType === 'image' ? (
                                                        <img 
                                                            src={story.mediaUrl} 
                                                            alt="Story" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <span className="text-xs">VIDEO</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium truncate max-w-xs">
                                                        {story.caption || 'No caption'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(story.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={story.mediaType === 'image' ? 'blue' : 'purple'}>
                                                {story.mediaType.toUpperCase()}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center space-x-1">
                                                <HiEye className="w-4 h-4 text-gray-500" />
                                                <span>{story.viewsCount || 0}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {new Date(story.expiresAt) > new Date() ? (
                                                <Badge color="success">ACTIVE</Badge>
                                            ) : (
                                                <Badge color="failure">EXPIRED</Badge>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {new Date(story.expiresAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Dropdown
                                                arrowIcon={false}
                                                inline
                                                label={
                                                    <Button color="light" size="xs">
                                                        <HiDotsVertical className="w-5 h-5" />
                                                    </Button>
                                                }
                                            >
                                                <Dropdown.Item 
                                                    icon={HiEye}
                                                    onClick={() => viewStoryDetails(story._id)}
                                                >
                                                    View Details
                                                </Dropdown.Item>
                                                <Dropdown.Item 
                                                    icon={HiEye}
                                                    onClick={() => viewStoryViewers(story._id)}
                                                >
                                                    View Viewers
                                                </Dropdown.Item>
                                                <Dropdown.Item 
                                                    icon={HiArchive}
                                                    onClick={() => {
                                                        setSelectedStory(story);
                                                        setShowArchiveModal(true);
                                                    }}
                                                >
                                                    Archive
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item 
                                                    icon={HiTrash}
                                                    onClick={() => {
                                                        setSelectedStory(story);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600"
                                                >
                                                    Delete
                                                </Dropdown.Item>
                                            </Dropdown>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>

                    {userStories.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600">You haven't created any stories yet.</p>
                        </div>
                    )}
                </Card>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
                    <Modal.Header>Delete Story</Modal.Header>
                    <Modal.Body>
                        <div className="text-center">
                            <HiTrash className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-lg font-medium mb-2">Are you sure?</p>
                            <p className="text-gray-600">
                                This story will be permanently deleted. This action cannot be undone.
                            </p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            color="gray"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="failure"
                            onClick={handleDeleteStory}
                        >
                            Delete Story
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Archive Modal */}
                <Modal show={showArchiveModal} onClose={() => setShowArchiveModal(false)} size="md">
                    <Modal.Header>Archive Story</Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Save this story to highlights to keep it beyond 24 hours.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Album Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={highlightAlbum}
                                    onChange={(e) => setHighlightAlbum(e.target.value)}
                                    placeholder="e.g., Travel, Memories"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to archive without album
                                </p>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            color="gray"
                            onClick={() => {
                                setShowArchiveModal(false);
                                setHighlightAlbum('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            gradientDuoTone="purpleToPink"
                            onClick={handleArchiveStory}
                        >
                            Archive Story
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
}