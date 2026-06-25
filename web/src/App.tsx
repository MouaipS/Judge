import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./auth";
import Article from "./pages/Article";
import Login from "./pages/Login";
import NewReview from "./pages/NewReview";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import FollowList from "./pages/FollowList";


// dans <Routes> :


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/u/:username" element={<Profile />} />
          <Route path="/u/:username/followers" element={<FollowList mode="followers" />} />
          <Route path="/u/:username/following" element={<FollowList mode="following" />} />
          <Route path="/settings" element={<EditProfile />} />
          
          <Route path="/reviews/:id" element={<Article />} />
          <Route path="/new" element={<NewReview />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}