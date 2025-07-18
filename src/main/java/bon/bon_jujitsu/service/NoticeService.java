package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.PostMediaRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NoticeService {

  private final NoticeRepository noticeRepository;
  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final PostMediaService postMediaService;
  private final PostMediaRepository postMediaRepository;

  private static final String VIEWED_NOTICE_PREFIX = "viewed_notice_";
  private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

  /**
   * 공지사항 생성
   */
  public void createNotice(Long userId, NoticeRequest request, List<MultipartFile> files, Long branchId) {
    User user = findUserById(userId);
    Branch branch = findBranchById(branchId);

    validateNoticeWritePermission(user, branchId);

    Notice notice = Notice.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    noticeRepository.save(notice);

    if (files != null && !files.isEmpty()) {
      postMediaService.uploadMedia(notice.getId(), PostType.NOTICE, files);
    }
  }

  /**
   * 공지사항 목록 조회 (N+1 문제 해결)
   */
  @Transactional(readOnly = true)
  public PageResponse<NoticeResponse> getNotices(int page, int size, String name, Long branchId) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // N+1 문제 방지를 위한 fetch join 사용
    Page<Notice> notices = noticeRepository.findNoticesWithFetchJoin(name, branchId, pageRequest);

    // 이미지만 별도로 배치 로딩
    Set<Long> noticeIds = notices.getContent().stream()
        .map(Notice::getId)
        .collect(Collectors.toSet());

    Map<Long, List<PostMedia>> fileMap = loadfilesInBatch(noticeIds);

    // NoticeResponse 생성
    return PageResponse.fromPage(notices.map(notice -> {
      List<PostMedia> files = fileMap.getOrDefault(notice.getId(), Collections.emptyList());
      return NoticeResponse.fromEntity(notice, files);
    }));
  }

  /**
   * 공지사항 상세 조회 (N+1 문제 해결)
   */
  public NoticeResponse getNotice(Long noticeId, HttpServletRequest request) {
    // N+1 문제 방지를 위한 fetch join 사용
    Notice notice = noticeRepository.findByIdWithFetchJoin(noticeId)
        .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

    // 세션 기반 조회수 증가 처리
    handleViewCountIncrease(notice, noticeId, request);

    // 이미지 조회
    List<PostMedia> postMedia = postMediaRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId());

    return NoticeResponse.fromEntity(notice, postMedia);
  }

  /**
   * 공지사항 수정
   */
  public void updateNotice(NoticeUpdate update, Long userId, Long noticeId,
      List<MultipartFile> files, List<Long> keepfileIds) {
    User user = findUserById(userId);
    Notice notice = findNoticeById(noticeId);

    validateNoticeUpdatePermission(user, notice);

    notice.updateNotice(update);

    if (files != null || keepfileIds != null) {
      postMediaService.updateMedia(notice.getId(), PostType.NOTICE, files, keepfileIds);
    }
  }

  /**
   * 공지사항 삭제
   */
  public void deleteNotice(Long userId, Long noticeId) {
    User user = findUserById(userId);
    Notice notice = findNoticeById(noticeId);

    validateNoticeDeletePermission(user, notice);

    notice.softDelete();
  }

  /**
   * 메인 공지사항 조회
   */
  @Transactional(readOnly = true)
  public NoticeResponse getMainNotice(Long branchId) {
    Branch branch = findBranchById(branchId);

    Notice notice = noticeRepository.findTopByBranchOrderByCreatedAtDesc(branch)
        .orElseThrow(() -> new IllegalArgumentException("공지사항이 존재하지 않습니다."));

    List<PostMedia> postMedia = postMediaRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId());

    return NoticeResponse.fromEntity(notice, postMedia);
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private Branch findBranchById(Long branchId) {
    return branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 체육관입니다."));
  }

  private Notice findNoticeById(Long noticeId) {
    return noticeRepository.findById(noticeId)
        .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
  }

  private void validateNoticeWritePermission(User user, Long branchId) {
    // 관리자는 모든 지부에 작성 가능
    if (user.isAdmin()) {
      return;
    }

    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(branchId))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    if (branchUser.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 작성할 수 있습니다.");
    }
  }

  private void validateNoticeUpdatePermission(User user, Notice notice) {
    // 관리자는 모든 공지사항 수정 가능
    if (user.isAdmin()) {
      return;
    }

    Branch noticeBranch = notice.getBranch();
    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(noticeBranch.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    if (branchUser.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 수정할 수 있습니다.");
    }

    // 관장은 본인이 작성한 공지사항만 수정 가능
    if (!notice.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 공지사항만 수정할 수 있습니다.");
    }
  }

  private void validateNoticeDeletePermission(User user, Notice notice) {
    // 관리자는 모든 공지사항 삭제 가능
    if (user.isAdmin()) {
      return;
    }

    Branch noticeBranch = notice.getBranch();
    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(noticeBranch.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    if (branchUser.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 삭제할 수 있습니다.");
    }

    // 관장은 본인이 작성한 공지사항만 삭제 가능
    if (!notice.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 공지사항만 삭제할 수 있습니다.");
    }
  }

  private Map<Long, List<PostMedia>> loadfilesInBatch(Set<Long> noticeIds) {
    List<PostMedia> allfiles = postMediaRepository.findByPostTypeAndPostIdIn(PostType.NOTICE, noticeIds);
    return allfiles.stream()
        .collect(Collectors.groupingBy(PostMedia::getPostId));
  }

  private void handleViewCountIncrease(Notice notice, Long noticeId, HttpServletRequest request) {
    HttpSession session = request.getSession();
    String sessionKey = VIEWED_NOTICE_PREFIX + noticeId;

    Long lastViewTime = (Long) session.getAttribute(sessionKey);
    long currentTime = System.currentTimeMillis();

    // 5초(5000ms) 이내 중복 호출 방지
    if (lastViewTime == null || (currentTime - lastViewTime) > 5000) {
      notice.increaseViewCount();
      session.setAttribute(sessionKey, currentTime);
      session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
    } else {
      long timeDiff = currentTime - lastViewTime;
    }
  }
}