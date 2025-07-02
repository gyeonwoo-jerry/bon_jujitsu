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

  // 3단계 지부 선택 상태 (JoinForm과 동일)
  const [areas, setAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // 로딩 상태
  const [areasLoading, setAreasLoading] = useState(false);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // 폼 데이터 상태 (Optional 형태에 맞게 수정)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNum: '',
    address: '',
    addressDetail: '', // 상세 주소 추가
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

  // 이미지 관련 상태
  const [selectedImages, setSelectedImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    loadUserProfile();
    loadAreas(); // 광역 지역 로드
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      console.log('프로필 정보 로딩 시작...');

      const response = await API.get('/users/profile');
      console.log('API 응답:', response);

      // API 응답에서 content 속성 사용
      if (response && response.data) {
        console.log('응답 데이터:', response.data);

        const user = response.data.success ? response.data.content : response.data;
        console.log('사용자 데이터:', user);

        if (user && typeof user === 'object') {
          setUserInfo(user);

          // 폼 데이터 초기화 - 안전한 접근
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phoneNum: user.phoneNum || '',
            address: user.address || '',
            addressDetail: user.addressDetail || '', // 상세 주소 초기화 추가
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

          // 기존 이미지 처리
          if (user.images && Array.isArray(user.images) && user.images.length > 0) {
            const imageIds = user.images.map((img, index) => {
              if (typeof img === 'object' && img.id) {
                return img.id;
              }
              return index; // fallback to index
            });

            setKeepImageIds(imageIds);
            setPreviewImages(user.images.map((img, index) => ({
              url: (typeof img === 'object') ? (img.imagePath || img.url) : img,
              isExisting: true,
              id: (typeof img === 'object') ? img.id : index
            })));
          }
        } else {
          throw new Error('사용자 데이터가 올바르지 않습니다.');
        }
      } else {
        throw new Error('API 응답이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      console.error('오류 상세:', error.response);

      const errorMessage = error.response?.data?.message || error.message || '프로필 정보를 불러오는데 실패했습니다.';
      showAlert('error', errorMessage);

      // 개발 환경에서 더 자세한 정보 표시
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error object:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 1단계: 광역 지역 목록 로드 (JoinForm과 동일)
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

  // 2단계: 세부 지역 로드 (JoinForm과 동일)
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

  // 3단계: 지점 로드 (JoinForm과 동일)
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
      console.error('에러 상세:', error.response?.data);
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
        level: 0 // 레벨 초기화
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 1 : value
      }));
    }
  };

  // 주소 선택 핸들러 (AddressSearch 컴포넌트에서 호출)
  const handleAddressSelect = (fullAddress, area) => {
    setFormData(prev => ({
      ...prev,
      address: fullAddress
    }));
  };

  // 광역 지역 변경 핸들러 (JoinForm과 동일)
  const handleAreaChange = (e) => {
    const area = e.target.value;
    console.log('🔍 선택된 광역 지역:', area);

    setSelectedArea(area);
    setSelectedRegion('');
    setRegions([]);
    setBranches([]);
    // 지부 선택 초기화하지 않음 (기존 선택 유지)

    if (area) {
      fetchRegionsByArea(area);
    }
  };

  // 세부 지역 변경 핸들러 (JoinForm과 동일)
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setBranches([]);
    // 지부 선택 초기화하지 않음 (기존 선택 유지)

    if (region && selectedArea) {
      fetchBranchesByRegion(selectedArea, region);
    }
  };

  // 지점 선택/해제 핸들러 (JoinForm과 동일)
  const handleBranchToggle = (branchId) => {
    setFormData(prev => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
          ? prev.branchIds.filter(id => id !== branchId)
          : [...prev.branchIds, branchId]
    }));
  };

  const handleBranchRemove = (branchId) => {
    console.log('=== 지부 삭제 시작 ===');
    console.log('🗑️ 삭제할 지부 ID:', branchId);
    console.log('🗑️ 삭제 전 branchIds:', formData.branchIds);

    setFormData(prev => {
      const newBranchIds = prev.branchIds.filter(id => id !== branchId);
      console.log('🗑️ 삭제 후 branchIds:', newBranchIds);
      return {
        ...prev,
        branchIds: newBranchIds
      };
    });
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (newFiles.length === 0) return;

    // 기존 selectedImages와 새로운 파일들 합치기
    const updatedSelectedImages = [...selectedImages, ...newFiles];
    setSelectedImages(updatedSelectedImages);

    // 새로운 미리보기 생성
    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      isExisting: false,
      file: file,
      name: file.name // 파일명 추가
    }));

    // 기존 미리보기와 새로운 미리보기 합치기
    const updatedPreviewImages = [...previewImages, ...newPreviews];
    setPreviewImages(updatedPreviewImages);

    // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';
  };

  const removeImage = (index) => {
    const imageToRemove = previewImages[index];

    if (imageToRemove.isExisting) {
      // 기존 이미지인 경우 keepImageIds에서 제거
      if (imageToRemove.id !== null && imageToRemove.id !== undefined) {
        setKeepImageIds(prev => prev.filter(id => id !== imageToRemove.id));
      } else {
        // ID가 없는 경우 인덱스 기반으로 제거
        const existingIndex = previewImages.slice(0, index).filter(img => img.isExisting).length;
        setKeepImageIds(prev => prev.filter((_, i) => i !== existingIndex));
      }
    } else {
      // 새로 추가된 이미지인 경우 selectedImages에서 제거
      const newImageIndex = previewImages.slice(0, index).filter(img => !img.isExisting).length;
      setSelectedImages(prev => prev.filter((_, i) => i !== newImageIndex));

      // URL 해제 (메모리 누수 방지)
      URL.revokeObjectURL(imageToRemove.url);
    }

    // previewImages에서 제거
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // 모든 이미지 삭제 핸들러 추가
  const removeAllImages = () => {
    // 새로 추가된 이미지들의 URL 해제
    previewImages.forEach(preview => {
      if (!preview.isExisting) {
        URL.revokeObjectURL(preview.url);
      }
    });

    // 모든 상태 초기화
    setSelectedImages([]);
    setKeepImageIds([]);
    setPreviewImages([]);

    // 파일 input도 초기화
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

// 기존 이미지만 삭제하는 핸들러 추가
  const removeAllExistingImages = () => {
    // 기존 이미지들만 필터링해서 제거
    const newPreviewImages = previewImages.filter(img => !img.isExisting);
    setPreviewImages(newPreviewImages);
    setKeepImageIds([]);
  };

/// 새로 추가된 이미지만 삭제하는 핸들러 추가
  const removeAllNewImages = () => {
    // 새로 추가된 이미지들의 URL 해제
    previewImages.forEach(preview => {
      if (!preview.isExisting) {
        URL.revokeObjectURL(preview.url);
      }
    });

    // 기존 이미지들만 남기기
    const existingPreviewImages = previewImages.filter(img => img.isExisting);
    setPreviewImages(existingPreviewImages);
    setSelectedImages([]);

    // 파일 input 초기화
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
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

    if (formData.password && formData.password.length < 8) {
      showAlert('error', '비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    if (!formData.branchIds || formData.branchIds.length === 0) {
      showAlert('error', '최소 하나의 지부를 선택해주세요.');
      return false;
    }

    return true;
  };

  // ProfileEditPage.js의 handleSubmit 함수를 다음과 같이 수정하세요:

  // ProfileEditPage.js의 handleSubmit 함수 수정 부분

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      console.log('프로필 수정 시작...');

      // FormData 생성
      const formDataToSend = new FormData();

      // ProfileUpdate 데이터 객체 생성 (Optional 제거됨)
      const updateData = {};

      // 기본 정보 필드들 (Optional 방식 유지)
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
      if (formData.level && formData.level >= 0) updateData.level = formData.level;
      if (formData.stripe) updateData.stripe = formData.stripe;
      if (formData.sns1?.trim()) updateData.sns1 = formData.sns1.trim();
      if (formData.sns2?.trim()) updateData.sns2 = formData.sns2.trim();
      if (formData.sns3?.trim()) updateData.sns3 = formData.sns3.trim();
      if (formData.sns4?.trim()) updateData.sns4 = formData.sns4.trim();
      if (formData.sns5?.trim()) updateData.sns5 = formData.sns5.trim();

      // 🔄 지부 변경사항 계산 (백엔드 변경에 맞춰 수정)
      const currentIds = currentBranches.map(cb => cb.branchId); // 현재 소속 지부들
      const newIds = formData.branchIds; // 새로 선택된 지부들

      // 추가할 지부들: 새로 선택된 것 중 현재 소속되지 않은 것들
      const branchesToAdd = newIds.filter(id => !currentIds.includes(id));

      // 제거할 지부들: 현재 소속된 것 중 새로 선택되지 않은 것들
      const branchesToRemove = currentIds.filter(id => !newIds.includes(id));

      // 지부 변경사항 - Optional 제거, 빈 배열도 포함
      // null 대신 빈 배열로 설정 (백엔드에서 null 체크하므로)
      updateData.branchesToAdd = branchesToAdd.length > 0 ? branchesToAdd : null;
      updateData.branchesToRemove = branchesToRemove.length > 0 ? branchesToRemove : null;

      console.log('🔍 현재 지부들:', currentIds);
      console.log('🔍 새로 선택된 지부들:', newIds);
      console.log('🔍 추가할 지부들:', branchesToAdd);
      console.log('🔍 제거할 지부들:', branchesToRemove);

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

      // FormData 내용 디버깅
      console.log('🔍 FormData 내용:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof Blob) {
          // Blob인 경우 텍스트로 읽어서 출력
          const text = await value.text();
          console.log(`${key}:`, text);
        } else {
          console.log(`${key}:`, value);
        }
      }

      // API 호출 (multipart/form-data)
      const response = await API.patch('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('🔍 서버 응답:', response);

      // 응답 처리
      const isSuccess = response.data?.success !== false;

      if (isSuccess) {
        // 🎯 즉시 알럿 표시하고 확인을 누르면 마이페이지로 이동
        const userConfirmed = window.confirm('회원정보 수정이 완료되었습니다!\n\n확인을 누르면 마이페이지로 돌아갑니다.');

        if (userConfirmed) {
          window.location.href = '/mypage';
        }
        // 사용자가 취소를 눌렀을 경우 현재 페이지에 그대로 남아있음

      } else {
        throw new Error(response.data?.message || '프로필 수정 실패');
      }

    } catch (error) {
      console.error('프로필 수정 오류:', error);
      console.error('오류 상세:', error.response);

      let errorMessage = '프로필 수정 중 오류가 발생했습니다.';

      // 주소 중복 에러 처리
      if (error.response?.data?.message?.includes('address') ||
          error.response?.data?.message?.includes('중복') ||
          error.response?.data?.message?.includes('Duplicate')) {
        errorMessage = '입력하신 주소가 이미 사용 중입니다. 다른 주소를 입력해주세요.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // 오류 시에도 즉시 알럿 표시
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

  // 현재 소속 지부 정보 (userInfo에서)
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
                  <p className="input-help-text">* 주소를 변경하시려면 주소 검색 버튼을
                    클릭하세요.</p>
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
                <div className="form-group">
                  {/* 빈 공간 */}
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

            {/* 3단계 지부 선택 섹션 (JoinForm과 동일) */}
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
                          <span
                              className="loading-text">세부 지역 목록을 불러오는 중...</span>
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
                              <option key={region}
                                      value={region}>{region}</option>
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
                                    checked={formData.branchIds.includes(
                                        branch.id)}
                                    onChange={() => handleBranchToggle(
                                        branch.id)}
                                    className="branch-card-checkbox"
                                />
                                <div className="branch-card-content">
                                  <div className="branch-name">
                                    {branch.area} {branch.region}점
                                  </div>
                                  <div
                                      className="branch-address">{branch.address}</div>
                                  {branch.content && (
                                      <div
                                          className="branch-description">{branch.content}</div>
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
                            {selectedBranches.map(
                                branch => `${branch.area} ${branch.region}점`).join(
                                ', ')}
                          </div>
                        </div>
                    )}
                  </div>
              )}

              {/* 현재 선택된 모든 지부 표시 - 간단 수정 버전 */}
              {formData.branchIds.length > 0 && (
                  <div className="form-section">
                    <label className="step-label">선택된 지부 목록
                      ({formData.branchIds.length}개)</label>
                    <div className="selected-all-branches">
                      {formData.branchIds.map(branchId => {
                        const branch = branches.find(b => b.id === branchId);
                        const currentBranch = currentBranches.find(
                            cb => cb.branchId === branchId);

                        const displayName = branch
                            ? `${branch.area} ${branch.region}점`
                            : (currentBranch ? currentBranch.region
                                : `지부 ID: ${branchId}`);

                        return (
                            <div key={branchId} className="selected-branch-tag">
                              <span
                                  className="branch-tag-name">{displayName}</span>
                              <button
                                  type="button"
                                  onClick={() => handleBranchRemove(branchId)}
                                  className="branch-tag-remove"
                                  title="제거"
                                  style={{
                                    marginLeft: '8px',
                                    padding: '2px 6px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                              >
                                ✕
                              </button>
                            </div>
                        );
                      })}
                    </div>

                    {/* 실시간 상태 표시 */}
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      background: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>🔍 현재 상태:</strong><br/>
                      - 선택된 지부 IDs: {JSON.stringify(formData.branchIds)}<br/>
                      - 원래 지부 IDs: {JSON.stringify(
                        currentBranches.map(cb => cb.branchId))}<br/>
                      - 변경 여부: {JSON.stringify(formData.branchIds)
                    !== JSON.stringify(currentBranches.map(cb => cb.branchId))
                        ? '✅ 변경됨' : '❌ 변경 안됨'}
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

            {/* 이미지 업로드 섹션 */}
            <div className="form-section">
              <h3 className="section-title">프로필 이미지</h3>
              <p className="section-description">
                프로필 이미지를 업로드하세요. (최대 5MB, JPG/PNG 형식)
              </p>

              <div className="image-upload-section">
                <input
                    type="file"
                    id="imageUpload"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                    style={{display: 'none'}}
                />
                <label htmlFor="imageUpload" className="image-upload-button">
                  📷 이미지 추가하기
                </label>

                {/* 이미지 요약 정보 */}
                {previewImages.length > 0 && (
                    <div className="image-summary">
          <span className="summary-text">
            총 {previewImages.length}개 이미지
            (기존: {previewImages.filter(img => img.isExisting).length}개,
             새로 추가: {previewImages.filter(img => !img.isExisting).length}개)
          </span>
                    </div>
                )}

                {/* 이미지 미리보기 그리드 */}
                {previewImages.length > 0 && (
                    <div className="image-preview-grid">
                      {previewImages.map((image, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={image.url} alt={`미리보기 ${index + 1}`}/>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="remove-image-button"
                                title="이미지 삭제"
                            >
                              ✕
                            </button>
                            {image.isExisting && (
                                <span className="existing-image-badge">기존</span>
                            )}
                            {!image.isExisting && (
                                <span className="new-image-badge">새 이미지</span>
                            )}
                            {image.name && (
                                <div className="image-name-overlay"
                                     title={image.name}>
                                  {image.name}
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}

                {/* 추가 업로드 안내 */}
                {previewImages.length > 0 && (
                    <div className="upload-help">
                      <p className="help-text">
                        💡 더 많은 이미지를 추가하려면 위의 "이미지 추가하기" 버튼을 다시 클릭하세요.
                      </p>
                    </div>
                )}
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