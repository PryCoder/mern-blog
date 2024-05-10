import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';

export default function SignUp() {

const [formData, setFormData] = useState({});
const [errorMessage, setErrorMessage] = useState(null);
const [loading, setLoading] = useState(false);
const navigate = useNavigate();


const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });

};

const handleSubmit = async (e) => {
  e.preventDefault();
  if(!formData.username || !formData.email || !formData.password){
  return setErrorMessage('Please fill out all fields.');
  } 
  try {

    setLoading(true);
    setErrorMessage(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

   

    const data = await res.json();
    if(data.success === false) {
    return setErrorMessage(data.message);
    }
    setLoading(false);
    if(res.ok) {
      navigate('/sign-in');
    }// Handle successful signup, e.g., redirect to a different page
  } catch (error) {
    setErrorMessage(error.message);
    setLoading(false);
    // Display an error message to the user
  }
};

  return (
    <div className='min-h-screen mt-20'>

      <div className="flex p-3 max-w-3xl mx-auto flex-col 
      md:flex-row md:items-center ">
        {/* Left */}
        <div></div>
        <div className="flex-1 flex-col justify-center gap-5">
          <Link to="/" className="font-bold dark:text-white text-4xl flex items-center">
            <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">Epic</span>
            <span className="ml-2">Shot</span>
          </Link>
          <p className='text-sm mt-5'>
            This is a Social media app but its more than our user can share their 
            knowledge and advices. You can sign up with your email and password or with Google.
          </p>
        </div>

        {/* Right */}
        <div className='flex-1'>
        <form  className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div >
          <Label value="Your username" /> 
          <TextInput
          type="text"
          placeholder="Username"
          id='username' onChange={handleChange}
          />
          </div>
           <div >
          <Label value="Your email" /> 
          <TextInput
          type="email"
          placeholder="name@company.com"
          id='email' onChange={handleChange}
          />
          </div> <div >
          <Label value="Your password" /> 
          <TextInput
          type="password"
          placeholder="Password"
          id='password' onChange={handleChange}
          />
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-2 rounded-lg text-sm md:text-base hover:bg-gradient-to-r hover:from-purple-700
           hover:to-pink-700" type="Submit" disabled={loading}>
            {
            loading ? (
            <>
            <Spinner  size="sm"/>
              <span className="pl-3">Loading </span>
            </>
             
            ) : ("Sign Up")
            }
  
</Button>
<OAuth />
        </form>
        <div className='flex gap-2 text-sm mt-5'>
        <span>Have an account?</span>
        <Link to='/sign-in' className='text-blue-500'>
        Sign In</Link>
        </div>
        {
          errorMessage && (
            <Alert className="mt-5 bg-red-100
             border border-red-400 text-red-700 px-4 py-3 rounded">
            {errorMessage}
            </Alert>
          )
        }
        </div>

        <div></div>
      </div>

    </div>
  );
}
