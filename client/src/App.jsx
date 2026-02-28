import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfileSelect from './pages/ProfileSelect';
import Home from './pages/Home';
import Chapter from './pages/Chapter';
import TestMenu from './pages/TestMenu';
import { getActiveProfileId } from './store/progress';

function RequireProfile({ children }) {
  const profileId = getActiveProfileId();
  if (!profileId) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfileSelect />} />
        <Route path="/home" element={<RequireProfile><Home /></RequireProfile>} />
        <Route path="/chapter/:id" element={<RequireProfile><Chapter /></RequireProfile>} />
        <Route path="/test" element={<RequireProfile><TestMenu /></RequireProfile>} />
      </Routes>
    </BrowserRouter>
  );
}
