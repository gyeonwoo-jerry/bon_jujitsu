package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.Sponsor;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.repository.PostMediaRepository;
import bon.bon_jujitsu.repository.SponsorRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SponsorService {

  private final SponsorRepository sponsorRepository;
  private final UserRepository userRepository;
  private final PostMediaService postMediaService;
  private final PostMediaRepository postMediaRepository;

  private static final String VIEWED_SPONSOR_PREFIX = "viewed_sponsor_";
  private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

  /**
   * 스폰서 게시물 생성
   */
  @CacheEvict(value = "sponsors", allEntries = true)
  public void createSponsor(Long userId, SponsorRequest request, List<MultipartFile> files) {
    User user = findUserById(userId);

    // 권한 검증 (관장 또는 관리자만 작성 가능)
    validateSponsorCreatePermission(user);

    Sponsor sponsor = Sponsor.builder()
        .title(request.title())
        .content(request.content())
        .url(request.url())
        .user(user)
        .build();

    sponsorRepository.save(sponsor);

    if (files != null && !files.isEmpty()) {
      postMediaService.uploadMedia(sponsor.getId(), PostType.SPONSOR, files);
    }
  }

  /**
   * 스폰서 게시물 목록 조회 (N+1 문제 해결)
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "sponsors", key = "#page + '_' + #size + '_' + (#name != null ? #name : 'all')")
  public PageResponse<SponsorResponse> getSponsors(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size);

    // N+1 문제 방지를 위한 fetch join 사용
    Page<Sponsor> sponsors = (name != null && !name.isBlank())
        ? sponsorRepository.findByUser_NameContainingIgnoreCaseWithUser(name, pageRequest)
        : sponsorRepository.findAllWithUser(pageRequest);

    if (sponsors.isEmpty()) {
      return PageResponse.fromPage(sponsors.map(sponsor -> null));
    }

    // 이미지만 별도로 배치 로딩
    Set<Long> sponsorIds = sponsors.getContent().stream()
        .map(Sponsor::getId)
        .collect(Collectors.toSet());

    Map<Long, List<PostMedia>> fileMap = loadFilesInBatch(sponsorIds);

    // SponsorResponse 생성
    return PageResponse.fromPage(sponsors.map(sponsor -> {
      List<PostMedia> files = fileMap.getOrDefault(sponsor.getId(), Collections.emptyList());
      return SponsorResponse.fromEntity(sponsor, files);
    }));
  }

  /**
   * 스폰서 게시물 상세 조회 (N+1 문제 해결)
   */
  public SponsorResponse getSponsor(Long sponsorId, HttpServletRequest request) {
    // N+1 문제 방지를 위한 fetch join 사용
    Sponsor sponsor = sponsorRepository.findByIdWithUser(sponsorId)
        .orElseThrow(() -> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));

    // 세션 기반 조회수 증가 처리
    handleViewCountIncrease(sponsor, sponsorId, request);

    // 이미지 조회
    List<PostMedia> postMedia = postMediaRepository.findByPostTypeAndPostId(PostType.SPONSOR, sponsor.getId());

    return SponsorResponse.fromEntity(sponsor, postMedia);
  }

  /**
   * 스폰서 게시물 수정
   */
  @CacheEvict(value = {"sponsors", "sponsor"}, allEntries = true)
  public void updateSponsor(SponsorUpdate update, Long userId, Long sponsorId,
      List<MultipartFile> files, List<Long> keepfileIds) {
    User user = findUserById(userId);
    Sponsor sponsor = findSponsorById(sponsorId);

    // 권한 검증
    validateSponsorUpdatePermission(user, sponsor);

    sponsor.updateSponsor(update);

    if (files != null || keepfileIds != null) {
      postMediaService.updateMedia(sponsor.getId(), PostType.SPONSOR, files, keepfileIds);
    }
  }

  /**
   * 스폰서 게시물 삭제
   */
  @CacheEvict(value = {"sponsors", "sponsor"}, allEntries = true)
  public void deleteSponsor(Long userId, Long sponsorId) {
    User user = findUserById(userId);
    Sponsor sponsor = findSponsorById(sponsorId);

    // 권한 검증
    validateSponsorDeletePermission(user, sponsor);

    // 소프트 삭제 실행
    sponsor.softDelete();
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private Sponsor findSponsorById(Long sponsorId) {
    return sponsorRepository.findById(sponsorId)
        .orElseThrow(() -> new IllegalArgumentException("스폰서를 찾을 수 없습니다."));
  }

  private boolean isOwnerOrAdmin(User user) {
    return user.isAdmin() ||
        user.getBranchUsers().stream()
            .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER);
  }

  private void validateSponsorCreatePermission(User user) {
    if (!isOwnerOrAdmin(user)) {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 작성할 수 있습니다.");
    }
  }

  private void validateSponsorUpdatePermission(User user, Sponsor sponsor) {
    if (!isOwnerOrAdmin(user)) {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 수정할 수 있습니다.");
    }

    // 관리자가 아닌 경우 본인 글만 수정 가능
    if (!user.isAdmin() && !sponsor.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스폰서만 수정할 수 있습니다.");
    }
  }

  private void validateSponsorDeletePermission(User user, Sponsor sponsor) {
    if (user.isAdmin()) {
      // 관리자는 모든 스폰서 삭제 가능
      return;
    }

    boolean isOwner = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER);

    if (!isOwner) {
      throw new IllegalArgumentException("스폰서는 관장이나 관리자만 삭제할 수 있습니다.");
    }

    // 관장이지만 본인 글이 아닌 경우
    if (!sponsor.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스폰서만 삭제할 수 있습니다.");
    }
  }

  private Map<Long, List<PostMedia>> loadFilesInBatch(Set<Long> sponsorIds) {
    List<PostMedia> allFiles = postMediaRepository.findByPostTypeAndPostIdIn(PostType.SPONSOR, sponsorIds);
    return allFiles.stream()
        .collect(Collectors.groupingBy(PostMedia::getPostId));
  }

  private void handleViewCountIncrease(Sponsor sponsor, Long sponsorId, HttpServletRequest request) {
    HttpSession session = request.getSession();
    String sessionKey = VIEWED_SPONSOR_PREFIX + sponsorId;

    if (session.getAttribute(sessionKey) == null) {
      sponsor.increaseViewCount();
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
    }
  }
}