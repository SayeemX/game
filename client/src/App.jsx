import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { fetchUserProfile } from './redux/slices/userSlice';

// Layout & Components
import Navbar from './components/layout/Navbar';
import AuthForm from './components/AuthForm'; // Will check/update this next

// Pages
import Home from './pages/Home';
import SpinWheel from './components/games/SpinWheel';
import BirdShooting from './components/games/BirdShooting';

const AppContent = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500 selection:text-black">
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/spin" element={<SpinWheel />} />
            <Route path="/bird-shooting" element={<BirdShooting />} />
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            
            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        
        {/* Footer simple */}
        <footer className="py-12 border-t border-gray-900 bg-black text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 KHELAZONE ELITE GAMING ARENA • ALL RIGHTS RESERVED
        </footer>
      </Router>
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;
