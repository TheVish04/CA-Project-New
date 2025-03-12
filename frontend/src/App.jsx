import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Questions from './components/Questions';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './components/Register';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page as the root route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Panel Route with ErrorBoundary */}
        <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
        
        {/* Questions Route */}
        <Route path="/questions" element={<Questions />} />
        
        {/* Placeholder routes for About and Contact */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;