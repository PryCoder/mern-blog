import {  Alert, Button, Textarea } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Comment from './Comment'


export default function CommentSection({postId}) {
  const {currentUser} = useSelector(state => state.user)
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [comments, setComments] = useState([]);
  console.log(comments);
   const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length > 200) {
      return;
    }
    try {
      const res = await fetch('/api/comment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          postId,
          userId: currentUser._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComment('');
        setCommentError(null);
        setComments([data, ...comments]);
      }
    } catch (error) {
      setCommentError(error.message);
    }
  };

  useEffect(() => {
    const getComments = async () => {
      try {
        const res = await fetch(`/api/comment/getPostComments/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    getComments();
  }, [postId]);
  return (
    <div className='max-w-2xl mx-auto w-full p-3'>
        {currentUser ?
        (
            <div className='flex items-center gap-1 my-5 text-gray-500 text-sm'>
                <p>Signed in as:</p>
                <img className='h-5 w-5 object-cover rounded-full' src={currentUser.profilePicture} alt=''/>
                <Link to={'/dashboard?tab=profile'} className='text-xs text-cyan-600 hover:underline'>
                  @{currentUser.username}
                </Link>
                </div>
        ):
        (
            <div className='text-sm text-teal-500 my-5 flex gap-1 '>
            You must be signed in to comment.
            <Link className='text-blue-500 hover:underline'  to={'/sign-in'}>
            Sign In</Link></div>
        )}

        {currentUser && (
            <form  onSubmit={handleSubmit} className='border border-teal-500 rounded-md p-3'>
                <Textarea placeholder='Add a comment..' 
                rows='3'
                maxLength='200'
                onChange={(e) => setComment(e.target.value)}
                value={comment}/>
                <div className='flex justify-between items-center mt-5'>
                <p className='text-gray-500  text-xs'>{100-comment.length} charachters remaining</p>
                 <Button outline type="submit" className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2">
            <span className=" h-6  items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-2 py-2 border border-transparent">
            Submit</span>
          </Button></div>
          {commentError && <Alert color='failure'>
           {commentError} </Alert>
           }
           
            </form>
          
        )}
        {comments.length ===0 ? (
        <p className='text-sm my-5'>No Comments yet!</p>):(
        <>
        <div className='text-sm mt-4 mb-3 flex items-center gap-1'>
        <p>Comments</p>
        <div className='border border-gray-400 py-1 px-2 rounded-sm'>
        <p>{comments.length}</p>
        </div>
        </div>{
        comments.map(comment => (
        <Comment key={comment._id}
        comment={comment}/>
        ))
        }
        </>
        )}
 </div> 
  )

}
