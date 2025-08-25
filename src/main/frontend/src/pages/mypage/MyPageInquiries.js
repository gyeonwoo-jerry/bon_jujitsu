// pages/MyPageInquiries.js - 이메일 전용 간단 버전
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../components/MyPageHeader";
import emailjs from '@emailjs/browser';
import "../../styles/mypage.css";

const MyPageInquiries = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '일반문의',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // EmailJS 설정
    const SERVICE_ID = 'service_rkn1nzp';
    const TEMPLATE_ID = 'template_hi7e7lg';
    const PUBLIC_KEY = 'q746hI-1SPzKVRBU5';

    // 로그인한 사용자 정보 자동 입력
    useEffect(() => {
        const storedUserInfo = localStorage.getItem("userInfo");
        if (storedUserInfo) {
            try {
                const user = JSON.parse(storedUserInfo);
                setFormData(prev => ({
                    ...prev,
                    name: user.name || '',
                    email: user.email || ''
                }));
            } catch (error) {
                console.error("사용자 정보 파싱 오류:", error);
            }
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitSuccess(false);

        try {
            const templateParams = {
                from_name: formData.name,
                from_email: formData.email,
                phone: formData.phone,
                subject: formData.subject,
                category: formData.category,
                message: formData.message,
                reply_to: formData.email,
                timestamp: new Date().toLocaleString('ko-KR'),
                // 티켓 번호 생성 (간단한 추적용)
                ticket_id: 'TKT' + Date.now()
            };

            console.log('전송할 데이터:', templateParams);

            const response = await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );

            console.log('전송 성공:', response);
            setSubmitSuccess(true);

            // 성공 후 폼 초기화 (이름, 이메일 제외)
            setFormData(prev => ({
                ...prev,
                phone: '',
                subject: '',
                category: '일반문의',
                message: ''
            }));

        } catch (error) {
            console.error('이메일 전송 실패:', error);

            if (error.status === 400) {
                alert('잘못된 요청입니다. 입력 정보를 확인해주세요.');
            } else if (error.status === 401) {
                alert('인증에 실패했습니다. 설정을 확인해주세요.');
            } else {
                alert(`문의사항 전송에 실패했습니다: ${error.text || error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case '일반문의': return '💬';
            case '결제문의': return '💳';
            case '환불문의': return '💰';
            case '기술문의': return '🔧';
            case '시설문의': return '🏢';
            default: return '📝';
        }
    };

    return (
        <div className="mypage_main">
            <MyPageHeader />
            <div className="mypage_contents">
                <div className="page-title-section">
                    <h1 className="page-title">💬 1:1 문의</h1>
                    <p className="page-description">궁금한 사항이나 문의사항을 남겨주세요. 이메일로 직접 답변드립니다.</p>
                </div>

                <div className="inquiry-form-container">
                    {submitSuccess ? (
                        // 전송 성공 메시지
                        <div className="success-message">
                            <div className="success-icon">✅</div>
                            <h3>문의사항이 성공적으로 전송되었습니다!</h3>
                            <div className="success-details">
                                <p><strong>📧 답변 받을 이메일:</strong> {formData.email}</p>
                                <p><strong>⏰ 예상 답변 시간:</strong> 영업일 기준 24시간 이내</p>
                                <p><strong>📁 답변 확인:</strong> 이메일함을 확인해주세요</p>
                            </div>
                            <div className="success-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => setSubmitSuccess(false)}
                                >
                                    새 문의하기
                                </button>
                                <button
                                    className="btn-outline"
                                    onClick={() => navigate('/mypage')}
                                >
                                    마이페이지로
                                </button>
                            </div>
                        </div>
                    ) : (
                        // 문의 폼
                        <div className="form-card">
                            <div className="form-header">
                                <h3>💬 새로운 문의 작성</h3>
                                <p>문의하실 내용을 자세히 작성해주시면 더 빠르고 정확한 답변을 드릴 수 있습니다.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="inquiry-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">성명</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="form-input"
                                            placeholder="성명을 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">이메일</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="form-input"
                                            placeholder="답변받을 이메일을 입력하세요"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">연락처</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="연락처를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">문의 유형</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="form-select"
                                        >
                                            <option value="일반문의">💬 일반문의</option>
                                            <option value="결제문의">💳 결제문의</option>
                                            <option value="환불문의">💰 환불문의</option>
                                            <option value="기술문의">🔧 기술문의</option>
                                            <option value="시설문의">🏢 시설문의</option>
                                            <option value="기타">📝 기타</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">문의 제목</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        className="form-input"
                                        placeholder="문의 제목을 간단히 입력하세요"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">문의 내용</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={8}
                                        className="form-textarea"
                                        placeholder="문의하실 내용을 자세히 적어주세요.&#10;&#10;예시:&#10;- 언제 발생한 문제인지&#10;- 어떤 상황에서 발생했는지&#10;- 기대하시는 해결방안&#10;등을 포함해주시면 더 빠른 답변이 가능합니다."
                                    />
                                </div>

                                <div className="info-notice">
                                    <div className="notice-icon">📧</div>
                                    <div className="notice-content">
                                        <p><strong>이메일 문의 시스템 안내</strong></p>
                                        <ul>
                                            <li><strong>답변 방식:</strong> 입력하신 이메일로 직접 답변드립니다</li>
                                            <li><strong>답변 시간:</strong> 영업일 기준 24시간 이내</li>
                                            <li><strong>답변 확인:</strong> 이메일함(스팸함 포함)을 확인해주세요</li>
                                            <li><strong>추가 문의:</strong> 답변 이메일에 직접 회신하시면 됩니다</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
                                        className="btn-primary btn-lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-small"></span>
                                                전송중...
                                            </>
                                        ) : (
                                            <>
                                                <span>📧</span>
                                                문의하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyPageInquiries;