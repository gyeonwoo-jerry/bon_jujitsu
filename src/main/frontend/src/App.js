import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import Academy from './pages/academy';
import IntroGreeting from './pages/introGreeting';  
import IntroJiujitsu from './pages/introJiujitsu';
import IntroLevel from './pages/introLevel';
import Branches from './pages/branches';
import BranchesDetail from './pages/branchesDetail';
import Comunity from './pages/comunity';
import Store from './pages/store';
import StoreDetail from './pages/storeDetail';
import Skill from './pages/skill';
import News from './pages/news';
import NewsDetail from './pages/newsDetail';
import NewsWrite from './pages/newsWrite';
import Qna from './pages/qna';
import Sponsor from './pages/sponsor';
import Join from './pages/join';
import Cart from './pages/cart';
import Order from './pages/order';
import StoreWritePage from './pages/storeWrite';
import './styles/main.css';
import './styles/response.css';


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/introGreeting" element={<IntroGreeting />} />
          <Route path="/introJiujitsu" element={<IntroJiujitsu />} />
          <Route path="/introLevel" element={<IntroLevel />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/branches/:id" element={<BranchesDetail />} />
          <Route path="/comunity" element={<Comunity />} />
          <Route path="/store" element={<Store />} />
          <Route path="/storeWrite" element={<StoreWritePage />} />
          <Route path="/storeDetail/:itemId" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order/new" element={<Order />} />
          <Route path="/order/:id" element={<Order />} />
          <Route path="/skill" element={<Skill />} />
          <Route path="/news" element={<News />} />
          <Route path="/newsDetail/:id" element={<NewsDetail />} /> 
          <Route path="/newsWrite" element={<NewsWrite />} />
          <Route path="/qna" element={<Qna />} />
          <Route path="/sponsor" element={<Sponsor />} />
          <Route path="/join" element={<Join />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
