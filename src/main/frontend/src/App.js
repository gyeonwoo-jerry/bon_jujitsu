import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar'; 
import Academy from './pages/academy';
import Brunches from './pages/brunches';
import Comunity from './pages/comunity';
import Store from './pages/store';
import Skill from './pages/skill';
import News from './pages/news';
import Qna from './pages/qna';
import Sponsor from './pages/sponsor';
import Join from './pages/join';
import './styles/main.css';   

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/brunches" element={<Brunches />} />
          <Route path="/comunity" element={<Comunity />} />
          <Route path="/store" element={<Store />} />
          <Route path="/skill" element={<Skill />} />
          <Route path="/news" element={<News />} />
          <Route path="/qna" element={<Qna />} />
          <Route path="/sponsor" element={<Sponsor />} />
          <Route path="/join" element={<Join />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
