import {Button} from 'flowbite-react';
import { AiFillGoogleCircle } from 'react-icons/ai';
import {GoogleAuthProvider, signInWithPopup, getAuth} from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess} from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';



export default function OAuth() {
    const auth = getAuth(app)
    const dispatch = useDispatch()
    const navigate = useNavigate()
   const handleGoogleClick = async() => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({prompt:'select_account'})
    try{
        const resultsFromGoogle = await signInWithPopup(auth, provider)
    const res = await fetch('/api/auth/google',{
        method: "POST",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
        name: resultsFromGoogle.user.displayName,
        email: resultsFromGoogle.user.email,
        googlePhotoUrl: resultsFromGoogle.user.photoURL,
    }),
    })
    const data = await res.json()
  if(res.ok) {
     dispatch(signInSuccess(data))
     navigate('/')
  }
}
    catch(error){
    console.log(error);

   }
   }

  return (
    <Button className="w-100 h-10 px-4 py-2 border-2 border-pink-600 rounded-lg text-black font-semibold flex justify-center items-center whitespace-nowrap ml-2 hover:bg-gradient-to-r hover:from-pink-600 hover:to-orange-500 hover:text-white" type='button' 
    onClick={handleGoogleClick}>
    <AiFillGoogleCircle className='w-6 h-6 mr-2'/>
       Continue with Google </Button>
  )
}
