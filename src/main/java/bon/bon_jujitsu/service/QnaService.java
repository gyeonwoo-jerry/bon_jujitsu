package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.QnA;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.PasswordRequest;
import bon.bon_jujitsu.dto.request.QnaRequest;
import bon.bon_jujitsu.dto.response.QnAResponse;
import bon.bon_jujitsu.dto.update.QnAUpdate;
import bon.bon_jujitsu.repository.CommentRepository;
import bon.bon_jujitsu.repository.PostMediaRepository;
import bon.bon_jujitsu.repository.QnARepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class QnaService {

    private final QnARepository qnaRepository;
    private final PostMediaService postMediaService;
    private final PostMediaRepository postMediaRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CommentRepository commentRepository;

    private static final String VIEWED_QNA_PREFIX = "viewed_QnA_";
    private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

    /**
     * QnA 생성
     */
    @CacheEvict(value = "qnas", allEntries = true)
    public void createQna(QnaRequest request, Long userId, List<MultipartFile> files) {
        QnA.QnABuilder qnaBuilder = QnA.builder()
            .title(request.title())
            .content(request.content());

        // 회원/비회원 구분하여 처리
        if (request.isGuestPost()) {
            validateGuestPost(userId, request);
            qnaBuilder
                .guestName(request.guestName())
                .guestPassword(passwordEncoder.encode(request.guestPassword()));
        } else {
            User user = findUserById(userId);
            qnaBuilder.user(user);
        }

        QnA qna = qnaBuilder.build();
        qnaRepository.save(qna);

        if (files != null && !files.isEmpty()) {
            postMediaService.uploadMedia(qna.getId(), PostType.QNA, files);
        }
    }

    /**
     * QnA 목록 조회 (N+1 문제 해결)
     */
    @Transactional(readOnly = true)
    public PageResponse<QnAResponse> getQnAs(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // N+1 문제 방지를 위한 fetch join 사용
        Page<QnA> qnaPage = qnaRepository.findAllWithUser(pageRequest);

        if (qnaPage.isEmpty()) {
            return PageResponse.fromPage(qnaPage.map(qna -> null));
        }

        // 이미지만 별도로 배치 로딩 (OneToMany 관계는 별도 처리가 효율적)
        Set<Long> qnaIds = qnaPage.getContent().stream()
            .map(QnA::getId)
            .collect(Collectors.toSet());

        Map<Long, List<PostMedia>> fileMap = loadFilesInBatch(qnaIds);
        Set<Long> answeredQnaIds = loadAnsweredQnaIdsInBatch(qnaIds);

        // QnAResponse 생성
        return PageResponse.fromPage(qnaPage.map(qna -> {
            List<PostMedia> files = fileMap.getOrDefault(qna.getId(), Collections.emptyList());
            boolean hasAnswer = answeredQnaIds.contains(qna.getId());
            return QnAResponse.from(qna, files, hasAnswer);
        }));
    }

    /**
     * QnA 상세 조회 (N+1 문제 해결)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "qna", key = "#qnaId")
    public QnAResponse getQnA(Long qnaId, HttpServletRequest request) {
        // N+1 문제 방지를 위한 fetch join 사용
        QnA qna = qnaRepository.findByIdWithUser(qnaId)
            .orElseThrow(() -> new IllegalArgumentException("QNA를 찾을수 없습니다."));

        // 세션 기반 조회수 증가 처리
        handleViewCountIncrease(qna, qnaId, request);

        // 이미지 조회
        List<PostMedia> postMedia = postMediaRepository.findByPostTypeAndPostId(PostType.QNA, qna.getId());
        boolean hasAnswer = commentRepository.existsByCommentTypeAndTargetId(CommentType.QNA, qna.getId());

        return QnAResponse.from(qna, postMedia, hasAnswer);
    }

    /**
     * QnA 수정
     */
    @CacheEvict(value = {"qnas", "qna"}, allEntries = true)
    public void updateQnA(QnAUpdate update, Long userId, Long qnaId, List<MultipartFile> files, List<Long> keepfileIds) {
        QnA qna = findQnAById(qnaId);

        // 권한 검증
        String guestPassword = update != null ? update.guestPassword().orElse(null) : null;
        validateUpdatePermission(qna, userId, guestPassword);

        // 수정할 내용이 있을 때만 업데이트
        if (update != null && update.hasContentToUpdate()) {
            qna.update(
                update.title().orElse(qna.getTitle()),
                update.content().orElse(qna.getContent())
            );
        }

        if (files != null || keepfileIds != null) {
            postMediaService.updateMedia(qnaId, PostType.QNA, files, keepfileIds);
        }
    }

    /**
     * QnA 삭제
     */
    @CacheEvict(value = {"qnas", "qna"}, allEntries = true)
    public void deleteQnA(Long qnaId, Long userId, String guestPassword) {
        QnA qna = findQnAById(qnaId);

        // 권한 검증
        validateDeletePermission(qna, userId, guestPassword);

        // 소프트 삭제 실행
        qna.softDelete();
    }

    /**
     * 비회원 비밀번호 검증
     */
    public boolean verifyGuestPassword(Long qnaId, PasswordRequest request) {
        try {
            QnA qna = findQnAById(qnaId);

            // 비회원 작성 게시물인지 확인
            if (!qna.isGuestPost()) {
                return false;
            }

            return passwordEncoder.matches(request.guestPassword(), qna.getGuestPassword());

        } catch (Exception e) {
            log.error("비밀번호 확인 중 오류 발생: ", e);
            return false;
        }
    }

    // === Private Helper Methods ===

    private User findUserById(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("회원 작성시 로그인이 필요합니다.");
        }
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private QnA findQnAById(Long qnaId) {
        return qnaRepository.findById(qnaId)
            .orElseThrow(() -> new IllegalArgumentException("QnA를 찾을 수 없습니다."));
    }

    private void validateGuestPost(Long userId, QnaRequest request) {
        if (userId != null) {
            throw new IllegalArgumentException("로그인된 상태에서는 비회원 작성을 할 수 없습니다.");
        }
        if (request.guestName() == null || request.guestPassword() == null) {
            throw new IllegalArgumentException("비회원 작성시 이름과 비밀번호가 필요합니다.");
        }
    }

    private boolean isAdmin(Long userId) {
        if (userId == null) {
            return false;
        }
        return userRepository.findById(userId)
            .map(User::isAdmin)
            .orElse(false);
    }

    private void validateUpdatePermission(QnA qna, Long userId, String guestPassword) {
        // 관리자는 모든 글 수정 가능
        if (isAdmin(userId)) {
            return;
        }

        if (qna.isGuestPost()) {
            // 비회원 글의 경우
            if (userId != null) {
                // 로그인한 일반 회원이 비회원 글을 수정하려고 하는 경우
                throw new IllegalArgumentException("비회원이 작성한 글은 일반 회원이 수정할 수 없습니다.");
            }

            // 비회원이 수정하려는 경우 - 비밀번호 검증
            if (guestPassword == null || guestPassword.trim().isEmpty()) {
                throw new IllegalArgumentException("비밀번호를 입력해주세요.");
            }

            // 비밀번호 검증 (암호화된 비밀번호와 비교)
            if (!passwordEncoder.matches(guestPassword, qna.getGuestPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }

            return;
        }

        // 회원 글의 경우
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (!qna.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 글만 수정할 수 있습니다.");
        }
    }

    private void validateDeletePermission(QnA qna, Long userId, String guestPassword) {
        // 관리자는 모든 글 삭제 가능
        if (isAdmin(userId)) {
            return;
        }

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

    private Map<Long, List<PostMedia>> loadFilesInBatch(Set<Long> qnaIds) {
        List<PostMedia> allfiles = postMediaRepository.findByPostTypeAndPostIdIn(PostType.QNA, qnaIds);
        return allfiles.stream()
            .collect(Collectors.groupingBy(PostMedia::getPostId));
    }

    private Set<Long> loadAnsweredQnaIdsInBatch(Set<Long> qnaIds) {
        List<Long> answeredIds = commentRepository.findQnaIdsWithAnswers(qnaIds);
        return answeredIds.stream()
            .collect(Collectors.toSet());
    }

    private void handleViewCountIncrease(QnA qna, Long qnaId, HttpServletRequest request) {
        HttpSession session = request.getSession();
        String sessionKey = VIEWED_QNA_PREFIX + qnaId;

        if (session.getAttribute(sessionKey) == null) {
            qna.increaseViewCount();
            session.setAttribute(sessionKey, true);
            session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
        }
    }
}