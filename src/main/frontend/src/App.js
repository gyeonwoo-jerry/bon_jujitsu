import React, {useEffect} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

// 로딩 시스템 import
import {LoadingProvider, useLoading} from './utils/LoadingContext';
import {setLoadingManager} from './utils/api';
import LoadingIndicator from './utils/LoadingIndicator';

// 기존 컴포넌트들 import
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PostDetail from './pages/post/PostDetail';
import Academy from './pages/academy';
import IntroGreeting from './pages/introGreeting';
import IntroJiujitsu from './pages/introJiujitsu';
import IntroLevel from './pages/introLevel';
import Branches from './pages/branches';
import BranchesDetail from './pages/branchesDetail';
import Store from './pages/store';
import StoreDetail from './pages/storeDetail';
import Skill from './pages/post/skill';
import News from './pages/post/news';
import Qna from './pages/post/qna';
import Sponsor from './pages/post/sponsor';
import Join from './pages/join';
import Cart from './pages/cart';
import Order from './pages/order';
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
import AdminPostEdit from "./pages/admin/PostEdit";
import MyPageMain from "./pages/mypage/MyPageMain";
import ProfileEditPage from "./pages/mypage/ProfileEditPage";
import MyPageCart from "./pages/mypage/MyPageCart";
import MyPageOrders from "./pages/mypage/MyPageOrders";
import MyPageReview from "./pages/mypage/MyPageReview";

// 스타일 import
import './styles/main.css';
import './styles/response.css';
import ProtectedRoute from "./components/ProtectedRoute";
import useSessionCheck from "./hooks/useSessionCheck";
import useAuthGuard from "./hooks/useAuthGuard";
import PostWrite from "./pages/post/PostWrite";
import PostEdit from "./pages/post/PostEdit";

// 앱 내부 컴포넌트 (로딩 컨텍스트 사용)
function AppRoutes() {
  const loadingManager = useLoading();

  // API에 로딩 매니저 연결
  useEffect(() => {
    setLoadingManager(loadingManager);
  }, [loadingManager]);

  useSessionCheck();
  useAuthGuard();

  return (
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
          <Route path="/branches/:branchId/:postType/write" element={<PostWrite />}/>
          <Route path="/write/:postType" element={<PostWrite />} />
          <Route path="/branches/:branchId/:postType/:postId" element={<PostDetail />} />
          <Route path="/detail/:postType/:postId" element={<PostDetail />} />
          <Route path="/branches/:branchId/:postType/:postId/edit" element={<PostEdit />} />
          <Route path="/edit/:postType/:postId" element={<PostEdit />} />
          <Route path="/store" element={<Store />} />
          <Route path="/storeDetail/:itemId" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order/*" element={<Order />} />
          <Route path="/skill" element={<Skill />} />
          <Route path="/news" element={<News />} />
          <Route path="/qna" element={<Qna />} />
          <Route path="/sponsor" element={<Sponsor />} />
          <Route path="/join" element={<Join />} />

          {/* 관리자 페이지 라우트 - 모두 ProtectedRoute로 보호 */}
          <Route path="/admin" element={<ProtectedRoute><AdminMain /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute><MemberManagement /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
          <Route path="/admin/products/create" element={<ProtectedRoute><ProductCreate /></ProtectedRoute>} />
          <Route path="/admin/products/edit/:itemId" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute><BranchManagement /></ProtectedRoute>} />
          <Route path="/admin/branches/create" element={<ProtectedRoute><BranchCreate /></ProtectedRoute>} />
          <Route path="/admin/branches/edit/:branchId" element={<ProtectedRoute><BranchEdit /></ProtectedRoute>} />
          <Route path="/admin/posts" element={<ProtectedRoute><PostManagement /></ProtectedRoute>} />
          <Route path="/admin/posts/create" element={<ProtectedRoute><PostCreate /></ProtectedRoute>} />
          <Route path="/admin/posts/edit/:category/:id" element={<ProtectedRoute><AdminPostEdit /></ProtectedRoute>} />

          {/* 마이페이지 라우트 - 모두 ProtectedRoute로 보호 */}
          <Route path="/mypage" element={<ProtectedRoute><MyPageMain /></ProtectedRoute>} />
          <Route path="/mypage/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
          <Route path="/mypage/cart" element={<ProtectedRoute><MyPageCart /></ProtectedRoute>} />
          <Route path="/mypage/orders" element={<ProtectedRoute><MyPageOrders /></ProtectedRoute>} />
          <Route path="/mypage/reviews" element={<ProtectedRoute><MyPageReview /></ProtectedRoute>} />
        </Routes>
        <Footer />

        {/* 로딩 인디케이터 - 앱 최상단에 배치 */}
        <LoadingIndicator />
      </div>
  );
}

// 앱 내부 컴포넌트 (로딩 컨텍스트 사용)
function AppContent() {
  return (
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
  );
}

// 메인 App 컴포넌트
function App() {
  return (
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
  );
}

export default App;