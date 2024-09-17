import { Footer } from 'flowbite-react';
import { Link } from 'react-router-dom';
import {BsFacebook, BsInstagram, BsTwitterX, 
    BsGithub,  BsDribbble } from 'react-icons/bs';

export default function FooterCon() {

  
  return (
  <Footer container className='border border-t-8 border-teal-500 py-4 px-6'>
  <div className='w-full max-w-7xl mx-auto'>
    <div className='grid w-full justify-between sm:flex md:grid-cols-1'>
        <div className='mt-5'>
        <Link to="/" className="text-sm sm:text-xl font-semibold dark:text-white">
        <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">Epic</span>
        Shot
      </Link>
        </div>
        <div className='grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3
        sm:gap-6'>
<div>
       <Footer.Title title='ABOUT'/>
        <Footer.LinkGroup col>
        <Footer.Link
        href='https://www.100jsprojects.com'
        target='_blank'
        rel='noopener noreferrer'
        >
        100 JS Projects
        </Footer.Link>

         <Footer.Link
        href='/about'
        target='_blank'
        rel='noopener noreferrer'
        >
        Epic Shot
        </Footer.Link>
        </Footer.LinkGroup>

</div>
<div>
       <Footer.Title title='FOLLOW US'/>
        <Footer.LinkGroup col>
        <Footer.Link
        href='https://www.github.com/PryCoder'
        target='_blank'
        rel='noopener noreferrer'
        >
        Github
        </Footer.Link>

         <Footer.Link
        href='#'
       
        >
        Discord
        </Footer.Link>
        </Footer.LinkGroup>
</div>
<div>
       <Footer.Title title='LEGAL'/>
        <Footer.LinkGroup col>
        <Footer.Link
        href='#'
    
        >
        Privacy Policy
        </Footer.Link>

         <Footer.Link
        href='#'
       
        >
        Terms &amp; Conditions
        </Footer.Link>
        </Footer.LinkGroup>
</div>
       
        </div>
    </div>
    <Footer.Divider />
    <div className='w-full sm:flex
     sm:items-center sm:justify-between'>
  <Footer.Copyright 
  href='#'
  by={`${new Date().getFullYear()} Epic Shot `} // Concatenate a space with "Epic Shot" and the year
/>
 <div className='flex gap-6 sm:mt-0 mt-4 sm:justify-center'>
    
     <Footer.Icon href='https://www.instagram.com/Priyanshu05134/'  icon={BsInstagram}/>
      <Footer.Icon href='https://x.com/PriyanshuG34'  icon={BsTwitterX}/>
       <Footer.Icon href='https://github.com/PryCoder'  icon={BsGithub}/>
        <Footer.Icon href='https://dribbble.com/Priyanshu0707'  icon={BsDribbble}/>

 </div>
    </div>

   
    </div></Footer>   
  );
}
