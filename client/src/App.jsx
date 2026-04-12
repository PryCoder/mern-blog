import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signin from './pages/Signin';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Header from './components/Header';
import FooterCon from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import CreatePost from './pages/CreatePost';
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute';
import UpdatePost from './pages/UpdatePost';
import PostPage from './pages/PostPage';
import ScrollToTop from './components/ScrollToTop';
import UserProfile from './components/UserProfile';
import CreateStoryPage from './components/CreateStories';
import StoriesFeedPage from './components/StoriesFeed';
import StoryManagementPage from './components/StoryManagement';
import HighlightsPage from './components/HighlightPage';
import MessagingPage from './components/MessagingPage';
import DashReportedComments from './components/DashReportedComments';
import FollowingFeed from './pages/FollowingFeed';
import Notifications from './pages/Notifications';
import PublicRoute from './components/PublicRoute';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop/>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        {/* Public-only routes: redirect to '/' if already authenticated */}
        <Route element={<PublicRoute />}>
          <Route path="/sign-in" element={<Signin />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Route>
        <Route path="/projects" element={<Projects />} />
        <Route path="/post/:postSlug" element={<PostPage/>} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/stories" element={<StoriesFeedPage />} />
                <Route path="/stories/create" element={<CreateStoryPage />} />
                <Route path="/stories/:storyId" element={<StoriesFeedPage />} />
                <Route path="/highlights" element={<HighlightsPage />} />
                <Route path="/highlights/:userId" element={<HighlightsPage />} />
                <Route path="/manage-stories" element={<StoryManagementPage />} />
                <Route path="/direct/inbox" element={<MessagingPage />} />
                <Route path="/direct/t/:conversationId" element={<MessagingPage />} />
  


        {/* Private routes accessible only when authenticated */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/following-feed" element={<FollowingFeed />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>


<Route path="/create-post" element={<CreatePost />} />
        {/* Admin-only routes */}
        <Route element={<OnlyAdminPrivateRoute />}>
          
          <Route path="/update-post/:postId" element={<UpdatePost />} />
          <Route path="/reported-comments" element={<DashReportedComments />} />
        </Route>

        {/* Default route or 404 page */}
        <Route path="*" element={<Home />} />
      </Routes>
      <FooterCon />
    </BrowserRouter>
  );
}
