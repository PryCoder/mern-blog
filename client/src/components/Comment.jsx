import { get } from "mongoose"
import moment from 'moment';
import { useEffect, useState } from "react"
import { Button, Textarea } from "flowbite-react";
import {FaThumbsUp} from 'react-icons/fa';
import { useSelector } from "react-redux";

export default function Comment({comment, onLike, onEdit ,onDelete}) {
    const [isEditing, setIsEditing] = useState(false);
    const [ editedContent, setEditedContent] = useState(comment.content);
    const [user, setUser]  = useState({});
    const {currentUser} = useSelector(state => state.user);

 useEffect(() =>{
    const getUser  = async() => {
        try {
            const res = await fetch(`/api/user/${comment.userId}`);
            const data = await res.json();
            if(res.ok) {
            setUser(data);
            }
        } catch (error) {
            console.log(error.message);
        }
    }
    getUser();
 },[comment])

 const handleEdit = () => {
   setIsEditing(true);
   setEditedContent(comment.content);

 };

 const handleSave = async () => {
   try {
    const res = await fetch(`/api/comment/editComment/${comment._id}`,{
    method: 'PUT',
    headers: {
    'Content-Type': 'application/json'
    },
    body:JSON.stringify({
        content: editedContent
    })
    });
    if(res.ok) {
        setIsEditing(false);
        onEdit(comment ,editedContent);

    }
   } catch (error) {
    console.log(error.message);
   }
 }
 
    return (
    <div className="flex p-4 border-b dark:border-gray-600 text-sm">
        <div className="flex-shrink-0 mr-3 ">
            <img  className='w-10 h-10 rounded-full bg-gray-200' src={user.profilePicture} alt={user.username}/>
        </div>
        <div className="">
            <div className="flex items-center mb-1">
                <span className="font-bold mr-1 text-xs truncate ">{user ? `@${user.username}` : "anonymous user"}</span>
               <span className="text-gray-500 text-xs ">{moment(comment.createdAt).fromNow() }</span> 
            </div>
    { isEditing? (
      <> <Textarea 
         className="mb-2"
         
         value={editedContent}
         onChange={(e) => setEditedContent(e.target.value)}
       />
<div className="flex justify-end gap-2 text-xs">
 <Button onClick={handleSave} type="button" size='sm' className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2">
            <span className=" h-6  items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-2 py-2 border border-transparent">
            Save</span>
            </Button>
    <Button onClick={() => setIsEditing(false)} outline type="button" size='sm' className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2">
            <span className=" h-6  items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-2 py-2 border border-transparent">
            Cancel</span>
            </Button>
</div>
</>
    ) : (

        <>
         <p className="text-gray-500 dark:text-gray-400 pb-2">{comment.content}</p>
        <div className="flex items-center pt-2 text-xs border-t dark:border-gray-700 max-w-fit gap-2">
            <Button type='button' onClick={() => onLike(comment._id)} className={`text-gray-400 hover:text-blue-500 ${currentUser && comment.likes.includes(currentUser._id) && '!text-blue-500'}`}>
            <FaThumbsUp className="text-sm"/>
            </Button>
<p className="text-gray-400 flex items-center">
    { 
    comment.numberOfLikes > 0 && comment.numberOfLikes + " " + (comment.numberOfLikes === 1 ? 'like' : 'likes')
    }
</p>

{
 currentUser && (currentUser._id === comment.userId || currentUser.isAdmin) && (
 <>
 <Button type='button' 
 onClick={handleEdit}
 className="text-gray-400 hover:text-blue-400">
 Edit
 </Button>
  <Button type='button' 
 onClick={() => onDelete(comment._id)}
 className="text-gray-400 hover:text-red-400">
 Delete
 </Button>
 </>
 )
}
        </div>
        </>
    )
       }    
        </div>
    </div>
  )
}
