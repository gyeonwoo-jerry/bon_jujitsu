package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.Sponsor;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.ImageResponse;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.SponsorRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 작성할 수 있습니다.");
    }

    Sponsor sponsor = Sponsor.builder()
        .title(request.title())
        .content(request.content())
        .url(request.url())
        .user(user)
        .build();

    sponsorRepository.save(sponsor);

    postImageService.uploadImage(sponsor.getId(), PostType.SPONSOR, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<SponsorResponse> getSponsors(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size);

    Page<Sponsor> sponsors;

    if (name != null && !name.isBlank()) {
      // 작성자 이름으로 필터링
      sponsors = sponsorRepository.findByUser_NameContainingIgnoreCase(name, pageRequest);
    } else {
      // 전체 스폰서 조회
      sponsors = sponsorRepository.findAll(pageRequest);
    }

    Page<SponsorResponse> sponsorResponses = sponsors.map(sponsor -> {
      List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.SPONSOR, sponsor.getId());
      return SponsorResponse.fromEntity(sponsor, postImages);
    });

    return PageResponse.fromPage(sponsorResponses);
  }

  public SponsorResponse getSponsor(Long sponsorId, HttpServletRequest request) {
    Sponsor sponsor = sponsorRepository.findById(sponsorId)
        .orElseThrow(() -> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    HttpSession session = request.getSession();
    String sessionKey = "viewed_sponsor_" + sponsorId;

    if (session.getAttribute(sessionKey) == null) {
      sponsor.increaseViewCount(); // 처음 본 경우에만 조회수 증가
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60); // 1시간 유지
    }

    List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.SPONSOR, sponsor.getId());

    return SponsorResponse.fromEntity(sponsor, postImages);
  }


  public void updateSponsor(SponsorUpdate update, Long userId, Long sponsorId, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Sponsor sponsor = sponsorRepository.findById(sponsorId)
        .orElseThrow(() -> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 수정할 수 있습니다.");
    }

    if (!sponsor.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스폰서만 수정할 수 있습니다.");
    }

    sponsor.updateSponsor(update);

    postImageService.updateImages(sponsor.getId(), PostType.SPONSOR, images, keepImageIds);
  }


  public void deleteSponsor(Long userId, Long sponsorId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Sponsor sponsor = sponsorRepository.findById(sponsorId)
        .orElseThrow(() -> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    // 관리자인 경우 - 모든 스폰서 삭제 가능
    if (user.isAdmin()) {
      // 관리자는 모든 스폰서 삭제 가능하므로 추가 검사 없이 진행
    }
    // 관장인 경우 - 본인이 작성한 스폰서만 삭제 가능
    else if (user.getBranchUsers().stream().anyMatch(bu -> bu.getUserRole() == UserRole.OWNER)) {
      if (!sponsor.getUser().getId().equals(user.getId())) {
        throw new IllegalArgumentException("본인이 작성한 스폰서만 삭제할 수 있습니다.");
      }
    }
    // 그 외 경우 - 삭제 권한 없음
    else {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 삭제할 수 있습니다.");
    }

    sponsor.softDelete();
  }
}
