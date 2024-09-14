import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function InstagramProfile() {
  const { currentUser } = useSelector((state) => state.user);
  const [userPosts, setUserPosts] = useState([]);
  const [showMore, setShowMore] = useState(true);

  // Fetching posts on profile load
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/post/getposts?userId=${currentUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setUserPosts(data.posts);
          if (data.posts.length < 9) {
            setShowMore(false);
          }
        } else {
          console.log('Failed to fetch posts:', data);
        }
      } catch (error) {
        console.log('Error fetching posts:', error.message);
      }
    };
    fetchPosts();
  }, [currentUser._id]);

  // Handle pagination to load more posts
  const handleShowMore = async () => {
    const startIndex = userPosts.length;
    try {
      const res = await fetch(
        `/api/post/getposts?userId=${currentUser._id}&startIndex=${startIndex}`
      );
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prev) => [...prev, ...data.posts]);
        if (data.posts.length < 9) {
          setShowMore(false);
        }
      } else {
        console.log('Failed to fetch more posts:', data);
      }
    } catch (error) {
      console.log('Error fetching more posts:', error.message);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-5">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser?.profilePicture || "/default-avatar.jpg"}
            alt="profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold text-center sm:text-left">
              {currentUser.username}
            </h2>
            <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 text-center sm:text-left">
              <span>{userPosts.length} posts</span>
              <span>200 followers</span> {/* Replace with actual follower data */}
              <span>180 following</span> {/* Replace with actual following data */}
            </div>
          </div>
        </div>
        <div>
          <Link
            to="/edit-profile"
            className="px-4 py-1 border rounded text-sm font-medium"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* User Posts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <div key={post._id} className="relative">
              <Link to={`/post/${post.slug}`}>
                <img
                  src={post.image}
                  alt={post.title || 'Post Image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-50 flex justify-center items-center text-white">
                  <span>❤ {post.likes || 0}</span> {/* Default to 0 if likes are undefined */}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-center col-span-2 sm:col-span-3">No posts yet</p>
        )}
      </div>

      {/* Show more posts */}
      {showMore && (
        <button
          onClick={handleShowMore}
          className="block mx-auto mt-5 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show More
        </button>
      )}
    </div>
  );
}
