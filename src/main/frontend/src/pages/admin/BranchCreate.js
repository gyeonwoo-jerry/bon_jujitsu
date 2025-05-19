// BranchCreate.js - 수정된 버전 (지역 필드 숨김)
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import AddressSearch from '../../components/admin/AddressSearch';
import '../../styles/admin/branchForm.css';

const BranchCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingRegion, setCheckingRegion] = useState(false);
  const [error, setError] = useState(null);
  const [regionChecked, setRegionChecked] = useState(false);
  const [regionCheckMessage, setRegionCheckMessage] = useState('');
  const [regionCheckStatus, setRegionCheckStatus] = useState(null); // true: 사용가능, false: 중복, null: 미확인
  const fileInputRef = useRef(null);

  // 지부 정보 상태
  const [branchData, setBranchData] = useState({
    region: '', // 지부명
    address: '', // 기본 주소
    addressDetail: '', // 상세 주소
    area: '', // 지역(시/도) - 화면에 표시되지 않음
    content: '', // 지부 설명
    images: [] // 이미지 파일
  });

  // 이미지 미리보기 URL
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // 지부 정보 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      // 지부명이 변경되면 중복 확인 상태 초기화
      setRegionChecked(false);
      setRegionCheckMessage('');
      setRegionCheckStatus(null);
    }

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
      area: area // 지역(시/도) 정보 설정 - 내부적으로만 저장
    }));
  };

  // 지부명 중복 확인
  const handleRegionCheck = async () => {
    if (!branchData.region.trim()) {
      alert('지부명을 입력해주세요.');
      return;
    }

    setCheckingRegion(true);

    try {
      const res = await API.get(`/branch/check?region=${encodeURIComponent(branchData.region)}`);

      if (res.data?.success) {
        const { isDuplicate, message } = res.data.content;
        setRegionCheckStatus(!isDuplicate); // true면 사용 가능, false면 중복
        setRegionCheckMessage(message);
        setRegionChecked(true);

        // 알림 표시
        alert(message);
      } else {
        setRegionCheckMessage('중복 확인 중 오류가 발생했습니다.');
        setRegionCheckStatus(null);
        alert('중복 확인 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('지부명 중복 확인 오류:', err);
      setRegionCheckMessage('중복 확인 중 오류가 발생했습니다.');
      setRegionCheckStatus(null);
      alert('중복 확인 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setCheckingRegion(false);
    }
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // 최대 5개 이미지 파일 제한
    if (files.length + branchData.images.length > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    setBranchData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    // 이미지 미리보기 URL 생성
    const newImagePreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls]);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index) => {
    setBranchData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // 미리보기 URL 제거 및 리소스 해제
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 입력값 검증
    if (!branchData.region || !branchData.address) {
      setError('지부명과 주소는 필수 입력 항목입니다.');
      return;
    }

    // 지역 정보 확인
    if (!branchData.area) {
      setError('지역 정보가 누락되었습니다. 주소를 다시 검색해주세요.');
      return;
    }

    // 지부명 중복 확인 여부 검증
    if (!regionChecked || regionCheckStatus === false) {
      setError('지부명 중복 확인이 필요합니다.');
      return;
    }

    // 토큰 확인
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 요청 데이터 생성
      const formData = new FormData();

      // 주소 결합 (기본 주소 + 상세 주소)
      const fullAddress = branchData.addressDetail
          ? `${branchData.address} ${branchData.addressDetail}`
          : branchData.address;

      // 지부 정보를 JSON 문자열로 변환하여 request 파트에 추가
      const branchRequest = {
        region: branchData.region,
        address: fullAddress, // 합쳐진 주소
        area: branchData.area, // 주소에서 추출한 시/도 정보
        content: branchData.content,
      };

      console.log('요청 데이터:', branchRequest);

      // JSON 문자열로 변환하여 FormData에 추가
      const requestBlob = new Blob([JSON.stringify(branchRequest)], { type: 'application/json' });
      formData.append('request', requestBlob);

      // 이미지 파일 추가
      if (branchData.images.length > 0) {
        branchData.images.forEach(image => {
          formData.append('images', image);
        });
      }

      // API 요청
      const res = await API.post('/branch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        alert('지부가 성공적으로 등록되었습니다.');
        navigate('/admin/branches');
      } else {
        setError('지부 등록에 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('지부 등록 오류:', err);
      setError('지부 등록 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="branch-form-container">
        <h2 className="title">지부관리(지부등록)</h2>

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
                <div className="region-check-container">
                  <input
                      type="text"
                      name="region"
                      value={branchData.region}
                      onChange={handleInputChange}
                      className="region-input"
                      placeholder="지부명을 입력하세요"
                      required
                  />
                  <button
                      type="button"
                      className="region-check-button"
                      onClick={handleRegionCheck}
                      disabled={checkingRegion || !branchData.region.trim()}
                  >
                    {checkingRegion ? '확인 중...' : '지부명 중복확인'}
                  </button>
                </div>
                {regionCheckMessage && (
                    <div className={`region-check-message ${regionCheckStatus ? 'success' : 'error'}`}>
                      {regionCheckMessage}
                    </div>
                )}
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                <AddressSearch
                    onAddressSelect={handleAddressSelect}
                    selectedAddress={branchData.address}
                />
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
                <button
                    type="button"
                    className="image-upload-button"
                    onClick={handleImageUploadClick}
                >
                  이미지 등록
                </button>
                <div className="image-preview-container">
                  {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="image-preview">
                        <img src={url} alt={`지부 이미지 ${index + 1}`} />
                        <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleRemoveImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                  ))}
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
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default BranchCreate;