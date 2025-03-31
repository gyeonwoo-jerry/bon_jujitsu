package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Sponsor;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.SponsorRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
  private final PostImageRepository postImageRepository;

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

    Page<Sponsor> sponsors = sponsorRepository.findAll(pageRequest);

    Page<SponsorResponse> sponsorResponses = sponsors.map(sponsor -> {
      // PostImage 레포지토리를 사용하여 해당 게시글의 이미지들 조회
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("SPONSOR", sponsor.getId())
              .stream()
              .map(postImage -> {
                // 파일 경로 안전하게 조합
                String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
                return path;
              })
              .collect(Collectors.toList());

      return new SponsorResponse(
              sponsor.getId(),
              sponsor.getTitle(),
              sponsor.getContent(),
              sponsor.getUser().getName(),
              imagePaths,
              sponsor.getCreatedAt(),
              sponsor.getModifiedAt()
      );
    });

    return PageResponse.fromPage(sponsorResponses);
  }

  public SponsorResponse getSponsor(Long sponsorId) {
    Sponsor sponsor = sponsorRepository.findById(sponsorId).orElseThrow(()-> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("SPONSOR", sponsor.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              return path;
            })
            .collect(Collectors.toList());

    SponsorResponse sponsorResponse = SponsorResponse.fromEntity(sponsor, imagePaths);
    return sponsorResponse;
  }


  public void updateSponsor(SponsorUpdate update, Long userId, Long sponsorId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Sponsor sponsor = sponsorRepository.findById(sponsorId).orElseThrow(()-> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스폰서는 관장만 수정 할 수 있습니다.");
    }

    sponsor.updateSponsor(update);

    postImageService.updateImages(sponsor.getId(), "sponnsor", images);
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
