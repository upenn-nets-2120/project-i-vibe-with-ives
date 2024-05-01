import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/chats' element={<Chats />} />
        <Route path='/:username/notifications' element={<Notifications />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path='/:username/profile' element={<Profile />} />
        <Route path='/:username/settings' element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
