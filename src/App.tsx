import { Route, Routes } from "react-router";

import LoginPage from "./auth/LoginPage";
import FeedPage from "./feed/FeedPage";
import FeedDetailPage from "./feed/FeedDetailPage";
import PersonaPage from "./persona/PersonaPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedPage />} />
      <Route path="/posts/:id" element={<FeedDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/persona" element={<PersonaPage />} />
    </Routes>
  );
};

export default App;
