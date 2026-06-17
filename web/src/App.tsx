import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./auth";
import Article from "./pages/Article";
import Login from "./pages/Login";
import NewReview from "./pages/NewReview";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FilmPage from "./pages/FilmPage";



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

          <Route path="/reviews/:id" element={<Article />} />
          <Route path="/new" element={<NewReview />} />
          <Route path="/film/:tmdbId" element={<FilmPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}