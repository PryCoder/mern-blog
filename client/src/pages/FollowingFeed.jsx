import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard'; // Adjust path if needed
import { Spinner, Button } from 'flowbite-react';

export default function FollowingFeed() {
  const { currentUser } = useSelector((state) => state.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowingPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/post/getfollowingposts');
        const data = await res.json();
        if (res.ok) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchFollowingPosts();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-3 flex flex-col gap-8 py-7'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-semibold'>Following Feed</h1>
        <Link to='/'>
          <Button outline gradientDuoTone='purpleToBlue'>
            Explore Global
          </Button>
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className='flex flex-wrap gap-4 justify-center'>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className='text-center py-10'>
          <h2 className='text-2xl font-semibold text-gray-500 mb-4'>
            It's quiet here...
          </h2>
          <p className='text-gray-500 mb-4'>
            You aren't following anyone yet, or the people you follow haven't posted anything.
          </p>
          <Link to='/search'>
            <Button gradientDuoTone='purpleToBlue' className='mx-auto'>
              Discover Creators
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
