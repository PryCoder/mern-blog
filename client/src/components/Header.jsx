import { useState, useEffect } from 'react';
import { Avatar, Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineMenu, AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';

export default function Header() {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.user);
  const { theme } = useSelector(state => state.theme);

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);  // New state for mobile search

  useEffect(() => {
    // Optional: Add side effects here if needed
  }, [currentUser, theme]);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/user/signout', { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // Search users
  const searchUsers = async (query) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/user/getusers?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Sort results to show the matching query first
      const sortedResults = data.users.sort(user =>
        user.username.toLowerCase().startsWith(query.toLowerCase()) ? -1 : 1
      );
      
      setSearchResults(sortedResults || []);
    } catch (error) {
      console.log('Fetch error:', error.message);
    }
    setIsSearching(false);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  // Handle search result click
  const handleResultClick = (userId) => {
    console.log(`Navigating to profile for user ID: ${userId}`);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/profile/${userId}`);
  };

  // Handle search visibility toggle for mobile
  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchResults([]);  // Clear any previous search results
    setSearchQuery('');     // Clear the search query
  };

  return (
    <Navbar className="bg-white px-2 py-2.5 dark:border-gray-700 dark:bg-gray-800 sm:px-4 border-b-2 flex justify-between items-center">
      <Link to="/" className="text-sm sm:text-xl font-semibold dark:text-white">
        <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">Epic</span>
        Shot
      </Link>

      {/* Large Screen Search */}
      <div className="relative hidden lg:inline dark:border-gray-700">
        <form className="relative">
          <TextInput
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="pl-10"
          />
          <AiOutlineSearch className="absolute top-1/2 transform -translate-y-1/2 right-3" />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
              {searchResults.map(user => (
                <div
                  key={user._id}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleResultClick(user._id)}
                  aria-label={`View ${user.username}'s profile`}
                >
                  <div className="flex items-center">
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                    <span>{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Mobile Search Button */}
      <Button
        className="w-12 h-10 lg:hidden flex justify-center items-center rounded-xl shadow-sm-lg bg-gray-100 dark:bg-gray-700"
        onClick={handleSearchToggle}
      >
        <AiOutlineSearch className="text-xl dark:text-white text-black" />
      </Button>

      {/* Mobile Search Input */}
      {isSearchVisible && (
        <div className="absolute top-14 left-0 w-full px-4 bg-white dark:bg-gray-800 z-50 lg:hidden">
          <form className="relative">
            <TextInput
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="pl-10 w-full"
            />
            <AiOutlineSearch className="absolute top-1/2 transform -translate-y-1/2 right-3" />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleResultClick(user._id)}
                    aria-label={`View ${user.username}'s profile`}
                  >
                    <div className="flex items-center">
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                      <span>{user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="hidden lg:inline">
        <Link to="/" className="dark:text-white text-black mr-6">Home</Link>
        <Link to="/about" className="dark:text-white text-black mr-6">About</Link>
        <Link to="/projects" className="dark:text-white text-black">Projects</Link>
      </div>

      <Button
        className="w-12 h-10 hidden sm:inline dark:bg-gray-700 dark:border-gray-700 shadow-lg dark:shadow-lg"
        color="gray"
        onClick={() => dispatch(toggleTheme())}
        aria-label="Toggle theme"
      >
        <div className="flex justify-center items-center w-full h-full">
          {theme === 'light' ? <FaSun className="text-xl text-orange-500" /> : <FaMoon className="text-xl dark:text-white" />}
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
              className="rounded-full overflow-hidden w-10 h-10"
            />
          }
        >
          <Dropdown.Header>
            <span className="block text-sm">@{currentUser.username}</span>
            <span className="block text-sm font-medium truncate">{currentUser.email}</span>
          </Dropdown.Header>
          <Link to='/dashboard?tab=profile'>
            <Dropdown.Item>Profile</Dropdown.Item>
          </Link>
          <Dropdown.Divider />
          <Dropdown.Item onClick={handleSignout}>Sign out</Dropdown.Item>
        </Dropdown>
      ) : (
        <Link to='/sign-in'>
          <button
            type="button"
            className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2"
          >
            <span className="items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-4 py-2 border border-transparent">Sign in</span>
          </button>
        </Link>
      )}

      <div className="relative lg:hidden">
        <Button
          className="text-black dark:text-white bg-gray-100 shadow-lg dark:bg-gray-700"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Toggle mobile menu"
        >
          <AiOutlineMenu className="text-xl" />
        </Button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white dark:bg-gray-700">
            <Link to="/" className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-900">Home</Link>
            <Link to="/about" className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-900">About</Link>
            <Link to="/projects" className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-900">Projects</Link>
          </div>
        )}
      </div>
    </Navbar>
  );
}
