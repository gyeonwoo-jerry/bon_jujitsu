package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.NoticeSpecification;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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

    Specification<Notice> spec = Specification.where(NoticeSpecification.hasUserName(name))
        .and(NoticeSpecification.hasBranchId(branchId));

    Page<Notice> notices = noticeRepository.findAll(spec, pageRequest);

    Page<NoticeResponse> noticeResponses = notices.map(notice -> {
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId())
          .stream()
          .map(postImage -> Optional.ofNullable(postImage.getImagePath()).orElse(""))
          .collect(Collectors.toList());

      return new NoticeResponse(
          notice.getId(),
          notice.getTitle(),
          notice.getContent(),
          notice.getBranch().getRegion(),
          notice.getUser().getName(),
          imagePaths,
          notice.getViewCount(),
          notice.getCreatedAt(),
          notice.getModifiedAt()
      );
    });

    return PageResponse.fromPage(noticeResponses);
  }

  public NoticeResponse getNotice(Long noticeId, HttpServletRequest request) {
    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

    HttpSession session = request.getSession();
    String sessionKey = "viewed_notice_" + noticeId;

    if (session.getAttribute(sessionKey) == null) {
      notice.increaseViewCount(); // 처음 본 경우에만 조회수 증가
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60); // 1시간 유지
    }

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              return Optional.ofNullable(postImage.getImagePath()).orElse("");
            })
            .toList();

    return NoticeResponse.fromEntity(notice, imagePaths);
  }


  public void updateNotice(NoticeUpdate update, Long userId, Long noticeId, List<MultipartFile> images) {
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

    if (images != null && !images.isEmpty()) {
      postImageService.updateImages(notice.getId(), PostType.NOTICE, images);
    }
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

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId(PostType.NOTICE, notice.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              return Optional.ofNullable(postImage.getImagePath()).orElse("");
            })
            .toList();

    return NoticeResponse.fromEntity(notice, imagePaths);
  }
}
