import { Button, Label, TextInput } from 'flowbite-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function SignUp() {
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
        <form  className="flex flex-col gap-4">
          <div >
          <Label value="Your username" /> 
          <TextInput
          type="text"
          placeholder="Username"
          id='username'
          />
          </div>
           <div >
          <Label value="Your email" /> 
          <TextInput
          type="text"
          placeholder="Email"
          id='email'
          />
          </div> <div >
          <Label value="Your password" /> 
          <TextInput
          type="text"
          placeholder="Password"
          id='password'
          />
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-2 rounded-lg text-sm md:text-base hover:bg-gradient-to-r hover:from-purple-700 hover:to-pink-700">
  Sign Up
</Button>

        </form>
        <div className='flex gap-2 text-sm mt-5'>
        <span>Have an account?</span>
        <Link to='/sign-in' className='text-blue-500'>
        Sign In</Link>
        </div>
        </div>

        <div></div>
      </div>

    </div>
  );
}
