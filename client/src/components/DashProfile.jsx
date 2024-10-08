import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function InstagramProfile() {
  const { currentUser } = useSelector((state) => state.user);
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUser(true);
      try {
        const userRes = await fetch(`/api/user/${currentUser._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const userData = await userRes.json();
        if (userRes.ok) {
          setUser(userData);
          setIsFollowing(userData.isFollowing); // Ensure this flag is set correctly
        } else {
          setError('Failed to fetch user data');
        }
      } catch (error) {
        setError('Error fetching user data');
      }
      setLoadingUser(false);
    };

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/post/getposts?userId=${currentUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setUserPosts(data.posts);
          if (data.posts.length < 9) {
            setShowMore(false);
          }
        } else {
          setError('Failed to fetch posts');
        }
      } catch (error) {
        setError('Error fetching posts');
      }
      setLoadingPosts(false);
    };

    fetchUserData();
    fetchPosts();
  }, [currentUser._id]);

  const fetchFollowers = async () => {
    try {
      const res = await fetch(`/api/user/${currentUser._id}/followers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFollowersList(data.followers);
      } else {
        setError('Failed to fetch followers');
      }
    } catch (error) {
      setError('Error fetching followers');
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await fetch(`/api/user/${currentUser._id}/following`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFollowingList(data.following);
      } else {
        setError('Failed to fetch following');
      }
    } catch (error) {
      setError('Error fetching following');
    }
  };

  const handleFollow = async () => {
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      if (res.ok) {
        setIsFollowing(true);
        setUser((prevUser) => ({
          ...prevUser,
          followersCount: prevUser.followersCount + 1,
        }));
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Error following user');
      }
    } catch (error) {
      setError('Error following user');
    }
  };

  const handleUnfollow = async () => {
    try {
      const res = await fetch('/api/user/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      if (res.ok) {
        setIsFollowing(false);
        setUser((prevUser) => ({
          ...prevUser,
          followersCount: prevUser.followersCount - 1,
        }));
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Error unfollowing user');
      }
    } catch (error) {
      setError('Error unfollowing user');
    }
  };

  const handleShowMore = async () => {
    const startIndex = userPosts.length;
    try {
      const res = await fetch(`/api/post/getposts?userId=${currentUser._id}&startIndex=${startIndex}`);
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prev) => [...prev, ...data.posts]);
        if (data.posts.length < 9) {
          setShowMore(false);
        }
      } else {
        setError('Failed to fetch more posts');
      }
    } catch (error) {
      setError('Error fetching more posts');
    }
  };

  const toggleFollowersModal = async () => {
    if (!showFollowersModal) {
      await fetchFollowers(); // Fetch followers when opening the modal
    }
    setShowFollowersModal(!showFollowersModal);
  };

  const toggleFollowingModal = async () => {
    if (!showFollowingModal) {
      await fetchFollowing(); // Fetch following when opening the modal
    }
    setShowFollowingModal(!showFollowingModal);
  };

  if (loadingUser) {
    return <p>Loading user profile...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>User not found</p>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <img
            src={user?.profilePicture || '/default-avatar.jpg'}
            alt="profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold text-center sm:text-left">
              {user.username || 'Unknown User'}
            </h2>
            <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 text-center sm:text-left">
              <span>{userPosts.length} posts</span>
              <button onClick={toggleFollowersModal} className="text-blue-500">
                {user.followersCount || 0} followers
              </button>
              <button onClick={toggleFollowingModal} className="text-blue-500">
                {user.followingCount || 0} following
              </button>
            </div>
          </div>
        </div>
        {/* <div>
          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            className={`px-4 py-1 border rounded text-sm font-medium ${isFollowing ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div> */}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-16">
        {loadingPosts ? (
          <p className="text-center col-span-2 sm:col-span-3">Loading posts...</p>
        ) : userPosts.length > 0 ? (
          userPosts.map((post) => (
            <div key={post._id} className="relative">
              <Link to={`/post/${post.slug}`}>
                <img
                  src={post.image}
                  alt={post.title || 'Post Image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-50 flex justify-center items-center text-white">
                  <span>❤ {post.numberOfLikes || 0}</span>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-center col-span-2 sm:col-span-3">No posts yet</p>
        )}
      </div>

      {showMore && !loadingPosts && (
        <button
          onClick={handleShowMore}
          className="block mx-auto mt-5 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show More
        </button>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="dark:bg-gray-600 bg-gray-200 p-5 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg  dark:text-gray-100 font-semibold mb-4">Followers</h3>
            <ul>
              {followersList.length > 0 ? (
                followersList.map((follower) => (
                  <li key={follower._id} className="mb-2 flex items-center space-x-3">
                    <img
                      src={follower.profilePicture || '/default-avatar.jpg'}
                      alt={follower.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <Link to={`/profile/${follower._id}`} className="text-blue-500">
                      {follower.username}
                    </Link>
                  </li>
                ))
              ) : (
                <p>No followers yet</p>
              )}
            </ul>
            <button onClick={toggleFollowersModal} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 z-50">
          <div className="dark:bg-gray-600 bg-gray-200 p-5 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg dark:text-gray-100 font-semibold mb-4">Following</h3>
            <ul>
              {followingList.length > 0 ? (
                followingList.map((followee) => (
                  <li key={followee._id} className="mb-2 flex items-center space-x-3">
                    <img
                      src={followee.profilePicture || '/default-avatar.jpg'}
                      alt={followee.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <Link to={`/profile/${followee._id}`} className="text-blue-500">
                      {followee.username}
                    </Link>
                  </li>
                ))
              ) : (
                <p>Not following anyone yet</p>
              )}
            </ul>
            <button onClick={toggleFollowingModal} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
