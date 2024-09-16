import { Button, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaThumbsUp } from 'react-icons/fa';
import CallToAction from '../components/CallToAction';
import CommentSection from '../components/CommentSection';

export default function PostPage() {
  const { postSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [numberOfLikes, setNumberOfLikes] = useState(0);

  // Assuming you have a currentUser object from your authentication context or state
  const currentUser = { _id: 'user123', token: 'jwt-token' }; // Replace with actual user data

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
        const data = await res.json();

        if (!res.ok) {
          setError(true);
        } else {
          setPost(data.posts[0]);
          setHasLiked(data.posts[0].likes.includes(currentUser._id)); // Check if the current user has liked the post
          setNumberOfLikes(data.posts[0].numberOfLikes);
          setError(false);
        }
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postSlug]);

  // Handle the like/unlike functionality
  const handleLike = async () => {
    try {
      const res = await fetch(`/api/post/likePost/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`, // Assuming you have a token
        },
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setNumberOfLikes(updatedPost.numberOfLikes);
        setHasLiked(!hasLiked); // Toggle like status
      }
    } catch (error) {
      console.error('Failed to like/unlike the post:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <main className='p-3 flex flex-col max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-3xl mt-10 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl'>
        {post && post.title}
      </h1>

      <Link to={`/search?category=${post && post.category}`} className='self-center mt-5'>
        <Button color='gray' pill size='xs'>
          {post && post.category}
        </Button>
      </Link>

      <img
        src={post && post.image}
        className='mt-8 p-3 max-h-{600px} w-full object-cover'
        alt='Post Image'
      />

      <div className='flex justify-between p-3 border-b border-slate-500 mx-auto w-full max-w-2xl text-xs'>
        <span className='italic'>
          {post && new Date(post.createdAt).toLocaleDateString()}
        </span>
        <span className='italic'>
          {post && (post.content.length / 1000).toFixed(0)} mins read
        </span>
      </div>

      <div
        className='p-3 max-w-2xl mx-auto w-full post-content'
        dangerouslySetInnerHTML={{ __html: post && post.content }}
      ></div>
  <div className='max-4xl mx-auto w-full mt-4 mb-4'>
        <div className='flex items-center'>
          <button onClick={handleLike} className='flex items-center space-x-2'>
            <FaThumbsUp
              className={`${
                hasLiked ?  'text-gray-400': 'text-blue-500'
              } text-2xl cursor-pointer`}
            />
            <span>{numberOfLikes} {numberOfLikes === 1 ? 'Like' : 'Likes'}</span>
          </button>
        </div>
      </div>
      <div className='max-4xl mx-auto w-full'>
        <CallToAction />
      </div>

    

      <CommentSection postId={post._id} />
    </main>
  );
}
