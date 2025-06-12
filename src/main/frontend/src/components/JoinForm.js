import React, { useState, useEffect } from 'react';
import API from '../utils/api';
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
    birthday: '',
    gender: '',
    branchIds: [],
    gral: 1,
    stripe: '',
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

    // 띠 색깔이 변경되면 급수를 초기화
    if (name === 'stripe') {
      setFormData(prev => ({
        ...prev,
        stripe: value,
        gral: '' // 급수 초기화
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }

    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 광역 지역 변경 핸들러
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
    if (!formData.memberId.trim()) newErrors.memberId = '아이디를 입력해주세요.';
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
    if (!formData.stripe) newErrors.stripe = '띠 색깔을 선택해주세요.';
    if (!formData.gral) newErrors.gral = '급수를 선택해주세요.';
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

      const { confirmPassword, ...requestData } = formData;
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
              <input
                  type="text"
                  id="memberId"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  className={`form-input ${errors.memberId ? 'error' : ''}`}
                  required
              />
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

        {/* 주소 */}
        <div className="form-section">
          <div>
            <label htmlFor="address" className="form-label">
              주소 <span className="required-asterisk">*</span>
            </label>
            <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`form-input ${errors.address ? 'error' : ''}`}
                required
            />
            {errors.address && <p className="error-message">{errors.address}</p>}
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

        {/* 띠 색깔과 급수 */}
        <div className="form-section">
          <div className="form-grid-2">
            <div>
              <label htmlFor="stripe" className="form-label">
                띠 색깔 <span className="required-asterisk">*</span>
              </label>
              <select
                  id="stripe"
                  name="stripe"
                  value={formData.stripe}
                  onChange={handleChange}
                  className={`form-select ${errors.stripe ? 'error' : ''}`}
                  required
              >
                <option value="">띠 색깔을 먼저 선택하세요</option>
                <option value="WHITE">화이트</option>
                <option value="BLUE">블루</option>
                <option value="PURPLE">퍼플</option>
                <option value="BROWN">브라운</option>
                <option value="BLACK">블랙</option>
              </select>
              {errors.stripe && <p className="error-message">{errors.stripe}</p>}
            </div>

            <div>
              <label htmlFor="gral" className="form-label">
                Gral <span className="required-asterisk">*</span>
              </label>
              <select
                  id="gral"
                  name="gral"
                  value={formData.gral}
                  onChange={handleChange}
                  className={`form-select ${errors.gral ? 'error' : ''}`}
                  disabled={!formData.stripe}
                  required
              >
                <option value="">급수를 선택하세요</option>
                {formData.stripe === 'WHITE' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </>
                )}
                {formData.stripe === 'BLUE' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </>
                )}
                {formData.stripe === 'PURPLE' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </>
                )}
                {formData.stripe === 'BROWN' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </>
                )}
                {formData.stripe === 'BLACK' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                    </>
                )}
              </select>
              {errors.gral && <p className="error-message">{errors.gral}</p>}
              {!formData.stripe && (
                  <p className="error-message">띠 색깔을 먼저 선택해주세요.</p>
              )}
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

        {/* SNS 정보 */}
        <div className="form-section">
          <div>
            <label className="sns-section-title">SNS 계정 (선택사항)</label>
            <div className="sns-grid">
              {[1, 2, 3, 4, 5].map(num => (
                  <input
                      key={num}
                      type="text"
                      name={`sns${num}`}
                      value={formData[`sns${num}`]}
                      onChange={handleChange}
                      placeholder={`SNS ${num}`}
                      className="form-input"
                  />
              ))}
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