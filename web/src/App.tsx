import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./auth";
import Article from "./pages/Article";
import Login from "./pages/Login";
import NewReview from "./pages/NewReview";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reviews/:id" element={<Article />} />
          <Route path="/login" element={<Login />} />
          <Route path="/new" element={<NewReview />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}