import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import CoursePlayer from './pages/CoursePlayer';
import InstructorPortal from './pages/InstructorPortal';
import CourseManager from './pages/CourseManager';
import Account from './pages/Account';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROUTES SANS NAVBAR (Hors du Layout) */}
        <Route path="/login" element={<Login />} />

        {/* ROUTES AVEC NAVBAR GLOBALE (Dans le Layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/account" element={<Account />} />
          <Route path="/courses/:courseId" element={<CoursePlayer />} />
          <Route path="/instructor" element={<InstructorPortal />} />
          <Route path="/instructor/courses/:courseId" element={<CourseManager />} />
        </Route>
      </Routes>
     
    </BrowserRouter>
  );
}

export default App;