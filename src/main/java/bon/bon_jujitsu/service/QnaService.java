package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.*;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.PasswordRequest;
import bon.bon_jujitsu.dto.request.QnaRequest;
import bon.bon_jujitsu.dto.response.QnAResponse;
import bon.bon_jujitsu.dto.response.SkillResponse;
import bon.bon_jujitsu.dto.update.QnAUpdate;
import bon.bon_jujitsu.repository.CommentRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.QnARepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class QnaService {

    private final QnARepository qnaRepository;
    private final PostImageService postImageService;
    private final PostImageRepository postImageRepository;
    private final QnARepository qnARepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CommentRepository commentRepository;

    public void createQna(QnaRequest request, Long userId, List<MultipartFile> images) {
        QnA.QnABuilder qnaBuilder = QnA.builder()
                .title(request.title())
                .content(request.content());

        // 회원/비회원 구분하여 처리
        if (request.isGuestPost()) {
            // 비회원 작성
            if (userId != null) {
                throw new IllegalArgumentException("로그인된 상태에서는 비회원 작성을 할 수 없습니다.");
            }

            qnaBuilder
                    .guestName(request.guestName())
                    .guestPassword(passwordEncoder.encode(request.guestPassword()));
        } else {
            // 회원 작성
            if (userId == null) {
                throw new IllegalArgumentException("회원 작성시 로그인이 필요합니다.");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

            qnaBuilder.user(user);
        }

        QnA qna = qnaBuilder.build();
        qnaRepository.save(qna);

        postImageService.uploadImage(qna.getId(), PostType.QNA, images);
    }

    @Transactional(readOnly = true)
    public PageResponse<QnAResponse> getQnAs(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // User 정보를 함께 조회
        Page<QnA> qnaPage = qnaRepository.findAllWithUser(pageRequest);

        Page<QnAResponse> qnaResponses = qnaPage.map(qna -> {
            List<PostImage> images = postImageRepository.findByPostTypeAndPostId(PostType.QNA, qna.getId());
            // 댓글 존재 여부 확인
            boolean hasAnswer = commentRepository.existsByCommentTypeAndTargetId(CommentType.QNA, qna.getId());
            return QnAResponse.from(qna, images, hasAnswer);
        });

        return PageResponse.fromPage(qnaResponses);
    }

    @Transactional(readOnly = true)
    public QnAResponse getQnA(Long qnaId, HttpServletRequest request) {
        // User 정보를 함께 조회
        QnA qna = qnARepository.findByIdWithUser(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QNA를 찾을수 없습니다."));

        HttpSession session = request.getSession();
        String sessionKey = "viewed_QnA_" + qnaId;

        if (session.getAttribute(sessionKey) == null) {
            qna.increaseViewCount(); // 처음 본 경우에만 조회수 증가
            session.setAttribute(sessionKey, true);
            session.setMaxInactiveInterval(60 * 60); // 1시간 유지
        }

        List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.QNA, qna.getId());

        boolean hasAnswer = commentRepository.existsByCommentTypeAndTargetId(CommentType.QNA, qna.getId());

        return QnAResponse.from(qna, postImages, hasAnswer);
    }


    public void updateQnA(QnAUpdate update, Long userId, Long qnaId, List<MultipartFile> images, List<Long> keepImageIds) {
        QnA qna = qnaRepository.findById(qnaId)
            .orElseThrow(() -> new IllegalArgumentException("QnA를 찾을 수 없습니다."));

        // 관리자 권한 확인 (관리자면 모든 글 수정 가능)
        User user = null;
        boolean isAdmin = false;

        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
            isAdmin = user != null && user.isAdmin();
        }

        // 관리자가 아닌 경우에만 기존 권한 체크 수행
        if (!isAdmin) {
            if (qna.isGuestPost()) {
                // 비회원 글의 경우 - 이미 PostDetail에서 비밀번호 검증했으므로 패스
                // 추가 검증 없이 수정 허용
            } else {
                // 회원 글의 경우
                if (userId == null) {
                    throw new IllegalArgumentException("로그인이 필요합니다.");
                }
                if (!qna.getUser().getId().equals(userId)) {
                    throw new IllegalArgumentException("본인의 글만 수정할 수 있습니다.");
                }
            }
        }
        // 관리자는 위의 모든 체크를 스킵하고 바로 수정

        // 수정할 내용이 있을 때만 업데이트
        if (update != null && update.hasContentToUpdate()) {
            qna.update(
                update.title().orElse(qna.getTitle()),
                update.content().orElse(qna.getContent())
            );
        }

        postImageService.updateImages(qnaId, PostType.QNA, images, keepImageIds);
    }

    public void deleteQnA(Long qnaId, Long userId, String guestPassword) {
        QnA qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QnA를 찾을 수 없습니다."));

        // 관리자 권한 확인 (관리자면 모든 글 삭제 가능)
        User user = null;
        boolean isAdmin = false;

        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
            isAdmin = user != null && user.isAdmin();
        }

        // 관리자가 아닌 경우에만 기존 권한 체크 수행
        if (!isAdmin) {
            if (qna.isGuestPost()) {
                // 비회원 글 삭제
                if (userId != null) {
                    throw new IllegalArgumentException("비회원 작성글은 로그아웃 후 삭제해주세요.");
                }
                if (guestPassword == null || guestPassword.trim().isEmpty()) {
                    throw new IllegalArgumentException("비회원 삭제시 비밀번호가 필요합니다.");
                }
                if (!passwordEncoder.matches(guestPassword, qna.getGuestPassword())) {
                    throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
                }
            } else {
                // 회원 글 삭제
                if (userId == null) {
                    throw new IllegalArgumentException("로그인이 필요합니다.");
                }
                if (!qna.getUser().getId().equals(userId)) {
                    throw new IllegalArgumentException("본인의 글만 삭제할 수 있습니다.");
                }
            }
        }
        // 관리자는 위의 모든 체크를 스킵하고 바로 삭제

        // 소프트 삭제 실행
        qna.softDelete();
    }

    public boolean verifyGuestPassword(Long qnaId, PasswordRequest request) {
        try {
            // QnA 조회
            QnA qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 QnA입니다."));

            // 비회원 작성 게시물인지 확인
            if (qna.getGuestName() == null || qna.getGuestPassword() == null) {
                return false;
            }

            // 비밀번호 확인 (암호화된 비밀번호와 비교)
            return passwordEncoder.matches(request.guestPassword(), qna.getGuestPassword());

        } catch (Exception e) {
            log.error("비밀번호 확인 중 오류 발생: ", e);
            return false;
        }
    }
}
