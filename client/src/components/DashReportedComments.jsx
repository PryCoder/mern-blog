import { Modal, Table, Button } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaTrash } from 'react-icons/fa';

export default function DashReportedComments() {
  const { currentUser } = useSelector((state) => state.user);
  const token = localStorage.getItem('token');
  const [reportedComments, setReportedComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchReportedComments = async () => {
      try {
        const res = await fetch('/api/comment/getReportedComments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setReportedComments(data);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    if (currentUser?.isAdmin && token) {
      fetchReportedComments();
    }
  }, [currentUser?._id, currentUser?.isAdmin, token]);

  const handleDeleteComment = async () => {
    setShowModal(false);
    try {
      const res = await fetch(`/api/comment/deleteComment/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setReportedComments((prev) => prev.filter((c) => c._id !== commentToDelete));
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/user/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
         setReportedComments((prev) => prev.filter((c) => c.userId !== userId));
         alert("User deleted successfully.");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500 w-full'>
      {currentUser?.isAdmin && reportedComments.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date Updated</Table.HeadCell>
              <Table.HeadCell>Comment Content</Table.HeadCell>
              <Table.HeadCell>No. Reports</Table.HeadCell>
              <Table.HeadCell>Reasons</Table.HeadCell>
              <Table.HeadCell>Post ID</Table.HeadCell>
              <Table.HeadCell>User ID</Table.HeadCell>
              <Table.HeadCell>Action</Table.HeadCell>
            </Table.Head>
            <Table.Body className='divide-y'>
              {reportedComments.map((comment) => (
                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800' key={comment._id}>
                  <Table.Cell>{new Date(comment.updatedAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>{comment.content}</Table.Cell>
                  <Table.Cell className="text-red-500 font-bold">{comment.numberOfReports}</Table.Cell>
                  <Table.Cell className="text-orange-500 text-sm">
                    {Array.from(new Set(comment.reportDetails?.map(r => r.reason))).join(', ') || 'No specific reason'}
                  </Table.Cell>
                  <Table.Cell>{comment.postId}</Table.Cell>
                  <Table.Cell>{comment.userId}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                        <span
                          onClick={() => {
                            setShowModal(true);
                            setCommentToDelete(comment._id);
                          }}
                          className='font-medium text-red-500 hover:underline cursor-pointer'
                        >
                          Delete Comment
                        </span>
                        <span className="text-gray-400">|</span>
                        <span
                          onClick={() => {
                            if(window.confirm("Are you sure you want to delete this user completely?")) {
                                handleDeleteUser(comment.userId);
                            }
                          }}
                          className='font-medium text-red-700 hover:underline cursor-pointer'
                        >
                          Delete User
                        </span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      ) : (
        <p>No reported comments found!</p>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this comment?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={handleDeleteComment}>Yes, I'm sure</Button>
              <Button color='gray' onClick={() => setShowModal(false)}>No, cancel</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}