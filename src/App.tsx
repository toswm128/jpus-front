import { Route, Routes } from "react-router";

import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import FeedPage from "./feed/FeedPage";
import FeedDetailPage from "./feed/FeedDetailPage";
import PersonaPage from "./persona/PersonaPage";
import PersonaCreatePage from "./persona/PersonaCreatePage";
import FeedPostPage from "./feed/FeedPostPage";
import RequireAuth from "./auth/RequireAuth";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<FeedPage />} />

        <Route path="/posts" element={<FeedPostPage />} />
        <Route path="/posts/:id" element={<FeedDetailPage />} />

        <Route path="/persona" element={<PersonaPage />} />
        <Route path="/persona/create" element={<PersonaCreatePage />} />
      </Route>
    </Routes>
  );
};

export default App;
