import { useEffect, useState } from 'react';
import { Spinner } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { FaThumbsUp } from 'react-icons/fa';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Assuming you have a currentUser object from your authentication context or state
  const currentUser = { _id: 'user123', token: 'jwt-token' }; // Replace with actual user data

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const postRes = await fetch('/api/post/getPosts?limit=15');
        if (!postRes.ok) throw new Error('Failed to fetch posts');
        const postData = await postRes.json();

        setPosts(postData.posts || []);
        setError(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle the like/unlike functionality
  const handleLike = async (postId, hasLiked, index) => {
    try {
      const res = await fetch(`/api/post/likePost/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`, // Assuming you have a token
        },
      });

      if (res.ok) {
        const updatedPost = await res.json();
        const updatedPosts = [...posts];
        updatedPosts[index].numberOfLikes = updatedPost.numberOfLikes;
        updatedPosts[index].hasLiked = !hasLiked; // Toggle like status
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Failed to like/unlike the post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-4xl font-extrabold text-center my-6 text-gray-900 dark:text-white">Latest Posts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post._id} className="bg-violet-700 rounded-lg shadow-lg">
              {/* User Profile Section */}
              <div className="flex items-center p-4">
                {post.userId?.profilePicture ? (
                  <Link to={`/profile/${post.userId._id}?tab=profile`} className="flex-shrink-0">
                    <img
                      src={post.userId.profilePicture}
                      alt={post.userId.username || 'Unknown User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div> // Placeholder if no profile picture
                )}
                <span className="ml-3 font-bold text-gray-800 dark:text-white">
                  {post.userId ? (
                    <Link to={`/profile/${post.userId._id}`}>{post.userId.username || 'Unknown User'}</Link>
                  ) : (
                    'Unknown User'
                  )}
                </span>
              </div>

              {/* Post Image */}
              <Link to={`/post/${post.slug}`}>
                <img
                  src={post.image}
                  alt={post.title || 'Post Image'}
                  className="w-full h-72 object-cover cursor-pointer"
                />
              </Link>
 <div className="flex items-center ml-2 mt-2 text-black">
                  <button
                    onClick={() => handleLike(post._id, post.hasLiked, index)}
                    className="flex items-center space-x-2"
                  >
                    <FaThumbsUp
                      className={`${post.hasLiked ? 'text-gray-400' : 'text-blue-500'} text-2xl cursor-pointer`}
                    />
                    <span>
                      {post.numberOfLikes} {post.numberOfLikes === 1 ? 'Like' : 'Likes'}
                    </span>
                  </button>
                </div>
              {/* Post Title and Time */}
              <div className="p-4">
                <Link to={`/post/${post.slug}`}>
                  <h3 className="font-bold text-lg text-gray-900 cursor-pointer dark:text-white">{post.title}</h3>
                </Link>
                <p className="text-sm text-gray-900 mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>

                {/* Like Button */}
               
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No posts available</p>
        )}
      </div>
    </div>
  );
}
