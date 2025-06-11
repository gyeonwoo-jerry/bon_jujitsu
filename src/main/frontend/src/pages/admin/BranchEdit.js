// BranchEdit.js - ProductEdit.js와 동일한 구조로 개선
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import AddressSearch from '../../components/admin/AddressSearch';
import "../../styles/admin/admin.css";
import config from '../../utils/config';

const BranchEdit = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const originalImageIds = useRef([]); // 원래 이미지 ID 목록을 저장하는 ref

  // 지부 정보 상태
  const [branchData, setBranchData] = useState({
    region: '',
    address: '',
    addressDetail: '',
    area: '',
    content: '',
    images: [] // 새로 추가할 이미지 파일
  });

  // 기존 이미지 정보 (URL과 ID 포함)
  const [existingImages, setExistingImages] = useState([]);

  // 유지할 이미지 ID 배열
  const [keepImageIds, setKeepImageIds] = useState([]);

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

          // 주소 설정
          let mainAddress = branchInfo.address || '';
          let detailAddress = '';

          // 메인 주소와 상세 주소 분리 (서버 응답 형식에 따라 조정 필요)
          if (mainAddress.includes(' ')) {
            const lastSpaceIndex = mainAddress.lastIndexOf(' ');
            detailAddress = mainAddress.substring(lastSpaceIndex + 1);
            mainAddress = mainAddress.substring(0, lastSpaceIndex);
          }

          // 지부 데이터 설정
          setBranchData({
            region: branchInfo.region || '',
            address: mainAddress,
            addressDetail: detailAddress,
            area: branchInfo.area || '',
            content: branchInfo.content || '',
            images: [] // 새 이미지 초기화
          });

          // 기존 이미지 설정
          if (branchInfo.images && branchInfo.images.length > 0) {
            console.log('서버에서 받은 이미지 데이터:', branchInfo.images);

            // 이미지 객체 처리
            const imageObjects = branchInfo.images.map(img => {
              // 이미지가 객체인 경우 (id와 url 포함)
              if (typeof img === 'object' && img.id) {
                return {
                  id: img.id,
                  url: img.imagePath || img.url
                };
              }
              // 이미지가 문자열(URL)인 경우
              else if (typeof img === 'string') {
                // URL에서 ID 추출 시도
                const idMatch = img.match(/(\d+)\.jpg$/);
                const id = idMatch ? parseInt(idMatch[1]) : null;
                return {
                  id: id,
                  url: img
                };
              }
              return null;
            }).filter(img => img !== null);

            setExistingImages(imageObjects);

            // 모든 이미지 ID를 유지할 목록에 추가 (기본적으로 모든 기존 이미지 유지)
            const imageIds = imageObjects.map(img => img.id).filter(id => id !== null);
            setKeepImageIds(imageIds);

            // 원본 이미지 ID 목록 저장 (복원 버튼용)
            originalImageIds.current = [...imageIds];

            console.log('이미지 객체 정보:', imageObjects);
            console.log('유지할 이미지 ID 목록:', imageIds);
            console.log('원본 이미지 ID 목록 저장됨:', originalImageIds.current);
          } else {
            console.log('이미지가 없거나 유효하지 않음');
            setExistingImages([]);
            setKeepImageIds([]);
            originalImageIds.current = [];
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

  // 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBranchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // 최대 5개 이미지 파일 제한 (기존 유지 이미지 + 새 이미지)
    const existingCount = keepImageIds ? keepImageIds.length : 0;
    const newCount = branchData.images ? branchData.images.length : 0;
    const totalImages = existingCount + newCount + files.length;

    if (totalImages > 20) {
      alert(`이미지는 최대 20개까지 업로드할 수 있습니다. (현재 유지 이미지: ${existingCount}개, 신규 이미지: ${newCount}개)`);
      return;
    }

    // 새 이미지 파일 추가 (기존 이미지 유지)
    setBranchData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...files]
    }));

    // 중요: 이미지를 추가할 때 기존 keepImageIds가 유지되는지 확인
    console.log('새 이미지 추가 후 keepImageIds:', keepImageIds);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageId) => {
    if (imageId === undefined || imageId === null) return;

    // 디버깅용 로그
    console.log(`이미지 ID '${imageId}' (타입: ${typeof imageId}) 제거 시도`);

    // keepImageIds에서 해당 ID 제거
    setKeepImageIds(prev => {
      const newIds = prev.filter(id => id !== imageId);
      console.log(`이미지 ID '${imageId}' 제거됨, 남은 ID:`, newIds);
      return newIds;
    });
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

    // 이미지 검증
    if (keepImageIds.length === 0 && branchData.images.length === 0) {
      setError('지부 이미지를 최소 1개 이상 등록해주세요.');
      return;
    }

    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      // 주소 결합
      const fullAddress = branchData.addressDetail
          ? `${branchData.address} ${branchData.addressDetail}`
          : branchData.address;

      // 1. FormData 생성
      const formData = new FormData();

      // 2. update 필드 추가 (JSON)
      const updateData = {
        region: branchData.region,
        address: fullAddress,
        area: branchData.area || ''
      };

      // 내용이 있는 경우에만 추가
      if (branchData.content && branchData.content.trim() !== '') {
        updateData.content = branchData.content;
      }

      const updateBlob = new Blob([JSON.stringify(updateData)], { type: 'application/json' });
      formData.append('update', updateBlob);

      // 3. keepImageIds 필드 추가 (JSON 배열)
      // 중요: 항상 keepImageIds 추가 (빈 배열이라도)
      const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds || [])], { type: 'application/json' });
      formData.append('keepImageIds', keepImageIdsBlob);

      // 4. 새 이미지가 있는 경우에만 추가
      if (branchData.images && branchData.images.length > 0) {
        branchData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      // 새 이미지가 없는 경우에는 아무것도 추가할 필요 없음 - 백엔드가 수정되었으므로

      // 디버깅용
      console.log('FormData 구성:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`${key}: Blob 데이터 (type: ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // 5. API 요청
      const res = await API.patch(`/branch/${branchId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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
    console.log('현재 keepImageIds:', keepImageIds);

    // 디버깅 알림 보강
    alert(`
이미지 상태 정보:
- 기존 이미지 수: ${existingImages.length}개
- 유지할 이미지 ID 수: ${keepImageIds.length}개
- 유지할 이미지 ID 목록: ${keepImageIds.join(', ') || '없음'}
- 새 이미지 수: ${branchData.images.length}개
    `);
  };

  if (initialLoading) {
    return (
      <div className="admin_main">
        <div className="admin_contents">
          <div className="page-header">
            <div className="title">지부관리(지부수정)</div>
          </div>
          <div className="loading-indicator">지부 정보를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin_main">
      <div className="admin_contents">
        <div className="page-header">
          <div className="title">지부관리(지부수정)</div>
        </div>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="form-container branch-form">
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
              <td className="addr_input">
                <AddressSearch
                    onAddressSelect={(address, area) => {
                      setBranchData(prev => ({
                        ...prev,
                        address,
                        area: area || prev.area
                      }));
                    }}
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
              <th>지역</th>
              <td>
                <input
                    type="text"
                    name="area"
                    value={branchData.area}
                    onChange={handleInputChange}
                    placeholder="지역을 입력하세요 (예: 서울특별시, 경기도 등)"
                    required
                />
                <p className="input-help-text">* 주소 검색 시 자동으로 설정됩니다.</p>
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
                <div className="image-info-section">
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
                  <button
                      type="button"
                      className="image-upload-button"
                      onClick={() => {
                        // 원본 이미지 ID 목록에서 모든 이미지 ID를 다시 keepImageIds로 설정
                        setKeepImageIds([...originalImageIds.current]);
                        console.log('모든 기존 이미지 복원됨:', originalImageIds.current);
                        alert('모든 기존 이미지가 복원되었습니다.');
                      }}
                      style={{ backgroundColor: '#27ae60' }}
                  >
                    모든 이미지 복원
                  </button>
                </div>

                <div className="image-management-section">
                  <h4>이미지 관리</h4>

                  {/* 기존 이미지 표시 */}
                  <div>
                    <h5>기존 이미지 ({existingImages.length}개)</h5>
                    <div className="image-preview-container">
                      {existingImages.length > 0 ? (
                          existingImages.map((image, index) => (
                              <div key={`existing-${index}`} className="image-preview">
                                <img
                                    src={image.url}
                                    alt={`지부 이미지 ${index + 1}`}
                                    onError={(e) => {
                                      console.error('이미지 로드 실패:', image.url);
                                      e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8yNC8xMqLz6JEAAADQSURBVHic7cExAQAAAMKg9U9tCF+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAxvQAAeh3OxgAAAAASUVORK5CYII=';
                                    }}
                                />
                                <div className="image-tag">기존 [{image.id}]</div>
                                {keepImageIds.includes(image.id) ? (
                                    <button
                                        type="button"
                                        className="remove-image"
                                        onClick={() => handleRemoveExistingImage(image.id)}
                                    >
                                      ✕
                                    </button>
                                ) : (
                                    <div className="removed-tag">삭제됨</div>
                                )}
                              </div>
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

                  {/* 이미지 개수 요약 표시 */}
                  <div className="image-summary">
                    <strong>이미지 현황:</strong> 기존 이미지 {keepImageIds.length}개 + 신규 이미지 {branchData.images.length}개 = 총 {keepImageIds.length + branchData.images.length}개
                    {(keepImageIds.length + branchData.images.length > 5) &&
                        <div style={{ color: 'red', marginTop: '5px' }}>⚠️ 이미지는 최대 20개까지만 가능합니다!</div>
                    }
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
            <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/admin/branches')}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchEdit;