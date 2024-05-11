import { useState } from 'react'; // Import useState hook
import { Avatar, Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import {useSelector, useDispatch} from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';

export default function Header() {
 const dispatch = useDispatch();
  const {currentUser} = useSelector(state => state.user)
  const {theme} = useSelector(state => state.theme)
  // State to manage the visibility of dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <Navbar className="border-b-2 flex justify-between items-center py-3">
      <Link to="/" className="text-sm sm:text-xl font-semibold dark:text-white">
        <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">Epic</span>
        Shot
      </Link>
      <div className="hidden lg:inline">
        <form className="relative">
          <TextInput
            type="text"
            placeholder="Search..."
            inputclassName="pl-10" // Adjust input padding to accommodate the icon
          />
          <AiOutlineSearch className="absolute top-1/2 transform -translate-y-1/2 right-3" />
        </form>
      </div>
      <Button className="w-12 h-10 lg:hidden flex justify-center items-center rounded-xl" color="green">
        <AiOutlineSearch className="text-xl text-black" /> {/* Increase the size of the icon */}
      </Button>

      <div className="hidden lg:inline">
        <Link to="/" className="text-black mr-6">Home</Link>
        <Link to="/about" className="text-black mr-6">About</Link>
        <Link to="/projects" className="text-black">Projects</Link>
      </div>
 
      <Button className="w-12 h-10 hidden sm:inline" color="gray"  onClick={() => dispatch(toggleTheme())} >
       <div className="flex justify-center items-center w-full h-full" >
       {theme === 'light' ? <FaSun className="text-xl " /> : <FaMoon className="text-xl" />}
         {/* Increase the size of the icon */}
        </div>
      </Button>
   {currentUser ? (

 <Dropdown
   arrowIcon={false}
   inline
   label={
   <Avatar
       alt='user'
       img={currentUser.profilePicture}
       className="rounded-full overflow-hidden"
   />
   }
   >
<Dropdown.Header>
<span className="block text-sm">@{currentUser.username}</span>
<span className="block text-sm font-medium truncate">{currentUser.email}</span>



</Dropdown.Header>
<Link to={'/dashboard?tab=profile'}>
<Dropdown.Item>Profile</Dropdown.Item>
</Link>

<Dropdown.Divider/>
<Dropdown.Item>Sign out</Dropdown.Item>

 </Dropdown>

   ) :
  (
    <Link to='/sign-in'>
    <Button className="w-20 h-10 px-4 py-2 border-2 border-purple-600 rounded-lg text-black font-semibold flex justify-center items-center whitespace-nowrap ml-2 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white">
       Sign In
     </Button>
   </Link>
  )
  
  }
      {/* Sign In button */}
      

      {/* Dropdown toggle button */}
      <div className="relative lg:hidden">
        <Button className="text-black" onClick={() => setShowDropdown(!showDropdown)}>Menu</Button>
        
        {/* Dropdown content */}
        {showDropdown && (
          <div className="absolute bg-white top-full left-0 mt-1 w-40 py-2 rounded-lg shadow-lg">
            <Link to="/" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">Home</Link>
            <Link to="/about" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">About</Link>
            <Link to="/projects" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">Projects</Link>
          </div>
        )}
      </div>

      {/* Responsive Dropdown content */}
    
    </Navbar>
  );
}
