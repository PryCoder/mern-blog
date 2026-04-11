import { Modal, Table, Button } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaCheck, FaTimes } from 'react-icons/fa';

export default function DashUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState('');
  const [userToToggle, setUserToToggle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/user/getusers`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setUsers(data.users || []);
        if (data.users.length < 9) {
          setShowMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to fetch users. Please try again later.');
      }
    };
    if (currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [currentUser?.isAdmin]);

  const handleShowMore = async () => {
    const startIndex = users.length;
    try {
      const res = await fetch(`/api/user/getusers?startIndex=${startIndex}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setUsers((prev) => [...prev, ...(data.users || [])]);
      if (data.users.length < 9) {
        setShowMore(false);
      }
    } catch (error) {
      console.error('Failed to load more users:', error);
      setError('Failed to load more users. Please try again later.');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/user/delete/${userIdToDelete}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((user) => user._id !== userIdToDelete));
        setShowDeleteModal(false);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

 // In DashUsers.jsx, update the handleToggleAdmin function:

const handleToggleAdmin = async () => {
  if (!userToToggle) return;
  
  try {
    setError(null); // Clear any previous errors
    const res = await fetch(`/api/user/toggle-admin/${userToToggle._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isAdmin: !userToToggle.isAdmin
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userToToggle._id
            ? { ...user, isAdmin: !user.isAdmin }
            : user
        )
      );
      setShowAdminModal(false);
      setUserToToggle(null);
    } else {
      console.log('Error response:', data);
      setError(data.message || 'Failed to update admin status');
    }
  } catch (error) {
    console.log('Network error:', error);
    setError('Failed to update admin status. Please check your connection.');
  }
};

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3'>
      {error && <p className='text-red-500'>{error}</p>}
      {currentUser?.isAdmin && users.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date created</Table.HeadCell>
              <Table.HeadCell>User image</Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Admin</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            <Table.Body className='divide-y'>
              {users.map((user) => (
                <Table.Row 
                  key={user._id} 
                  className='bg-white dark:border-gray-700 dark:bg-gray-800'
                >
                  <Table.Cell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className='w-10 h-10 object-cover bg-gray-500 rounded-full'
                    />
                  </Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        // Prevent toggling your own admin status
                        if (user._id === currentUser._id) {
                          setError("You cannot change your own admin status");
                          return;
                        }
                        setUserToToggle(user);
                        setShowAdminModal(true);
                      }}
                      className={`font-medium cursor-pointer flex items-center justify-center ${
                        user._id === currentUser._id 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'hover:underline'
                      }`}
                    >
                      {user.isAdmin ? (
                        <FaCheck className='text-green-500' />
                      ) : (
                        <FaTimes className='text-red-500' />
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        // Prevent deleting yourself
                        if (user._id === currentUser._id) {
                          setError("You cannot delete your own account");
                          return;
                        }
                        setShowDeleteModal(true);
                        setUserIdToDelete(user._id);
                      }}
                      className={`font-medium text-red-500 ${
                        user._id === currentUser._id
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:underline cursor-pointer'
                      }`}
                    >
                      Delete
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {showMore && (
            <button
              onClick={handleShowMore}
              className='w-full text-teal-500 self-center text-sm py-7'
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <p>You have no users yet!</p>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        popup
        size='md'
      >
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this user?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={handleDeleteUser}>
                Yes, I'm sure
              </Button>
              <Button color='gray' onClick={() => setShowDeleteModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Admin Toggle Confirmation Modal */}
      <Modal
        show={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setUserToToggle(null);
        }}
        popup
        size='md'
      >
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to {userToToggle?.isAdmin ? 'remove' : 'grant'} admin privileges for {userToToggle?.username}?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button className='bg-red-500'
                color={userToToggle?.isAdmin ? 'failure' : 'success'}
                onClick={handleToggleAdmin}
              >
                Yes, {userToToggle?.isAdmin ? 'remove' : 'grant'} admin
              </Button>
              <Button 
                color='gray' 
                onClick={() => {
                  setShowAdminModal(false);
                  setUserToToggle(null);
                }}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}