import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Questions from './components/Questions';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
      </Routes>
        
    </Router>
  );
}

export default App;