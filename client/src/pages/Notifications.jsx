import { useEffect, useState } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'PUT',
      credentials: 'include',
    });
    if (res.ok) {
      await load();
    }
  };

  const openNotification = async (n) => {
    if (!n?.isRead) {
      await fetch(`/api/notifications/${n._id}/mark-read`, {
        method: 'PUT',
        credentials: 'include',
      });
    }

    if (n.type === 'follow' && n.actorId?._id) {
      navigate(`/profile/${n.actorId._id}`);
      return;
    }

    if (n.type === 'comment' && n.data?.postSlug) {
      navigate(`/post/${n.data.postSlug}`);
      return;
    }

    if (n.type === 'message' && n.data?.conversationId) {
      navigate(`/direct/t/${n.data.conversationId}`);
      return;
    }

    // fallback: just refresh list
    load();
  };

  return (
    <div className="min-h-screen mt-10 max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold dark:text-white">Notifications</h1>
        <Button color="gray" onClick={markAllRead} disabled={unreadCount === 0 || loading}>
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10">
          <Spinner size="xl" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="mt-8 text-gray-600 dark:text-gray-300">No notifications yet.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => openNotification(n)}
              className={`text-left rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${
                n.isRead ? 'bg-white dark:bg-gray-900' : 'bg-purple-50 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={n.actorId?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{n.title || 'Notification'}</p>
                  {n.body ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{n.body}</p>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead ? (
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">NEW</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
