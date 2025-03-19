import React from 'react';
import JoinForm from '../components/JoinForm';
import '../styles/JoinForm.css';

function Join() {
  return (
    <div className="join">
        
      <h1>환영합니다!</h1>
      <p>이것은 회원가입입니다.</p>
    
      <JoinForm />
    </div>
  );
}

export default Join;