import { Route, Routes } from "react-router";

import LoginPage from "./auth/LoginPage";
import FeedPage from "./feed/FeedPage";
import FeedDetailPage from "./feed/FeedDetailPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedPage />} />
      <Route path="/posts/:id" element={<FeedDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
