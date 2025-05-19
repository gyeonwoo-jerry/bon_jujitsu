// BranchEdit.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import AddressSearch from '../../components/admin/AddressSearch';
import '../../styles/admin/branchForm.css';

const BranchEdit = () => {
  const { branchId } = useParams(); // URL에서 branchId 파라미터 가져오기
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // 지부 정보 상태
  const [branchData, setBranchData] = useState({
    region: '', // 지부명
    address: '', // 기본 주소
    addressDetail: '', // 상세 주소 (백엔드로 전송시 주소와 결합됨)
    area: '', // 지역(시/도)
    content: '', // 지부 설명
    images: [] // 새로 추가할 이미지 파일 객체들이 저장됩니다
  });

  // 기존 이미지 URL 배열
  const [existingImages, setExistingImages] = useState([]);

  // 유지할 이미지 URL 배열
  const [keepImageUrls, setKeepImageUrls] = useState([]);

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  // 지부 정보 불러오기
  useEffect(() => {
    const fetchBranchData = async () => {
      // 토큰 확인
      if (!checkToken()) {
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setError(null);

      try {
        const res = await API.get(`/branch/${branchId}`);

        if (res.data?.success) {
          const branchInfo = res.data.content;
          console.log('지부 정보:', branchInfo);

          // 주소 분리 (상세 주소가 있는 경우)
          let mainAddress = branchInfo.address || '';
          let detailAddress = '';

          // 지부 데이터 설정
          setBranchData({
            region: branchInfo.region || '',
            address: mainAddress,
            addressDetail: detailAddress,
            area: branchInfo.area || '',
            content: branchInfo.content || '',
            images: [] // 새로 추가할 이미지 배열 초기화
          });

          // 기존 이미지 설정
          if (branchInfo.images && branchInfo.images.length > 0) {
            console.log('서버에서 받은 이미지 데이터:', branchInfo.images);

            // 이미지가 URL 문자열 배열인 경우
            if (typeof branchInfo.images[0] === 'string') {
              setExistingImages(branchInfo.images);
              setKeepImageUrls(branchInfo.images); // 모든 이미지 URL을 유지할 목록에 추가
              console.log('이미지 URL 목록:', branchInfo.images);
            }
            // 이미지가 객체 배열인 경우
            else if (typeof branchInfo.images[0] === 'object') {
              // URL 속성이 있는 경우
              if (branchInfo.images[0].url) {
                const imageUrls = branchInfo.images.map(img => img.url);
                setExistingImages(imageUrls);
                setKeepImageUrls(imageUrls);
                console.log('이미지 URL 추출:', imageUrls);
              }
              // 이미지 자체가 URL인 경우
              else {
                setExistingImages(branchInfo.images);
                setKeepImageUrls(branchInfo.images);
                console.log('이미지 객체 그대로 사용:', branchInfo.images);
              }
            }
          } else {
            console.log('이미지가 없거나 유효하지 않음');
            setExistingImages([]);
            setKeepImageUrls([]);
          }
        } else {
          setError('지부 정보를 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
        }
      } catch (err) {
        console.error('지부 정보 불러오기 오류:', err);
        setError('지부 정보를 불러오는 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBranchData();
  }, [branchId]);

  // 지부 정보 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBranchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 주소 선택 핸들러 (주소 검색 컴포넌트에서 호출)
  const handleAddressSelect = (fullAddress, area) => {
    setBranchData(prev => ({
      ...prev,
      address: fullAddress,
      area: area // 지역(시/도) 정보 설정
    }));
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // 최대 5개 이미지 파일 제한 (기존 이미지 + 새 이미지)
    const existingCount = keepImageUrls ? keepImageUrls.length : 0;
    const newCount = branchData.images ? branchData.images.length : 0;
    const totalImages = existingCount + newCount + files.length;

    if (totalImages > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    // 새 이미지 파일 추가
    setBranchData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...files]
    }));
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageUrl) => {
    if (!imageUrl) return;

    // keepImageUrls에서 해당 URL 제거
    setKeepImageUrls(prev => prev.filter(url => url !== imageUrl));
    console.log(`이미지 URL '${imageUrl}' 제거됨`);
  };

  // 새 이미지 제거 핸들러
  const handleRemoveNewImage = (index) => {
    setBranchData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 입력값 검증
    if (!branchData.region || !branchData.address) {
      setError('지부명과 주소는 필수 입력 항목입니다.');
      return;
    }

    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      // 요청 데이터 생성
      const formData = new FormData();

      // 주소 결합 (기본 주소 + 상세 주소)
      const fullAddress = branchData.addressDetail
          ? `${branchData.address} ${branchData.addressDetail}`
          : branchData.address;

      // 지부 수정 정보를 JSON 문자열로 변환하여 update 파트에 추가
      const branchUpdate = {
        region: branchData.region,
        address: fullAddress,
        area: branchData.area,
        content: branchData.content
      };

      console.log('요청 데이터:', branchUpdate);

      // JSON 문자열로 변환하여 FormData에 추가
      const updateBlob = new Blob([JSON.stringify(branchUpdate)], { type: 'application/json' });
      formData.append('update', updateBlob);

      // 새 이미지 파일 추가
      if (branchData.images && branchData.images.length > 0) {
        branchData.images.forEach(image => {
          formData.append('images', image);
        });
      }

      // 유지할 이미지 URL 목록 추가
      console.log('유지할 이미지 URL 목록:', keepImageUrls);
      if (keepImageUrls && keepImageUrls.length > 0) {
        // 서버에서 기대하는 방식에 따라 수정
        // 방법 1: 각 URL을 별도의 항목으로 추가
        keepImageUrls.forEach(url => {
          formData.append('keepImageUrls', url);
        });

        // 방법 2: 배열을 JSON 문자열로 변환하여 추가
        // formData.append('keepImageUrls', JSON.stringify(keepImageUrls));
      }

      // 디버깅용 FormData 내용 출력
      console.log('---FormData 내용---');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`${key}: Blob 데이터`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // API 요청
      const res = await API.patch(`/branch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        alert('지부가 성공적으로 수정되었습니다.');
        navigate('/admin/branches');
      } else {
        setError('지부 수정에 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('지부 수정 오류:', err);

      // 오류 응답 상세 내용 출력
      if (err.response) {
        console.error('오류 상태:', err.response.status);
        console.error('오류 데이터:', err.response.data);
        console.error('오류 헤더:', err.response.headers);
        setError(`지부 수정 실패 (${err.response.status}): ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('응답 없음:', err.request);
        setError('서버로부터 응답이 없습니다.');
      } else {
        console.error('오류 메시지:', err.message);
        setError('지부 수정 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 디버깅용 이미지 정보 출력 함수
  const debugImages = () => {
    console.log('현재 existingImages:', existingImages);
    console.log('현재 keepImageUrls:', keepImageUrls);
    alert(`기존 이미지 수: ${existingImages.length}, 유지할 이미지 URL 수: ${keepImageUrls.length}`);
  };

  if (initialLoading) {
    return (
        <div className="branch-form-container">
          <h2 className="title">지부관리(지부수정)</h2>
          <div className="loading-indicator">지부 정보를 불러오는 중입니다...</div>
        </div>
    );
  }

  return (
      <div className="branch-form-container">
        <h2 className="title">지부관리(지부수정)</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="branch-form">
          <table className="input-table">
            <tbody>
            <tr>
              <th>지부명</th>
              <td>
                <input
                    type="text"
                    name="region"
                    value={branchData.region}
                    onChange={handleInputChange}
                    className="region-input"
                    placeholder="지부명을 입력하세요"
                    required
                />
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                <AddressSearch
                    onAddressSelect={handleAddressSelect}
                    selectedAddress={branchData.address}
                />
                <p className="input-help-text">* 주소를 변경하려면 주소 검색 버튼을 클릭하세요.</p>
              </td>
            </tr>
            <tr>
              <th>상세 주소</th>
              <td>
                <input
                    type="text"
                    name="addressDetail"
                    value={branchData.addressDetail}
                    onChange={handleInputChange}
                    placeholder="상세 주소를 입력하세요 (건물명, 동/호수 등)"
                />
              </td>
            </tr>
            <tr>
              <th>지부 설명</th>
              <td>
                <textarea
                    name="content"
                    value={branchData.content}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="지부 설명을 입력하세요"
                />
              </td>
            </tr>
            <tr>
              <th>이미지</th>
              <td>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="hidden-file-input"
                />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button
                      type="button"
                      className="image-upload-button"
                      onClick={handleImageUploadClick}
                  >
                    이미지 등록
                  </button>
                  <button
                      type="button"
                      className="image-upload-button"
                      onClick={debugImages}
                      style={{ backgroundColor: '#e74c3c' }}
                  >
                    이미지 정보 확인
                  </button>
                </div>

                <div className="image-management-section">
                  <h4>이미지 관리</h4>

                  {/* 기존 이미지 표시 */}
                  <div>
                    <h5>기존 이미지 ({existingImages.length}개)</h5>
                    <div className="image-preview-container">
                      {existingImages.length > 0 ? (
                          existingImages.map((imageUrl, index) => (
                              keepImageUrls.includes(imageUrl) && (
                                  <div key={`existing-${index}`} className="image-preview">
                                    <img
                                        src={imageUrl}
                                        alt={`지부 이미지 ${index + 1}`}
                                        onError={(e) => {
                                          console.error('이미지 로드 실패:', imageUrl);
                                          e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8yNC8xMqLz6JEAAADQSURBVHic7cExAQAAAMKg9U9tCF+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAxvQAAeh3OxgAAAAASUVORK5CYII=';
                                        }}
                                    />
                                    <div className="image-tag">기존</div>
                                    <button
                                        type="button"
                                        className="remove-image"
                                        onClick={() => handleRemoveExistingImage(imageUrl)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                              )
                          ))
                      ) : (
                          <div>기존 이미지가 없습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* 새 이미지 표시 */}
                  <div>
                    <h5>새 이미지 ({branchData.images.length}개)</h5>
                    <div className="image-preview-container">
                      {branchData.images.length > 0 ? (
                          branchData.images.map((file, index) => (
                              <div key={`new-${index}`} className="image-preview">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`새 이미지 ${index + 1}`}
                                />
                                <div className="image-tag">신규</div>
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => handleRemoveNewImage(index)}
                                >
                                  ✕
                                </button>
                              </div>
                          ))
                      ) : (
                          <div>새 이미지가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            </tbody>
          </table>

          <div className="form-buttons">
            <button
                type="submit"
                className="register-button"
                disabled={loading}
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default BranchEdit;