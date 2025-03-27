package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.*;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    Branch userBranch = user.getBranch();
    if (userBranch == null) {
      throw new IllegalArgumentException("사용자에게 등록된 체육관이 없습니다.");
    }

    Branch requestBranch  = branchRepository.findById(branchId).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    // 공지사항은 OWNER만 작성 가능
    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 작성할 수 있습니다.");
    }

    // 관장의 체육관과 요청된 체육관(branchId)이 같은지 확인
    if (!userBranch.getId().equals(requestBranch.getId())) {
      throw new IllegalArgumentException("해당 체육관의 공지사항을 작성할 권한이 없습니다.");
    }

    Notice notice = Notice.builder()
        .title(request.title())
        .content(request.content())
        .branch(requestBranch )
        .user(user)
        .build();

    noticeRepository.save(notice);

    postImageService.uploadImage(notice.getId(), "notice", images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NoticeResponse> getNotices(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Notice> notices = noticeRepository.findAll(pageRequest);

    Page<NoticeResponse> noticeResponses = notices.map(notice -> {
      // PostImage 레포지토리를 사용하여 해당 게시글의 이미지들 조회
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("NOTICE", notice.getId())
              .stream()
              .map(postImage -> {
                // 파일 경로 안전하게 조합
                String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
                String fileName = Optional.ofNullable(postImage.getOriginalFileName()).orElse("");
                return path + fileName;
              })
              .collect(Collectors.toList());

      return new NoticeResponse(
              notice.getId(),
              notice.getTitle(),
              notice.getContent(),
              notice.getBranch().getRegion(),
              notice.getUser().getName(),
              imagePaths,
              notice.getCreatedAt(),
              notice.getModifiedAt()
      );
    });

    return PageResponse.success(noticeResponses, HttpStatus.OK, "공지사항 조회 성공");
  }

  public NoticeResponse getNotice(Long noticeId) {
    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("NOTICE", notice.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              String fileName = Optional.ofNullable(postImage.getOriginalFileName()).orElse("");
              return path + fileName;
            })
            .toList();

    NoticeResponse noticeResponse = NoticeResponse.fromEntity(notice, imagePaths);
    return noticeResponse;
  }


  public Status updateNotice(NoticeUpdate update, Long userId, Long noticeId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 수정 할 수 있습니다.");
    }

    if (!notice.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("지부 해당 관장만 공지사항을 수정 할 수 있습니다.");
    }

    notice.updateNotice(update);

    postImageService.updateImages(notice.getId(), "notice", images);

    return Status.builder().status(HttpStatus.OK.value()).message("공지사항 수정 완료").build();
  }

  public void deleteNotice(Long userId, Long noticeId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 삭제 할 수 있습니다.");
    }

    notice.softDelte();
  }
}
