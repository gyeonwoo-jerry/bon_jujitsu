package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.ImageResponse;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.NoticeSpecification;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
  private final PostImageService postImageService;
  private final PostImageRepository postImageRepository;

  public void createNotice(Long userId, NoticeRequest request, List<MultipartFile> images, Long branchId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch  = branchRepository.findById(branchId).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(branchId))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    if (!(branchUser.getUserRole() == UserRole.OWNER || user.isAdmin())) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 작성할 수 있습니다.");
    }

    Notice notice = Notice.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch )
        .user(user)
        .build();

    noticeRepository.save(notice);

    postImageService.uploadImage(notice.getId(), PostType.NOTICE, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NoticeResponse> getNotices(int page, int size, String name, Long branchId) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Notice> notices;

    try {
      // 🔥 방법 1: 수정된 Specification 사용
      Specification<Notice> spec = Specification.where(NoticeSpecification.includeDeletedUsers())
              .and(NoticeSpecification.hasUserName(name))
              .and(NoticeSpecification.hasBranchId(branchId));

      notices = noticeRepository.findAll(spec, pageRequest);

    } catch (Exception e) {
      // 🔥 방법 2: Specification 실패 시 안전한 쿼리로 폴백
      log.warn("Notice Specification 조회 실패, 안전한 쿼리로 폴백: {}", e.getMessage());
      notices = noticeRepository.findNoticesSafely(name, branchId, pageRequest);
    }

    Page<NoticeResponse> noticeResponses = notices.map(notice -> {
      try {
        List<ImageResponse> imageResponses = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId())
                .stream()
                .map(postImage -> {
                  String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
                  return ImageResponse.builder()
                          .id(postImage.getId())
                          .url(path)
                          .build();
                })
                .collect(Collectors.toList());

        // 🔥 안전한 작성자명 처리
        String authorName;
        try {
          if (notice.getUser() != null) {
            authorName = notice.getUser().getName();
          } else {
            authorName = "탈퇴한 회원";
          }
        } catch (Exception ex) {
          authorName = "탈퇴한 회원";
        }

        return new NoticeResponse(
                notice.getId(),
                notice.getTitle(),
                notice.getContent(),
                notice.getBranch().getRegion(),
                authorName, // 🔥 안전하게 처리된 작성자명
                imageResponses,
                notice.getViewCount(),
                notice.getCreatedAt(),
                notice.getModifiedAt()
        );

      } catch (Exception e) {
        // 🔥 개별 공지사항 처리 실패 시 안전한 응답 생성
        log.warn("공지사항 {} 처리 중 오류: {}", notice.getId(), e.getMessage());
        return createSafeNoticeResponse(notice);
      }
    });

    return PageResponse.fromPage(noticeResponses);
  }

  @Transactional(readOnly = true)
  public NoticeResponse getNotice(Long noticeId, HttpServletRequest request) {
    Notice notice;

    try {
      // 🔥 방법 1: 기본 조회 시도
      notice = noticeRepository.findById(noticeId)
              .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
    } catch (Exception e) {
      // 🔥 방법 2: 안전한 조회로 폴백
      log.warn("기본 조회 실패, 안전한 조회로 폴백: {}", e.getMessage());
      notice = noticeRepository.findByIdSafely(noticeId)
              .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
    }

    HttpSession session = request.getSession();
    String sessionKey = "viewed_notice_" + noticeId;

    if (session.getAttribute(sessionKey) == null) {
      notice.increaseViewCount();
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60);
    }

    try {
      List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId());
      return NoticeResponse.fromEntity(notice, postImages);
    } catch (Exception e) {
      // 🔥 NoticeResponse 생성 실패 시 안전한 응답
      log.warn("NoticeResponse 생성 실패: {}", e.getMessage());
      return createSafeNoticeResponse(notice);
    }
  }

  // 🔥 안전한 NoticeResponse 생성 헬퍼 메서드
  private NoticeResponse createSafeNoticeResponse(Notice notice) {
    List<ImageResponse> emptyImages = Collections.emptyList();

    String authorName;
    try {
      authorName = (notice.getUser() != null) ? notice.getUser().getName() : "탈퇴한 회원";
    } catch (Exception e) {
      authorName = "탈퇴한 회원";
    }

    String region;
    try {
      region = notice.getBranch().getRegion();
    } catch (Exception e) {
      region = "지부 정보 없음";
    }

    return new NoticeResponse(
            notice.getId(),
            notice.getTitle(),
            notice.getContent(),
            region,
            authorName,
            emptyImages,
            notice.getViewCount(),
            notice.getCreatedAt(),
            notice.getModifiedAt()
    );
  }

  public void updateNotice(NoticeUpdate update, Long userId, Long noticeId, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    // 공지사항이 속한 지점 확인
    Branch noticeBranch = notice.getBranch();

    // 사용자가 해당 지점에 등록되어 있는지와 역할 확인
    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(noticeBranch.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    // 관리자이거나 해당 지점의 관장인 경우에만 수정 가능
    if (!(user.isAdmin() || branchUser.getUserRole() == UserRole.OWNER)) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 수정할 수 있습니다.");
    }

    // 관장인 경우 본인이 작성한 공지사항만 수정 가능
    if (branchUser.getUserRole() == UserRole.OWNER && !notice.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 공지사항만 수정할 수 있습니다.");
    }

    notice.updateNotice(update);

    postImageService.updateImages(notice.getId(), PostType.NOTICE, images, keepImageIds);
  }

  public void deleteNotice(Long userId, Long noticeId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    // 공지사항이 속한 지점 확인
    Branch noticeBranch = notice.getBranch();

    // 사용자가 해당 지점에 등록되어 있는지와 역할 확인
    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getBranch().getId().equals(noticeBranch.getId()))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 체육관에 등록된 사용자가 아닙니다."));

    // 관리자이거나 해당 지점의 관장인 경우에만 수정 가능
    if (!(user.isAdmin() || branchUser.getUserRole() == UserRole.OWNER)) {
      throw new IllegalArgumentException("공지사항은 관장이나 관리자만 삭제할 수 있습니다.");
    }

    // 관장인 경우 본인이 작성한 공지사항만 수정 가능
    if (branchUser.getUserRole() == UserRole.OWNER && !notice.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 공지사항만 삭제할 수 있습니다.");
    }

    notice.softDelete();
  }

  public NoticeResponse getMainNotice(Long branchId) {
    Branch branch = branchRepository.findById(branchId).orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findTopByBranchOrderByCreatedAtDesc(branch)
        .orElseThrow(() -> new IllegalArgumentException("공지사항이 존재하지 않습니다."));

    // PostImage 엔티티 리스트를 직접 가져옴
    List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId());

    return NoticeResponse.fromEntity(notice, postImages);
  }
}
