import { useState } from 'react'; // Import useState hook
import { Button, Navbar, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon } from 'react-icons/fa';

export default function Header() {
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
            inputClassName="pl-10" // Adjust input padding to accommodate the icon
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

      <Button className="w-12 h-10 hidden sm:inline" color="gray" onClick={() => setShowDropdown(!showDropdown)}>
        <div className="flex justify-center items-center w-full h-full">
          <FaMoon className="text-xl text-black" /> {/* Increase the size of the icon */}
        </div>
      </Button>

      {/* Sign In button */}
      <Link to='/sign-in'>
       <Button className="w-20 h-10 px-4 py-2 border-2 border-purple-600 rounded-lg text-black font-semibold flex justify-center items-center whitespace-nowrap ml-2 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white">
          Sign In
        </Button>
      </Link>

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
