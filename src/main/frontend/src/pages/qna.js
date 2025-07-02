import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import PostList from '../components/PostList';
import '../styles/qna.css'; // 스타일 파일이 없다면 생성해야 합니다

function Qna() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const title = 'QnA';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수에 대한 궁금한 점을 질문해보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
  }, []);

  const handleWriteClick = () => {
    navigate('/write/qna')
  };

  return (
      <div className="qna">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="qna-container">
          <div className="inner">
            <div className="section_title">본주짓수 <font className='thin small'>Q&A</font></div>
            <PostList
                apiEndpoint="/qna"
                title=""
                searchPlaceholder="Q&A 검색..."
                pageSize={12}
                postType="qna"
            />
            {/* QnA는 로그인 여부와 상관없이 누구나 질문할 수 있으므로 항상 버튼 표시 */}
            <button
                className="write-button"
                onClick={handleWriteClick}
            >
              질문하기
            </button>
          </div>
        </div>
      </div>
  );
}

export default Qna;