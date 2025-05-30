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
import BoardDetailPage from './pages/boardDetail';
import Comunity from './pages/comunity';
import Store from './pages/store';
import StoreDetail from './pages/storeDetail';
import Skill from './pages/skill';
import SkillDetail from './pages/skillDetail';
import SkillWrite from './pages/skillWrite';
import News from './pages/news';
import NewsDetail from './pages/newsDetail';
import NewsWrite from './pages/newsWrite';
import Qna from './pages/qna';
import QnaDetail from './pages/qnaDetail';
import QnaWrite from './pages/qnaWrite';
import Sponsor from './pages/sponsor';
import SponsorDetail from './pages/sponsorDetail';  
import SponsorWrite from './pages/sponsorWrite';
import Join from './pages/join';
import Cart from './pages/cart';
import Order from './pages/order';
import StoreWritePage from './pages/storeWrite';
import AdminMain from "./pages/admin/AdminMain";
import MemberManagement from "./pages/admin/MemberManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import ProductCreate from "./pages/admin/ProductCreate";
import ProductEdit from "./pages/admin/ProductEdit";
import BranchManagement from "./pages/admin/BranchManagement";
import BranchCreate from "./pages/admin/BranchCreate";
import BranchEdit from "./pages/admin/BranchEdit";
import PostManagement from "./pages/admin/PostManagement";
import PostCreate from "./pages/admin/PostCreate";
import PostEdit from "./pages/admin/PostEdit";
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
          <Route path="/branches/:id/board/:id" element={<BoardDetailPage />} />
          <Route path="/branches/:id/notice/:id" element={<BoardDetailPage />} />
          <Route path="/comunity" element={<Comunity />} />
          <Route path="/store" element={<Store />} />
          <Route path="/storeWrite" element={<StoreWritePage />} />
          <Route path="/storeDetail/:itemId" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order/new" element={<Order />} />
          <Route path="/order/:id" element={<Order />} />
          <Route path="/skill" element={<Skill />} />
          <Route path="/skillDetail/:id" element={<SkillDetail />} />
          <Route path="/skillWrite" element={<SkillWrite />} />
          <Route path="/skillWrite/edit/:id" element={<SkillWrite />} />
          <Route path="/news" element={<News />} />
          <Route path="/newsDetail/:id" element={<NewsDetail />} /> 
          <Route path="/newsWrite" element={<NewsWrite />} />
          <Route path="/newsWrite/edit/:id" element={<NewsWrite />} />
          <Route path="/qna" element={<Qna />} />
          <Route path="/qnaDetail/:id" element={<QnaDetail />} />
          <Route path="/qnaWrite" element={<QnaWrite />} />
          <Route path="/qnaWrite/edit/:id" element={<QnaWrite />} />
          <Route path="/sponsor" element={<Sponsor />} />
          <Route path="/sponsorDetail/:id" element={<SponsorDetail />} />
          <Route path="/sponsorWrite" element={<SponsorWrite />} />
          <Route path="/sponsorWrite/edit/:id" element={<SponsorWrite />} />
          <Route path="/join" element={<Join />} />
          <Route path="/admin" element={<AdminMain />} />
          <Route path="/admin/members" element={<MemberManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/products/create" element={<ProductCreate />} />
          <Route path="/admin/products/edit/:itemId" element={<ProductEdit />} />
          <Route path="/admin/branches" element={<BranchManagement />} />
          <Route path="/admin/branches/create" element={<BranchCreate />} />
          <Route path="/admin/branches/edit/:branchId" element={<BranchEdit />} />
          <Route path="/admin/posts" element={<PostManagement />} />
          <Route path="/admin/posts/create" element={<PostCreate />} />
          <Route path="/admin/posts/edit/:category/:id" element={<PostEdit />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
