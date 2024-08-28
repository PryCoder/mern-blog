import { Button } from 'flowbite-react'
import React from 'react'

export default function CallToAction() {
  return (
    <>
    <div className='flex flex-col sm:flex-row p-3 border border-teal-500 justify-center
      items-center rounded-tl-3xl rounded-br-3xl text-center'>
      <div className='flex-1 justify-center flex flex-col' >
        <h2 className='text-2xl'>
          Want to learn more about JavaScript?
        </h2>
        <p className='text-gray-500 my-2'>
          Check out these resources with 100 JavaScript Projects
        </p>
        <Button className='italic bg-gradient-to-r from-purple-600 to-pink-600
           text-white py-2 px-2 rounded-lg text-sm md:text-base hover:bg-gradient-to-r hover:from-purple-700
           hover:to-pink-700'> 
           <a href='
          https://github.com/PryCoder' target='_blank' rel='noopener noreferrer'>Learn more</a></Button>
      </div>
      <div className='p-7'>
        <img src='https://bairesdev.mo.cloudinary.net/blog/2023/08/What-Is-JavaScript-Used-For.jpg?tx=w_1920,q_auto' alt='JavaScript'/>
      </div>
      </div>
    </>
  )
}
