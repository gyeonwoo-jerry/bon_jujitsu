import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import Cart from '../components/Cart';

function CartPage() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const { itemId } = useParams();

  useEffect(() => {
    const title = '장바구니'; 
    setPageName(title);
    document.title = title;
    const descName = 'BON JIU JITSU STORE';
    setDescName(descName);
    const backgroundImage = '/images/store_back.png';
    setBackgroundImage(backgroundImage);
  }, []);

  return (
    <div className="cart">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className='cart_container'>
        <div className="inner">
          <div className="section_title">장바구니</div>
          <Cart />
        </div>
      </div>
    </div>
  );
}

export default CartPage; 