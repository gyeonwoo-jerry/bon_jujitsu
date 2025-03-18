package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.BoardImage;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.NoticeImage;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
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
  private final NoticeImageService noticeImageService;

  public void createNotice(Long id, NoticeRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    // 공지사항은 OWNER만 작성 가능
    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 작성할 수 있습니다.");
    }

    Notice notice = Notice.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    noticeRepository.save(notice);

    noticeImageService.uploadImage(notice, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NoticeResponse> getNotices(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<Notice> notice = noticeRepository.findAll(pageRequest);

    Page<NoticeResponse> noticeResponses = notice.map(notices-> new NoticeResponse(
        notices.getId(),
        notices.getTitle(),
        notices.getContent(),
        notices.getBranch().getRegion(),
        notices.getUser().getName(),
        notices.getImages().stream().map(NoticeImage::getImagePath).toList(),
        notices.getCreatedAt(),
        notices.getModifiedAt()
    ));

    return PageResponse.success(noticeResponses, HttpStatus.OK, "공지사항 조회 성공");
  }

  public NoticeResponse getNotice(Long noticeId) {
    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

    NoticeResponse noticeResponse = NoticeResponse.fromEntity(notice);
    return noticeResponse;
  }


  public Status updateNotice(NoticeUpdate update, Long id, Long noticeId, List<MultipartFile> images) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 작성할 수 있습니다.");
    }

    notice.updateNotice(update);

    noticeImageService.updateImages(notice, images);

    return Status.builder().status(HttpStatus.OK.value()).message("공지사항 수정 완료").build();
  }

  public void deleteNotice(Long id, Long noticeId) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Notice notice = noticeRepository.findById(noticeId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("공지사항은 관장만 작성할 수 있습니다.");
    }

    notice.softDelte();
  }
}
