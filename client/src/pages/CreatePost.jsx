import { Button, FileInput, Select, TextInput } from 'flowbite-react'
import React from 'react'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function CreatePost() {
  return <div className='p-3 max-w-3xl mx-auto min-h-screen'>
 <h1 className='text-center text-3xl my-7 font-semibold'>
    Create a post
 </h1>
 <form className='flex flex-col gap-4'>
    <div className=' flex flex-col gap-4 sm:flex-row justify-between'>
        <TextInput type='text' placeholder='Title' required id='title'
        className='flex-1' />
        <Select>
        <option value="uncategorized">Select a category</option>
        <option value="javascript">Javascript</option>
        <option value="reactjs">React.js</option>
        <option value="nextjs">Next.js</option>
        </Select>
    </div>
    <div className='flex gap-4 items-center justify-center border-4 border-teal-500 border-dotted p-3'>
        <FileInput type='file' accept='image/*'/>
        <button type="button" class="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2"><span class="items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-4 py-2 border border-transparent"
        >Upload image</span></button>
    </div>
    <ReactQuill theme='snow' placeholder='Write Something..' className='h-72 mb-12 dark:placeholder:text-white' required/>
    <Button 
   type="submit"
  
   className="w-full   bg-gradient-to-r from-purple-600 to-pink-600
           text-white py-1 px-2 rounded-lg text-sm md:text-base hover:bg-gradient-to-r hover:from-purple-700
           hover:to-pink-700"
   >
   Publish</Button>

 </form>
 </div>

}
