import { BrowserRouter, Routes, Route } from "react-router-dom"
import Signin from "./pages/Signin"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import About from "./pages/About"
import Home from "./pages/Home"
import Projects from "./pages/Projects"
import Header from "./components/Header"
import FooterCon from "./components/Footer"
import PrivateRoute from "./components/PrivateRoute"
import CreatePost from "./pages/CreatePost"
import OnlyAdminPrivateRoute from "./components/OnlyAdminPrivateRoute"


export default function App() {
  return (
   <BrowserRouter>
   <Header/>
   <Routes>
    <Route path="/" element={<Home />}/>
    <Route path="/about" element={<About />}/>
    <Route path="/sign-in" element={<Signin />}/>
    <Route path="/sign-up" element={<SignUp />}/>
    <Route  element={<PrivateRoute/>}>

      <Route path="/dashboard" element={<Dashboard />}/>
    </Route>

       <Route  element={<OnlyAdminPrivateRoute/>}>

      <Route path="/create-post" element={<CreatePost />}/>
    </Route>
    
    <Route path="/projects" element={<Projects/>}/>


  
   
    </Routes>
    <FooterCon />
   </BrowserRouter>
  );
}
