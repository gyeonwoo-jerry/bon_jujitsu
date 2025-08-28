import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import AddressSearch from '../../components/admin/AddressSearch';
import "../../styles/profileEdit.css";

// MyPageComponents를 인라인으로 정의
const MyPageAlert = ({ type = "info", title, message, closable = false, onClose = null }) => {
  return (
      <div className={`mypage-alert ${type}`}>
        <div className="alert-icon">
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="alert-content">
          {title && <h4 className="alert-title">{title}</h4>}
          <p className="alert-message">{message}</p>
        </div>
        {closable && (
            <button className="alert-close" onClick={onClose}>✕</button>
        )}
      </div>
  );
};

const MyPageLoadingSpinner = ({ size = "medium", message = "로딩 중..." }) => {
  return (
      <div className={`mypage-loading-spinner ${size}`}>
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
  );
};

const MyPageInfoCard = ({ title, items = [], variant = "default" }) => {
  return (
      <div className={`mypage-info-card ${variant}`}>
        <h4 className="info-card-title">{title}</h4>
        <div className="info-card-content">
          {items.map((item, index) => (
              <div key={index} className="info-item">
                <span className="info-label">{item.label}:</span>
                <span className="info-value">{item.value || '-'}</span>
              </div>
          ))}
        </div>
      </div>
  );
};

const MyPageStatusBadge = ({ status, text, size = "medium" }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'info': return 'blue';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };

  return (
      <span className={`status-badge ${getStatusColor(status)} ${size}`}>
      {text}
    </span>
  );
};

const ProfileEditPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // 3단계 지부 선택 상태
  const [areas, setAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // 로딩 상태
  const [areasLoading, setAreasLoading] = useState(false);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNum: '',
    address: '',
    addressDetail: '',
    birthday: '',
    gender: '',
    password: '',
    confirmPassword: '',
    branchIds: [],
    level: 0,
    stripe: 'WHITE',
    sns1: '',
    sns2: '',
    sns3: '',
    sns4: '',
    sns5: ''
  });

  // 🎯 이미지 관련 상태 (ImageResponse 지원)
  const [selectedImages, setSelectedImages] = useState([]); // 새로 추가할 이미지 파일들
  const [keepImageIds, setKeepImageIds] = useState([]); // 유지할 기존 이미지 ID들
  const [existingImages, setExistingImages] = useState([]); // 기존 이미지 정보 {id, url}

  useEffect(() => {
    loadUserProfile();
    loadAreas();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      console.log('프로필 정보 로딩 시작...');

      const response = await API.get('/users/profile');
      console.log('API 응답:', response);

      if (response && response.data) {
        const user = response.data.success ? response.data.content : response.data;
        console.log('사용자 데이터:', user);

        if (user && typeof user === 'object') {
          setUserInfo(user);

          // 주소와 상세주소 분리
          let mainAddress = user.address || '';
          let detailAddress = '';

          // 주소에 여러 단어가 있으면 마지막 부분을 상세주소로 분리
          if (mainAddress.includes(' ')) {
            const addressParts = mainAddress.split(' ');
            if (addressParts.length > 3) { // 3개 이상의 주소 부분이 있으면
              detailAddress = addressParts.slice(-1)[0]; // 마지막 부분을 상세주소로
              mainAddress = addressParts.slice(0, -1).join(' '); // 나머지를 메인주소로
            }
          }

          // 폼 데이터 초기화
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phoneNum: user.phoneNum || '',
            address: mainAddress,
            addressDetail: detailAddress,
            birthday: user.birthday || '',
            gender: user.gender || '',
            password: '',
            confirmPassword: '',
            branchIds: (user.branchUsers && Array.isArray(user.branchUsers))
                ? user.branchUsers.map(bu => bu.branchId).filter(id => id !== undefined)
                : [],
            level: user.level || 0,
            stripe: user.stripe || 'WHITE',
            sns1: user.sns1 || '',
            sns2: user.sns2 || '',
            sns3: user.sns3 || '',
            sns4: user.sns4 || '',
            sns5: user.sns5 || ''
          });

          // 🎯 이미지 처리 부분 - ImageResponse 형태로 처리
          console.log('사용자 이미지 데이터:', user.images);

          if (user.images && Array.isArray(user.images) && user.images.length > 0) {
            // ImageResponse 형태의 이미지 처리 { id, url }
            const imageObjects = user.images.map(img => {
              if (typeof img === 'object' && img.id && img.url) {
                return {
                  id: img.id,
                  url: img.url
                };
              }
              return null;
            }).filter(img => img !== null);

            setExistingImages(imageObjects);

            // 모든 기존 이미지 ID를 유지 목록에 추가
            const imageIds = imageObjects.map(img => img.id);
            setKeepImageIds(imageIds);

            console.log('처리된 이미지 객체:', imageObjects);
            console.log('유지할 이미지 ID 목록:', imageIds);
          } else {
            setExistingImages([]);
            setKeepImageIds([]);
          }
        } else {
          throw new Error('사용자 데이터가 올바르지 않습니다.');
        }
      } else {
        throw new Error('API 응답이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      const errorMessage = error.response?.data?.message || error.message || '프로필 정보를 불러오는데 실패했습니다.';
      showAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 1단계: 광역 지역 목록 로드
  const loadAreas = async () => {
    try {
      setAreasLoading(true);
      const response = await API.get('/branch/areas');
      console.log('🔍 광역 지역 API 응답:', response.data);
      setAreas(response.data.content || []);
    } catch (error) {
      console.error('광역 지역 로드 실패:', error);
      showAlert('warning', '광역 지역을 불러오는데 실패했습니다.');
    } finally {
      setAreasLoading(false);
    }
  };

  // 2단계: 세부 지역 로드
  const fetchRegionsByArea = async (area) => {
    if (!area) {
      setRegions([]);
      return;
    }

    try {
      setRegionsLoading(true);
      const response = await API.get(`/branch/regions?area=${encodeURIComponent(area)}`);
      console.log('🔍 세부 지역 API 응답:', response.data);
      setRegions(response.data.content || []);
    } catch (error) {
      console.error('세부 지역 로드 실패:', error);
      showAlert('warning', '세부 지역을 불러오는데 실패했습니다.');
      setRegions([]);
    } finally {
      setRegionsLoading(false);
    }
  };

  // 3단계: 지점 로드
  const fetchBranchesByRegion = async (area, region) => {
    if (!area || !region) {
      setBranches([]);
      return;
    }

    try {
      setBranchesLoading(true);
      const params = new URLSearchParams({
        area: area,
        region: region,
        page: 1,
        size: 100
      });

      const response = await API.get(`/branch/all?${params.toString()}`);
      console.log('🔍 지점 API 응답:', response.data);
      setBranches(response.data.content?.list || []);
    } catch (error) {
      console.error('지점 로드 실패:', error);
      showAlert('warning', '지점 정보를 불러오는데 실패했습니다.');
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // 띠 색깔이 변경되면 레벨을 초기화
    if (name === 'stripe') {
      setFormData(prev => ({
        ...prev,
        stripe: value,
        level: 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  // 주소 선택 핸들러
  const handleAddressSelect = (fullAddress, area) => {
    setFormData(prev => ({
      ...prev,
      address: fullAddress
    }));
  };

  // 광역 지역 변경 핸들러
  const handleAreaChange = (e) => {
    const area = e.target.value;
    console.log('🔍 선택된 광역 지역:', area);

    setSelectedArea(area);
    setSelectedRegion('');
    setRegions([]);
    setBranches([]);

    if (area) {
      fetchRegionsByArea(area);
    }
  };

  // 세부 지역 변경 핸들러
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setBranches([]);

    if (region && selectedArea) {
      fetchBranchesByRegion(selectedArea, region);
    }
  };

  // 지점 선택/해제 핸들러
  const handleBranchToggle = (branchId) => {
    setFormData(prev => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
          ? prev.branchIds.filter(id => id !== branchId)
          : [...prev.branchIds, branchId]
    }));
  };

  const handleBranchRemove = (branchId) => {
    console.log('🗑️ 지부 삭제:', branchId);
    setFormData(prev => ({
      ...prev,
      branchIds: prev.branchIds.filter(id => id !== branchId)
    }));
  };

  // 🎯 이미지 관련 핸들러들 (ImageResponse 지원)
  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    // 총 이미지 개수 제한 체크
    const existingCount = keepImageIds.length;
    const currentNewCount = selectedImages.length;
    const totalImages = existingCount + currentNewCount + newFiles.length;

    if (totalImages > 10) {
      alert(`프로필 이미지는 최대 10개까지 업로드할 수 있습니다. (현재: 기존 ${existingCount}개 + 신규 ${currentNewCount}개)`);
      return;
    }

    // 새로운 파일들을 기존 selectedImages에 추가
    setSelectedImages(prev => [...prev, ...newFiles]);

    // 파일 input 초기화
    e.target.value = '';
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageId) => {
    console.log(`기존 이미지 ID ${imageId} 제거`);
    setKeepImageIds(prev => prev.filter(id => id !== imageId));
  };

  // 새 이미지 제거 핸들러
  const handleRemoveNewImage = (index) => {
    console.log(`새 이미지 인덱스 ${index} 제거`);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 모든 이미지 삭제 핸들러
  const removeAllImages = () => {
    setSelectedImages([]);
    setKeepImageIds([]);

    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

  // 모든 기존 이미지 복원 핸들러
  const restoreAllExistingImages = () => {
    const allImageIds = existingImages.map(img => img.id);
    setKeepImageIds(allImageIds);
    console.log('모든 기존 이미지 복원:', allImageIds);
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      showAlert('error', '이름을 입력해주세요.');
      return false;
    }

    if (!formData.email?.trim()) {
      showAlert('error', '이메일을 입력해주세요.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('error', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (!formData.phoneNum?.trim()) {
      showAlert('error', '전화번호를 입력해주세요.');
      return false;
    }

    const phoneRegex = /^(01[0|1|6|7|8|9])\d{7,8}$/;
    if (!phoneRegex.test(formData.phoneNum)) {
      showAlert('error', '올바른 전화번호 형식을 입력해주세요. (예: 01012345678)');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      showAlert('error', '비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return false;
    }

    if (formData.password && formData.password.length < 4) {
      showAlert('error', '비밀번호는 4자 이상이어야 합니다.');
      return false;
    }

    if (!formData.branchIds || formData.branchIds.length === 0) {
      showAlert('error', '최소 하나의 지부를 선택해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      console.log('프로필 수정 시작...');

      // FormData 생성
      const formDataToSend = new FormData();

      // ProfileUpdate 데이터 객체 생성
      const updateData = {};

      // 기본 정보 필드들
      if (formData.name?.trim()) updateData.name = formData.name.trim();
      if (formData.email?.trim()) updateData.email = formData.email.trim();
      if (formData.phoneNum?.trim()) updateData.phoneNum = formData.phoneNum.trim();

      // 주소와 상세주소 합치기
      if (formData.address?.trim()) {
        const fullAddress = formData.addressDetail?.trim()
            ? `${formData.address} ${formData.addressDetail}`
            : formData.address;
        updateData.address = fullAddress;
      }

      if (formData.birthday) updateData.birthday = formData.birthday;
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.level >= 0) updateData.level = formData.level;
      if (formData.stripe) updateData.stripe = formData.stripe;
      if (formData.sns1?.trim()) updateData.sns1 = formData.sns1.trim();
      if (formData.sns2?.trim()) updateData.sns2 = formData.sns2.trim();
      if (formData.sns3?.trim()) updateData.sns3 = formData.sns3.trim();
      if (formData.sns4?.trim()) updateData.sns4 = formData.sns4.trim();
      if (formData.sns5?.trim()) updateData.sns5 = formData.sns5.trim();

      // 지부 변경사항 계산
      const currentIds = userInfo?.branchUsers?.map(cb => cb.branchId) || [];
      const newIds = formData.branchIds;

      const branchesToAdd = newIds.filter(id => !currentIds.includes(id));
      const branchesToRemove = currentIds.filter(id => !newIds.includes(id));

      updateData.branchesToAdd = branchesToAdd.length > 0 ? branchesToAdd : null;
      updateData.branchesToRemove = branchesToRemove.length > 0 ? branchesToRemove : null;

      // 비밀번호가 입력된 경우에만 추가
      if (formData.password?.trim()) {
        updateData.password = formData.password;
      }

      console.log('🔍 최종 전송 데이터:', updateData);

      // JSON 데이터를 Blob으로 변환하여 추가
      const updateBlob = new Blob([JSON.stringify(updateData)], {
        type: 'application/json'
      });
      formDataToSend.append('update', updateBlob);

      // 새 이미지 파일들 추가
      if (selectedImages && selectedImages.length > 0) {
        selectedImages.forEach(file => {
          formDataToSend.append('images', file);
        });
      }

      // 유지할 이미지 ID들 추가
      if (keepImageIds && keepImageIds.length > 0) {
        const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds)], {
          type: 'application/json'
        });
        formDataToSend.append('keepImageIds', keepImageIdsBlob);
      }

      // API 호출
      const response = await API.patch('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('🔍 서버 응답:', response);

      const isSuccess = response.data?.success !== false;

      if (isSuccess) {
        const userConfirmed = window.confirm('회원정보 수정이 완료되었습니다!\n\n확인을 누르면 마이페이지로 돌아갑니다.');
        if (userConfirmed) {
          window.location.href = '/mypage';
        }
      } else {
        throw new Error(response.data?.message || '프로필 수정 실패');
      }

    } catch (error) {
      console.error('프로필 수정 오류:', error);

      let errorMessage = '프로필 수정 중 오류가 발생했습니다.';

      if (error.response?.data?.message?.includes('address') ||
          error.response?.data?.message?.includes('중복') ||
          error.response?.data?.message?.includes('Duplicate')) {
        errorMessage = '입력하신 주소가 이미 사용 중입니다. 다른 주소를 입력해주세요.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      window.alert(errorMessage);

    } finally {
      setSaving(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const goBack = () => {
    window.history.back();
  };

  const goToMyPage = () => {
    window.location.href = '/mypage';
  };

  // 현재 선택된 지부들
  const selectedBranches = branches.filter(branch =>
      formData.branchIds.includes(branch.id)
  );

  // 현재 소속 지부 정보
  const currentBranches = userInfo?.branchUsers || [];

  // 로딩 중일 때
  if (loading) {
    return (
        <div className="mypage_main">
          <div className="mypage_contents">
            <MyPageLoadingSpinner message="프로필 정보를 불러오는 중..." />
          </div>
        </div>
    );
  }

  // 사용자 정보를 불러오지 못했을 때
  if (!userInfo) {
    return (
        <div className="mypage_main">
          <div className="mypage_contents">
            <MyPageAlert
                type="error"
                message="프로필 정보를 불러올 수 없습니다."
            />
            <div className="error-actions">
              <button onClick={goToMyPage} className="submit-button">
                마이페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="mypage_main">
        <div className="mypage_contents">
          {/* 헤더 */}
          <div className="page-header">
            <button onClick={goBack} className="back-button">
              ← 마이페이지로 돌아가기
            </button>
            <h1 className="page-title">회원정보 수정</h1>
          </div>

          {/* 알림 메시지 */}
          {alert && (
              <MyPageAlert
                  type={alert.type}
                  message={alert.message}
                  closable={true}
                  onClose={() => setAlert(null)}
              />
          )}

          {/* 현재 회원 정보 요약 */}
          <div className="current-info-section">
            <MyPageInfoCard
                title="현재 회원 정보"
                items={[
                  { label: '이름', value: userInfo.name },
                  { label: '이메일', value: userInfo.email },
                  { label: '전화번호', value: userInfo.phoneNum },
                  { label: 'Gral', value: userInfo.level ? `${userInfo.level}` : '-' },
                  { label: '벨트', value: userInfo.stripe || '-' },
                  { label: '가입일', value: userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '-' }
                ]}
            />
          </div>

          {/* 현재 소속 지부 정보 */}
          {currentBranches.length > 0 && (
              <div className="current-branches-section">
                <h3 className="section-title">현재 소속 지부</h3>
                <div className="current-branches-list">
                  {currentBranches.map((branchUser, index) => (
                      <div key={index} className="current-branch-item">
                        <span className="branch-name">{branchUser.region}</span>
                        <MyPageStatusBadge
                            status="info"
                            text={branchUser.userRole}
                            size="small"
                        />
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* 수정 폼 */}
          <div className="profile-edit-form">

            {/* 기본 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">기본 정보</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">이름 *</label>
                  <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                      placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">이메일 *</label>
                  <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                      placeholder="이메일을 입력하세요"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNum">전화번호 *</label>
                  <input
                      type="tel"
                      id="phoneNum"
                      name="phoneNum"
                      value={formData.phoneNum}
                      onChange={handleInputChange}
                      required
                      placeholder="01012345678"
                      className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="birthday">생년월일</label>
                  <input
                      type="date"
                      id="birthday"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="address">주소</label>
                  <AddressSearch
                      onAddressSelect={handleAddressSelect}
                      selectedAddress={formData.address}
                  />
                  <p className="input-help-text">* 주소를 변경하시려면 주소 검색 버튼을 클릭하세요.</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="addressDetail">상세 주소</label>
                  <input
                      type="text"
                      id="addressDetail"
                      name="addressDetail"
                      value={formData.addressDetail || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="상세 주소를 입력하세요 (건물명, 동/호수 등)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">성별</label>
                  <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-control"
                  >
                    <option value="">선택하세요</option>
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="form-section">
              <h3 className="section-title">비밀번호 변경</h3>
              <p className="section-description">
                비밀번호를 변경하지 않으려면 빈 칸으로 두세요. (최소 8자 이상)
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">새 비밀번호</label>
                  <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="새 비밀번호 (8자 이상)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">비밀번호 확인</label>
                  <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="비밀번호 확인"
                  />
                </div>
              </div>
            </div>

            {/* 주짓수 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">주짓수 정보</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stripe">띠 색깔</label>
                  <select
                      id="stripe"
                      name="stripe"
                      value={formData.stripe}
                      onChange={handleInputChange}
                      className="form-control"
                  >
                    <option value="WHITE">화이트</option>
                    <option value="BLUE">블루</option>
                    <option value="PURPLE">퍼플</option>
                    <option value="BROWN">브라운</option>
                    <option value="BLACK">블랙</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="level">Gral</label>
                  <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="form-control"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    {formData.stripe === 'BLACK' && (
                        <>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10">10</option>
                        </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* 3단계 지부 선택 섹션 */}
            <div className="branch-selection-section">
              <h3 className="section-title">지부 선택 *</h3>
              <p className="section-description">
                새로운 지부를 추가하거나 기존 지부를 변경할 수 있습니다.
              </p>

              {/* 1단계: 광역 지역 */}
              <div className="form-section">
                <label className="step-label">
                  1단계: 광역 지역 선택
                </label>
                {areasLoading ? (
                    <div className="loading-container">
                      <span className="loading-text">광역 지역 목록을 불러오는 중...</span>
                    </div>
                ) : (
                    <select
                        value={selectedArea}
                        onChange={handleAreaChange}
                        className="form-control"
                    >
                      <option value="">광역 지역을 선택하세요</option>
                      {areas.map(area => (
                          <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                )}
              </div>

              {/* 2단계: 세부 지역 */}
              {selectedArea && (
                  <div className="form-section">
                    <label className="step-label">
                      2단계: 세부 지역 선택
                    </label>
                    {regionsLoading ? (
                        <div className="loading-container">
                          <span className="loading-text">세부 지역 목록을 불러오는 중...</span>
                        </div>
                    ) : regions.length === 0 ? (
                        <div className="empty-state">
                          <span className="empty-state-text">해당 광역 지역에 세부 지역이 없습니다.</span>
                        </div>
                    ) : (
                        <select
                            value={selectedRegion}
                            onChange={handleRegionChange}
                            className="form-control"
                        >
                          <option value="">세부 지역을 선택하세요</option>
                          {regions.map(region => (
                              <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                    )}
                  </div>
              )}

              {/* 3단계: 지점 선택 */}
              {selectedRegion && (
                  <div className="form-section">
                    <label className="step-label">
                      3단계: {selectedArea} {selectedRegion} 지점 선택
                    </label>
                    {branchesLoading ? (
                        <div className="loading-spinner-container">
                          <div className="loading-spinner-content">
                            <div className="loading-spinner"></div>
                            <span className="loading-spinner-text">지점 목록을 불러오는 중...</span>
                          </div>
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="empty-state">
                          <p className="empty-state-text">해당 지역에 지점이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="branch-list-container">
                          {branches.map(branch => (
                              <label key={branch.id} className="branch-card">
                                <input
                                    type="checkbox"
                                    checked={formData.branchIds.includes(branch.id)}
                                    onChange={() => handleBranchToggle(branch.id)}
                                    className="branch-card-checkbox"
                                />
                                <div className="branch-card-content">
                                  <div className="branch-name">
                                    {branch.area} {branch.region}점
                                  </div>
                                  <div className="branch-address">{branch.address}</div>
                                  {branch.content && (
                                      <div className="branch-description">{branch.content}</div>
                                  )}
                                </div>
                              </label>
                          ))}
                        </div>
                    )}

                    {/* 선택된 지점 요약 */}
                    {selectedBranches.length > 0 && (
                        <div className="selected-branches-summary">
                          <p className="summary-title">
                            {selectedBranches.length}개 지점 선택됨
                          </p>
                          <div className="summary-list">
                            {selectedBranches.map(branch => `${branch.area} ${branch.region}점`).join(', ')}
                          </div>
                        </div>
                    )}
                  </div>
              )}

              {/* 현재 선택된 모든 지부 표시 */}
              {formData.branchIds.length > 0 && (
                  <div className="form-section">
                    <label className="step-label">선택된 지부 목록 ({formData.branchIds.length}개)</label>
                    <div className="selected-all-branches">
                      {formData.branchIds.map(branchId => {
                        const branch = branches.find(b => b.id === branchId);
                        const currentBranch = currentBranches.find(cb => cb.branchId === branchId);

                        const displayName = branch
                            ? `${branch.area} ${branch.region}점`
                            : (currentBranch ? currentBranch.region : `지부 ID: ${branchId}`);

                        return (
                            <div key={branchId} className="selected-branch-tag">
                              <span className="branch-tag-name">{displayName}</span>
                              <button
                                  type="button"
                                  onClick={() => handleBranchRemove(branchId)}
                                  className="branch-tag-remove"
                                  title="제거"
                              >
                                ✕
                              </button>
                            </div>
                        );
                      })}
                    </div>
                  </div>
              )}
            </div>

            {/* SNS 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">SNS 정보</h3>
              <p className="section-description">
                SNS 계정 정보를 입력하세요. (선택사항)
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sns1">SNS 1 (Facebook)</label>
                  <input
                      type="text"
                      id="sns1"
                      name="sns1"
                      value={formData.sns1}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Facebook"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sns2">SNS 2 (Instagram)</label>
                  <input
                      type="text"
                      id="sns2"
                      name="sns2"
                      value={formData.sns2}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Instagram"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sns3">SNS 3 (Blog)</label>
                  <input
                      type="text"
                      id="sns3"
                      name="sns3"
                      value={formData.sns3}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Blog"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sns4">SNS 4 (Cafe)</label>
                  <input
                      type="text"
                      id="sns4"
                      name="sns4"
                      value={formData.sns4}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Cafe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sns5">SNS 5 (YouTube)</label>
                <input
                    type="text"
                    id="sns5"
                    name="sns5"
                    value={formData.sns5}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="YouTube 채널"
                />
              </div>
            </div>

            {/* 🎯 이미지 업로드 섹션 (ImageResponse 지원) */}
            <div className="form-section">
              <h3 className="section-title">프로필 이미지</h3>
              <p className="section-description">
                프로필 이미지를 업로드하세요. (최대 10개, 각각 5MB 이하, JPG/PNG 형식)
              </p>

              <div className="image-upload-section">
                {/* 숨겨진 파일 input */}
                <input
                    type="file"
                    id="imageUpload"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    style={{display: 'none'}}
                />

                {/* 이미지 관리 버튼들 */}
                <div className="image-control-buttons">
                  <label htmlFor="imageUpload" className="image-upload-button">
                    📷 새 이미지 추가
                  </label>

                  <button
                      type="button"
                      onClick={restoreAllExistingImages}
                      className="image-control-button restore-button"
                      disabled={existingImages.length === 0}
                  >
                    🔄 기존 이미지 모두 복원
                  </button>

                  <button
                      type="button"
                      onClick={removeAllImages}
                      className="image-control-button remove-all-button"
                  >
                    🗑️ 모든 이미지 삭제
                  </button>
                </div>

                {/* 이미지 현황 요약 */}
                <div className="image-summary">
                  <div className="summary-stats">
                    <span className="stat-item">
                      <strong>기존 이미지:</strong> {keepImageIds.length}/{existingImages.length}개
                    </span>
                    <span className="stat-item">
                      <strong>새 이미지:</strong> {selectedImages.length}개
                    </span>
                    <span className="stat-item total">
                      <strong>총 이미지:</strong> {keepImageIds.length + selectedImages.length}개
                    </span>
                  </div>

                  {(keepImageIds.length + selectedImages.length > 10) && (
                      <div className="warning-message">
                        ⚠️ 이미지는 최대 10개까지만 업로드할 수 있습니다!
                      </div>
                  )}
                </div>

                {/* 기존 이미지 관리 섹션 */}
                {existingImages.length > 0 && (
                    <div className="existing-images-section">
                      <h4 className="subsection-title">
                        기존 이미지 ({existingImages.length}개)
                      </h4>
                      <div className="image-grid">
                        {existingImages.map((image, index) => (
                            <div key={`existing-${image.id}`} className="image-item existing">
                              <div className="image-wrapper">
                                <img
                                    src={image.url}
                                    alt={`기존 이미지 ${index + 1}`}
                                    onError={(e) => {
                                      console.error('이미지 로드 실패:', image.url);
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDroZzrk5zsmKTrpJw8L3RleHQ+PC9zdmc+';
                                    }}
                                />

                                {/* 이미지 상태 표시 */}
                                <div className="image-status">
                                  <span className="image-id-badge">ID: {image.id}</span>
                                  {keepImageIds.includes(image.id) ? (
                                      <span className="status-badge keep">유지</span>
                                  ) : (
                                      <span className="status-badge remove">삭제 예정</span>
                                  )}
                                </div>

                                {/* 이미지 제어 버튼 */}
                                <div className="image-controls">
                                  {keepImageIds.includes(image.id) ? (
                                      <button
                                          type="button"
                                          className="control-button remove-button"
                                          onClick={() => handleRemoveExistingImage(image.id)}
                                          title="이 이미지 삭제"
                                      >
                                        ✕
                                      </button>
                                  ) : (
                                      <button
                                          type="button"
                                          className="control-button restore-button"
                                          onClick={() => setKeepImageIds(prev => [...prev, image.id])}
                                          title="이 이미지 복원"
                                      >
                                        ↩️
                                      </button>
                                  )}
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* 새 이미지 섹션 */}
                {selectedImages.length > 0 && (
                    <div className="new-images-section">
                      <h4 className="subsection-title">
                        새로 추가할 이미지 ({selectedImages.length}개)
                      </h4>
                      <div className="image-grid">
                        {selectedImages.map((file, index) => (
                            <div key={`new-${index}`} className="image-item new">
                              <div className="image-wrapper">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`새 이미지 ${index + 1}`}
                                />

                                {/* 새 이미지 표시 */}
                                <div className="image-status">
                                  <span className="status-badge new">신규</span>
                                </div>

                                {/* 파일명 표시 */}
                                <div className="image-filename" title={file.name}>
                                  {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                                </div>

                                {/* 제거 버튼 */}
                                <div className="image-controls">
                                  <button
                                      type="button"
                                      className="control-button remove-button"
                                      onClick={() => handleRemoveNewImage(index)}
                                      title="이 이미지 제거"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* 이미지가 없을 때 안내 */}
                {existingImages.length === 0 && selectedImages.length === 0 && (
                    <div className="no-images-placeholder">
                      <div className="placeholder-content">
                        <div className="placeholder-icon">📷</div>
                        <p className="placeholder-text">등록된 프로필 이미지가 없습니다.</p>
                        <p className="placeholder-subtext">위의 "새 이미지 추가" 버튼을 클릭하여 이미지를 업로드하세요.</p>
                      </div>
                    </div>
                )}

                {/* 업로드 안내 */}
                <div className="upload-guidelines">
                  <h5>📋 이미지 업로드 안내</h5>
                  <ul className="guidelines-list">
                    <li>지원 형식: JPG, PNG, GIF</li>
                    <li>최대 파일 크기: 5MB</li>
                    <li>최대 이미지 개수: 10개</li>
                    <li>기존 이미지를 삭제하고 새로운 이미지를 추가할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="form-actions">
              <button
                  type="button"
                  onClick={goBack}
                  className="cancel-button"
                  disabled={saving}
              >
                취소
              </button>
              <button
                  type="button"
                  onClick={handleSubmit}
                  className="submit-button"
                  disabled={saving}
              >
                {saving ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      저장 중...
                    </>
                ) : (
                    '수정 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfileEditPage;