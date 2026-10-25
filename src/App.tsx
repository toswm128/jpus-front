import { Route, Routes } from "react-router";

import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import FeedPage from "./feed/FeedPage";
import FeedDetailPage from "./feed/FeedDetailPage";
import PersonaPage from "./persona/PersonaPage";
import FeedPostPage from "./feed/FeedPostPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedPage />} />
      <Route path="/posts/:id" element={<FeedDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/persona" element={<PersonaPage />} />
      <Route path="/posts" element={<FeedPostPage />} />
    </Routes>
  );
};

export default App;
