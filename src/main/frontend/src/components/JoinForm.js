import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import AddressSearch from '../components/admin/AddressSearch';
import '../styles/JoinForm.css';

function JoinForm() {
  const [formData, setFormData] = useState({
    name: '',
    memberId: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNum: '',
    address: '',
    addressDetail: '', // 상세 주소 추가
    birthday: '',
    gender: '',
    branchIds: [],
    level: 0, // gral 대신 level 사용, 기본값 0
    stripe: 'WHITE', // 기본값 설정
    sns1: '',
    sns2: '',
    sns3: '',
    sns4: '',
    sns5: ''
  });

  // 3단계 지점 선택 상태
  const [areas, setAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // 로딩 상태
  const [areasLoading, setAreasLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // 기타 상태
  const [selectedImages, setSelectedImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 아이디 중복검사 관련 상태
  const [memberIdCheckStatus, setMemberIdCheckStatus] = useState(''); // 'checking', 'available', 'unavailable', ''
  const [isCheckingMemberId, setIsCheckingMemberId] = useState(false);

  // 1단계: 광역 지역 목록 로드
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setAreasLoading(true);
        const response = await API.get('/branch/areas');
        console.log('🔍 API 응답:', response.data);
        setAreas(response.data.content || []);
      } catch (error) {
        console.error('광역 지역 로드 실패:', error);
        setErrors(prev => ({ ...prev, area: '광역 지역을 불러오는데 실패했습니다.' }));
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
  }, []);

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
      setErrors(prev => ({ ...prev, region: '세부 지역을 불러오는데 실패했습니다.' }));
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
      console.error('에러 상세:', error.response?.data);
      setErrors(prev => ({ ...prev, branches: '지점 정보를 불러오는데 실패했습니다.' }));
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // 일반 폼 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // 아이디가 변경되면 중복검사 상태 초기화
    if (name === 'memberId') {
      setMemberIdCheckStatus('');
    }

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
        [name]: type === 'number' ? parseInt(value) || 1 : value // 최소값 1로 보장
      }));
    }

    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 주소 선택 핸들러 (AddressSearch 컴포넌트에서 호출)
  const handleAddressSelect = (fullAddress, area) => {
    setFormData(prev => ({
      ...prev,
      address: fullAddress
    }));

    // 주소 관련 에러 메시지 초기화
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  // 아이디 중복검사 함수
  const checkMemberIdDuplicate = async () => {
    const memberId = formData.memberId.trim();

    if (!memberId) {
      alert('아이디를 입력해주세요.');
      return;
    }

    if (memberId.length < 4) {
      alert('아이디는 4자리 이상 입력해주세요.');
      return;
    }

    try {
      setIsCheckingMemberId(true);
      setMemberIdCheckStatus('checking');

      const response = await API.get(`/users/check-member-id?memberId=${encodeURIComponent(memberId)}`);

      if (response.data.success) {
        if (response.data.content.available) {
          setMemberIdCheckStatus('available');
          alert('사용 가능한 아이디입니다.');
        } else {
          setMemberIdCheckStatus('unavailable');
          alert('이미 사용중인 아이디입니다.');
        }
      } else {
        alert('중복검사 중 오류가 발생했습니다.');
        setMemberIdCheckStatus('');
      }
    } catch (error) {
      console.error('아이디 중복검사 오류:', error);

      // 404 오류인 경우 사용 가능한 아이디로 처리 (백엔드에서 존재하지 않는 아이디일 때 404를 반환할 수 있음)
      if (error.response?.status === 404) {
        setMemberIdCheckStatus('available');
        alert('사용 가능한 아이디입니다.');
      } else {
        alert('중복검사 중 오류가 발생했습니다.');
        setMemberIdCheckStatus('');
      }
    } finally {
      setIsCheckingMemberId(false);
    }
  };

  const handleAreaChange = (e) => {
    const area = e.target.value;
    console.log('🔍 선택된 광역 지역:', area);

    setSelectedArea(area);
    setSelectedRegion('');
    setRegions([]);
    setBranches([]);
    setFormData(prev => ({ ...prev, branchIds: [] }));

    if (area) {
      fetchRegionsByArea(area);
    }
  };

  // 세부 지역 변경 핸들러
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setBranches([]);
    setFormData(prev => ({ ...prev, branchIds: [] }));

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

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!formData.memberId.trim()) {
      newErrors.memberId = '아이디를 입력해주세요.';
    } else if (memberIdCheckStatus !== 'available') {
      newErrors.memberId = '아이디 중복검사를 완료해주세요.';
    }

    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    const phoneRegex = /^(01[0|1|6|7|8|9])\d{7,8}$/;
    if (!formData.phoneNum.trim()) {
      newErrors.phoneNum = '휴대전화 번호를 입력해주세요.';
    } else if (!phoneRegex.test(formData.phoneNum) || !/^\d+$/.test(formData.phoneNum)) {
      newErrors.phoneNum = '휴대전화 번호는 숫자만 입력하며, 010으로 시작하는 10~11자리여야 합니다.';
    }

    if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요.';
    if (!formData.birthday) newErrors.birthday = '생년월일을 입력해주세요.';
    if (!formData.gender) newErrors.gender = '성별을 선택해주세요.';

    if (formData.branchIds.length === 0) newErrors.branchIds = '최소 하나의 지점을 선택해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // confirmPassword 제거하고 level이 최소 1인지 확인
      const { confirmPassword, addressDetail, ...requestData } = formData;

      // 주소와 상세주소 합치기
      const fullAddress = addressDetail
          ? `${formData.address} ${addressDetail}`
          : formData.address;

      requestData.address = fullAddress;

      // level이 0이거나 없으면 1로 설정
      if (!requestData.level || requestData.level < 1) {
        requestData.level = 1;
      }

      console.log('전송할 데이터:', requestData); // 디버깅용

      formDataToSend.append('request', new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      }));

      selectedImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await API.post('/users/signup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert('회원가입이 완료되었습니다!');
        window.location.href = '/';
      } else {
        alert(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      console.error('오류 응답:', error.response?.data); // 추가 디버깅
      const errorMessage = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBranches = branches.filter(branch =>
      formData.branchIds.includes(branch.id)
  );

  return (
      <div className="join-form-container">
        <h2 className="join-form-title">본 주짓수 회원가입</h2>

        {/* 기본 정보 */}
        <div className="form-section">
          <div className="form-grid-2">
            <div>
              <label htmlFor="name" className="form-label">
                이름 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  required
              />
              {errors.name && <p className="error-message">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="memberId" className="form-label">
                아이디 <span className="required-asterisk">*</span>
              </label>
              <div className="member-id-container">
                <input
                    type="text"
                    id="memberId"
                    name="memberId"
                    value={formData.memberId}
                    onChange={handleChange}
                    className={`form-input member-id-input ${errors.memberId ? 'error' : ''} ${
                        memberIdCheckStatus === 'available' ? 'available' :
                            memberIdCheckStatus === 'unavailable' ? 'unavailable' : ''
                    }`}
                    placeholder="4자리 이상 입력해주세요"
                    required
                />
                <button
                    type="button"
                    onClick={checkMemberIdDuplicate}
                    disabled={isCheckingMemberId || !formData.memberId.trim()}
                    className="duplicate-check-btn"
                >
                  {isCheckingMemberId ? '확인중...' : '중복검사'}
                </button>
              </div>

              {/* 중복검사 결과 메시지 */}
              {memberIdCheckStatus === 'available' && (
                  <p className="success-message">✓ 사용 가능한 아이디입니다.</p>
              )}
              {memberIdCheckStatus === 'unavailable' && (
                  <p className="error-message">✗ 이미 사용중인 아이디입니다.</p>
              )}
              {memberIdCheckStatus === 'checking' && (
                  <p className="info-message">중복검사 진행중...</p>
              )}

              {errors.memberId && <p className="error-message">{errors.memberId}</p>}
            </div>
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="form-section">
          <div className="form-grid-2">
            <div>
              <label htmlFor="password" className="form-label">
                비밀번호 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  required
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                비밀번호 확인 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  required
              />
              {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="form-section">
          <div className="form-grid-2">
            <div>
              <label htmlFor="email" className="form-label">
                이메일 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  required
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phoneNum" className="form-label">
                휴대전화 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="tel"
                  id="phoneNum"
                  name="phoneNum"
                  value={formData.phoneNum}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className={`form-input ${errors.phoneNum ? 'error' : ''}`}
                  required
              />
              {errors.phoneNum && <p className="error-message">{errors.phoneNum}</p>}
            </div>
          </div>
        </div>

        {/* 주소 - AddressSearch 컴포넌트 사용 */}
        <div className="form-section">
          <div>
            <label htmlFor="address" className="form-label">
              주소 <span className="required-asterisk">*</span>
            </label>
            <AddressSearch
                onAddressSelect={handleAddressSelect}
                selectedAddress={formData.address}
            />
            {errors.address && <p className="error-message">{errors.address}</p>}
            <p className="input-help-text">* 주소를 등록하시려면 주소 검색 버튼을 클릭하세요.</p>
          </div>
        </div>

        {/* 상세 주소 */}
        <div className="form-section">
          <div>
            <label htmlFor="addressDetail" className="form-label">
              상세 주소
            </label>
            <input
                type="text"
                id="addressDetail"
                name="addressDetail"
                value={formData.addressDetail}
                onChange={handleChange}
                className="form-input"
                placeholder="상세 주소를 입력하세요 (건물명, 동/호수 등)"
            />
          </div>
        </div>

        {/* 개인정보 */}
        <div className="form-section">
          <div className="form-grid-3">
            <div>
              <label htmlFor="birthday" className="form-label">
                생년월일 <span className="required-asterisk">*</span>
              </label>
              <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={`form-input ${errors.birthday ? 'error' : ''}`}
                  required
              />
              {errors.birthday && <p className="error-message">{errors.birthday}</p>}
            </div>

            <div>
              <label htmlFor="gender" className="form-label">
                성별 <span className="required-asterisk">*</span>
              </label>
              <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`form-select ${errors.gender ? 'error' : ''}`}
                  required
              >
                <option value="">선택하세요</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
              {errors.gender && <p className="error-message">{errors.gender}</p>}
            </div>

            <div>
              {/* 빈 공간 */}
            </div>
          </div>
        </div>

        {/* 띠 색깔과 레벨 (선택사항) */}
        <div className="form-section">
          <div className="form-grid-2">
            <div>
              <label htmlFor="stripe" className="form-label">
                띠 색깔 (선택사항)
              </label>
              <select
                  id="stripe"
                  name="stripe"
                  value={formData.stripe}
                  onChange={handleChange}
                  className="form-select"
              >
                <option value="WHITE">화이트</option>
                <option value="BLUE">블루</option>
                <option value="PURPLE">퍼플</option>
                <option value="BROWN">브라운</option>
                <option value="BLACK">블랙</option>
              </select>
            </div>

            <div>
              <label htmlFor="level" className="form-label">
                레벨 (선택사항)
              </label>
              <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="form-select"
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

        {/* 3단계 지점 선택 */}
        <div className="branch-selection-section">
          <h3 className="branch-section-title">지점 선택</h3>

          {/* 1단계: 광역 지역 */}
          <div className="form-section">
            <label className="step-label">
              1단계: 광역 지역 선택 <span className="required-asterisk">*</span>
            </label>
            {areasLoading ? (
                <div className="loading-container">
                  <span className="loading-text">광역 지역 목록을 불러오는 중...</span>
                </div>
            ) : (
                <select
                    value={selectedArea}
                    onChange={handleAreaChange}
                    className="form-select"
                >
                  <option value="">광역 지역을 선택하세요</option>
                  {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                  ))}
                </select>
            )}
            {errors.area && <p className="error-message">{errors.area}</p>}
          </div>

          {/* 2단계: 세부 지역 */}
          {selectedArea && (
              <div className="form-section">
                <label className="step-label">
                  2단계: 세부 지역 선택 <span className="required-asterisk">*</span>
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
                        className="form-select"
                    >
                      <option value="">세부 지역을 선택하세요</option>
                      {regions.map(region => (
                          <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                )}
                {errors.region && <p className="error-message">{errors.region}</p>}
              </div>
          )}

          {/* 3단계: 지점 선택 */}
          {selectedRegion && (
              <div className="form-section">
                <label className="step-label">
                  3단계: {selectedArea} {selectedRegion} 지점 선택 <span className="required-asterisk">*</span>
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

                {errors.branches && <p className="error-message">{errors.branches}</p>}
              </div>
          )}

          {errors.branchIds && <p className="error-message">{errors.branchIds}</p>}
        </div>

        // JoinForm.js에서 SNS 섹션 부분을 다음과 같이 교체하세요:

        {/* SNS 정보 - 개선된 버전 */}
        <div className="form-section">
          <div className="sns-section">
            <label className="sns-section-title">SNS 계정 (선택사항)</label>
            <div className="sns-grid">
              <div className="sns-input-container">
                <label className="sns-input-label">
                  <span className="sns-icon facebook"></span>
                  Facebook
                </label>
                <input
                    type="text"
                    name="sns1"
                    value={formData.sns1}
                    onChange={handleChange}
                    placeholder="Facebook 프로필 URL 또는 사용자명"
                    className="sns-input"
                />
              </div>

              <div className="sns-input-container">
                <label className="sns-input-label">
                  <span className="sns-icon instagram"></span>
                  Instagram
                </label>
                <input
                    type="text"
                    name="sns2"
                    value={formData.sns2}
                    onChange={handleChange}
                    placeholder="Instagram 사용자명 (@username)"
                    className="sns-input"
                />
              </div>

              <div className="sns-input-container">
                <label className="sns-input-label">
                  <span className="sns-icon blog"></span>
                  Blog
                </label>
                <input
                    type="text"
                    name="sns3"
                    value={formData.sns3}
                    onChange={handleChange}
                    placeholder="블로그 주소 (네이버, 티스토리 등)"
                    className="sns-input"
                />
              </div>

              <div className="sns-input-container">
                <label className="sns-input-label">
                  <span className="sns-icon cafe"></span>
                  Cafe
                </label>
                <input
                    type="text"
                    name="sns4"
                    value={formData.sns4}
                    onChange={handleChange}
                    placeholder="카페 활동명 (네이버 카페 등)"
                    className="sns-input"
                />
              </div>

              <div className="sns-input-container">
                <label className="sns-input-label">
                  <span className="sns-icon youtube"></span>
                  YouTube
                </label>
                <input
                    type="text"
                    name="sns5"
                    value={formData.sns5}
                    onChange={handleChange}
                    placeholder="YouTube 채널명 또는 URL"
                    className="sns-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="form-section">
          <div>
            <label htmlFor="images" className="form-label">
              프로필 이미지 (선택사항)
            </label>
            <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
            />
            {selectedImages.length > 0 && (
                <p className="file-count">
                  {selectedImages.length}개 파일 선택됨
                </p>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="form-section">
          <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || areasLoading}
              className="submit-button primary"
          >
            {isSubmitting ? '가입 중...' : areasLoading ? '준비 중...' : '회원가입'}
          </button>
        </div>
      </div>
  );
}

export default JoinForm;