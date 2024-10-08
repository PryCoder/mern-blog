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





export default function App() {
  return (
    <BrowserRouter>
    <ScrollToTop/>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/post/:postSlug" element={<PostPage/>} />
        <Route path="/profile/:userId" element={<UserProfile />} />


        {/* Private routes accessible only when authenticated */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
      
        </Route>


<Route path="/create-post" element={<CreatePost />} />
        {/* Admin-only routes */}
        <Route element={<OnlyAdminPrivateRoute />}>
          
          <Route path="/update-post/:postId" element={<UpdatePost />} />
        </Route>

        {/* Default route or 404 page */}
        <Route path="*" element={<Home />} />
      </Routes>
      <FooterCon />
    </BrowserRouter>
  );
}
