import { Route, Routes } from "react-router";

import LoginPage from "./auth/LoginPage";
import FeedPage from "./feed/FeedPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
