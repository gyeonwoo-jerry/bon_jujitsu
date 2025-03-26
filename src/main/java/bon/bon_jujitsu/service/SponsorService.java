package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Sponsor;
import bon.bon_jujitsu.domain.SponsorImage;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.SponsorRepository;
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
public class SponsorService {

  private final SponsorRepository sponsorRepository;
  private final UserRepository userRepository;
  private final PostImageService postImageService;

  public void createSponsor(Long userId, SponsorRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    // 공지사항은 OWNER만 작성 가능
    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스폰서는 관장만 작성할 수 있습니다.");
    }

    Sponsor sponsor = Sponsor.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    sponsorRepository.save(sponsor);

    postImageService.uploadImage(sponsor.getId(), "sponsor", images);
  }

  @Transactional(readOnly = true)
  public PageResponse<SponsorResponse> getNotices(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<Sponsor> sponsor = sponsorRepository.findAll(pageRequest);

    Page<SponsorResponse> sponsorResponses = sponsor.map(sponsers-> new SponsorResponse(
        sponsers.getId(),
        sponsers.getTitle(),
        sponsers.getContent(),
        sponsers.getUser().getName(),
        sponsers.getImages().stream().map(SponsorImage::getImagePath).toList(),
        sponsers.getCreatedAt(),
        sponsers.getModifiedAt()
    ));

    return PageResponse.success(sponsorResponses, HttpStatus.OK, "스폰서 조회 성공");
  }

  public SponsorResponse getSponsor(Long sponsorId) {
    Sponsor sponsor = sponsorRepository.findById(sponsorId).orElseThrow(()-> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    SponsorResponse sponsorResponse = SponsorResponse.fromEntity(sponsor);
    return sponsorResponse;
  }


  public Status updateSponsor(SponsorUpdate update, Long userId, Long sponsorId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Sponsor sponsor = sponsorRepository.findById(sponsorId).orElseThrow(()-> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스폰서는 관장만 수정 할 수 있습니다.");
    }

    sponsor.updateSponsor(update);

    postImageService.updateImages(sponsor.getId(), "sponnsor", images);

    return Status.builder().status(HttpStatus.OK.value()).message("스폰서 수정 완료").build();
  }


  public void deleteSponsor(Long userId, Long sponsorId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Sponsor sponsor = sponsorRepository.findById(sponsorId).orElseThrow(()-> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스폰서는 관장만 삭제 할 수 있습니다.");
    }

    sponsor.softDelte();
  }
}
