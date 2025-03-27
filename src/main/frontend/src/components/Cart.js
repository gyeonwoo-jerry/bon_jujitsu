import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 가격 포맷 함수 - undefined 처리 추가
  const formatPrice = (price) => {
    // price가 undefined, null이거나 숫자가 아닌 경우 처리
    if (price === undefined || price === null || isNaN(price)) {
      return '0원';
    }
    return price.toLocaleString('ko-KR') + '원';
  };

  // 장바구니 데이터 불러오기
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);
        // localStorage에서 장바구니 데이터 가져오기
        const storedCart = localStorage.getItem('cart');
        
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          
          // 장바구니에 있는 상품들의 최신 정보를 서버에서 가져오기
          if (parsedCart.length > 0) {
            const itemIds = parsedCart.map(item => item.id);
            const promises = itemIds.map(id => API.get(`/items/${id}`).catch(e => ({ status: 'error', error: e })));
            const responses = await Promise.all(promises);
            
            const updatedCart = parsedCart.map((cartItem, index) => {
              const response = responses[index];
              
              if (response && response.status === 200 && response.data) {
                const productData = response.data;
                return {
                  ...cartItem,
                  name: productData.name || cartItem.name,
                  price: (productData.sale > 0 ? productData.sale : productData.price) || cartItem.price,
                  originalPrice: productData.price || cartItem.originalPrice,
                  image: productData.images && productData.images.length > 0 ? productData.images[0] : null,
                  available: productData.amount > 0,
                  max: productData.amount
                };
              }
              
              return cartItem;
            });
            
            setCartItems(updatedCart);
            // 초기에 모든 아이템 선택 상태로 설정
            setSelectedItems(updatedCart.map(item => item.id));
          } else {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('장바구니 불러오기 실패:', error);
        setError('장바구니를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);

  // 총 가격 계산
  useEffect(() => {
    const calculateTotalPrice = () => {
      let total = 0;
      
      cartItems.forEach(item => {
        if (selectedItems.includes(item.id)) {
          // 가격이 없는 경우 0으로 처리
          const itemPrice = item.price || 0;
          const itemQuantity = item.quantity || 0;
          total += itemPrice * itemQuantity;
        }
      });
      
      setTotalPrice(total);
    };
    
    calculateTotalPrice();
  }, [cartItems, selectedItems]);

  // 전체 선택/해제 핸들러
  useEffect(() => {
    setIsAllSelected(selectedItems.length === cartItems.length && cartItems.length > 0);
  }, [selectedItems, cartItems]);

  // 수량 변경 핸들러
  const handleQuantityChange = (itemId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          // 최대 수량 제한
          const limitedQuantity = Math.min(Math.max(1, newQuantity), item.max || 100);
          return { ...item, quantity: limitedQuantity };
        }
        return item;
      });
      
      // localStorage 업데이트
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
  };

  // 아이템 제거 핸들러
  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== itemId);
      
      // localStorage 업데이트
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
    
    // 선택된 아이템 목록에서도 제거
    setSelectedItems(prevSelected => prevSelected.filter(id => id !== itemId));
  };

  // 장바구니 비우기
  const handleClearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      setCartItems([]);
      setSelectedItems([]);
      localStorage.removeItem('cart');
    }
  };

  // 개별 아이템 선택/해제
  const handleSelectItem = (itemId) => {
    setSelectedItems(prevSelected => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter(id => id !== itemId);
      } else {
        return [...prevSelected, itemId];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  // 쇼핑 계속하기
  const handleContinueShopping = () => {
    navigate('/store');
  };

  // 주문하기
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('선택된 상품이 없습니다.');
      return;
    }
    
    // 선택된 상품만 가져오기
    const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.id));
    
    // 최종 가격 계산
    const finalPrice = totalPrice > 50000 ? totalPrice : totalPrice + 3000;
    
    // localStorage에 임시 주문 정보 저장
    localStorage.setItem('tempOrderItems', JSON.stringify(itemsToCheckout));
    localStorage.setItem('tempOrderTotalPrice', finalPrice);
    
    // 주문 페이지로 이동
    navigate('/order/new');
  };

  const selectedCount = selectedItems.length;

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner"></div>
        <p>장바구니를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>장바구니</h2>
        {cartItems.length > 0 && (
          <button className="clear-cart-btn" onClick={handleClearCart}>
            장바구니 비우기
          </button>
        )}
      </div>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>장바구니가 비어있습니다.</p>
          <button className="continue-shopping-btn" onClick={handleContinueShopping}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <>
          <div className="cart-select-all">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
              전체 선택 ({selectedCount}/{cartItems.length})
            </label>
          </div>
          
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-select">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                </div>
                
                <div className="item-image">
                  <img 
                    src={item.image || '/images/blank_img.png'} 
                    alt={item.name}
                    onError={(e) => { e.target.src = '/images/blank_img.png' }}
                  />
                </div>
                
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  {!item.available && <div className="out-of-stock">품절</div>}
                  <div className="item-price">
                    <span className="current-price">{formatPrice(item.price)}</span>
                    {item.price < item.originalPrice && (
                      <span className="original-price">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                </div>
                
                <div className="item-quantity">
                  <button 
                    className="quantity-btn decrease" 
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.max || 100}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    readOnly
                  />
                  <button 
                    className="quantity-btn increase"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= (item.max || 100)}
                  >
                    +
                  </button>
                </div>
                
                <div className="item-subtotal">
                  {formatPrice(item.price * item.quantity)}
                </div>
                
                <button 
                  className="remove-item-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="summary-row">
              <span>상품금액</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>{totalPrice > 50000 ? '무료' : formatPrice(3000)}</span>
            </div>
            <div className="summary-row total">
              <span>결제예정금액</span>
              <span>{formatPrice(totalPrice > 50000 ? totalPrice : totalPrice + 3000)}</span>
            </div>
            <button 
              className="checkout-btn" 
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
            >
              {selectedCount > 0 ? `${selectedCount}개 상품 주문하기` : '상품을 선택하세요'}
            </button>
          </div>
          
          <div className="cart-notice">
            <p>· 50,000원 이상 구매 시 배송비 무료</p>
            <p>· 품절된 상품은 주문할 수 없습니다.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;



