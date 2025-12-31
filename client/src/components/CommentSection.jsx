import {  Alert, Button, Modal, Textarea } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link , Navigate, useNavigate} from 'react-router-dom'
import Comment from './Comment'
import { HiOutlineExclamationCircle } from 'react-icons/hi'



export default function CommentSection({postId}) {
  const {currentUser} = useSelector(state => state.user)
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete , setCommentToDelete] = useState(null);
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();
  console.log(comments);
   const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length > 200) {
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/comment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
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

  const handleLike = async (commentId) => {
    try {
      if(!currentUser) {
        Navigate('/sign-in')
        return;


      }
      const res= await fetch(`/api/comment/likeComment/${commentId}`,{
      method: 'PUT',
      });
      if (res.ok) {
      const data = await res.json();
      setComments(comments.map((comment) =>
      comment._id === commentId ? {
      ...comment,
      likes: data.likes,
      numberOfLikes: data.likes.length,
      } : comment
      ));
      }
    } catch (error) {
      console.log(error.message);
    }
  };

   const handleEdit = async(comment, editedContent) => {
   setComments(
   comments.map((c) => 
   c._id === comment._id ? {...c, content: editedContent } : c
   )
   );
   };

const handleDelete = async (commentId) => {
setShowModal(false);
   try {
      if(!currentUser) {
      navigate('/sign-in');
      return;
      }
      const res = await fetch(`/api/comment/deleteComment/${commentId}`,{
      method: 'DELETE',
      })
      if(res.ok) {
      const data = await res.json();
     
 
      setComments(
      comments.filter((comment) => comment._id !== commentId)
      );
      }

   } catch (error) {
    console.log(error.message);
   }
}
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
        comment={comment}  onLike={handleLike} onEdit={handleEdit}
         onDelete={(commentId) => {
        setShowModal(true)
        setCommentToDelete(commentId)
        }}/>
        ))
        }
        </>
        )}
         <Modal show={showModal} onClose={() => setShowModal(false)} popup size="md">
        <div className="dark:bg-gray-700">
          <Modal.Header className="p-4">
            {/* Header content will be added here */}
          </Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
              <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-900">
                Are you sure you want to delete your this comment?
              </h3>
              <div className="flex justify-center gap-8">
                <Button
                  className="mb-4 ml-8 bg-red-700 border border-red-900 text-white px-1 py-1 rounded relative mt-5"
                  onClick={() => handleDelete(commentToDelete)}
                >
                  Yes, I'm sure
                </Button>
                <Button
                  className="mb-4 ml-8 bg-white-900 border border-gray-200 text-black px-1 py-1 rounded relative mt-5"
                  onClick={() => setShowModal(false)}
                >
                  No, cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </div>
      </Modal>
 </div> 
  )

}
