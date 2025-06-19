package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchImage;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.BranchUserRepository;
import bon.bon_jujitsu.repository.BranchImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.BranchSpecification;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BranchService {

  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final BranchImageService branchImageService;
  private final BranchUserRepository branchUserRepository;
  private final BranchImageRepository branchImageRepository;

  /**
   * 지부 생성
   */
  @CacheEvict(value = "branches", allEntries = true)
  public void createBranch(Long userId, BranchRequest request, List<MultipartFile> images) {
    User user = findUserById(userId);
    validateAdminPermission(user);

    Branch branch = Branch.builder()
        .region(request.region())
        .address(request.address())
        .area(request.area())
        .content(request.content())
        .build();

    branchRepository.save(branch);

    // 이미지 업로드 (같은 트랜잭션에서 처리)
    if (images != null && !images.isEmpty()) {
      branchImageService.uploadImage(branch, images);
    }
  }

  /**
   * 모든 지역(광역시/도) 조회
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "areas", unless = "#result.isEmpty()")
  public List<String> getAllAreas() {
    return branchRepository.findDistinctAreas();
  }

  /**
   * 특정 지역의 세부 지역들 조회
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "regions", key = "#area", unless = "#result.isEmpty()")
  public List<String> getRegionsByArea(String area) {
    return branchRepository.findDistinctRegionsByArea(area);
  }

  /**
   * 지부 상세 조회 - N+1 문제 해결
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "branch", key = "#branchId")
  public BranchResponse getBranch(Long branchId) {
    Branch branch = findBranchById(branchId);

    try {
      // 관련 데이터 배치 로딩 (N+1 해결)
      List<BranchUser> branchUsers = branchUserRepository.findByBranchIdWithUser(branchId);
      List<BranchImage> branchImages = branchImageRepository.findByBranchId(branchId);

      // 삭제되지 않은 사용자들만 필터링하여 역할별로 분류
      User owner = branchUsers.stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted())
          .findFirst()
          .orElse(null);

      List<User> coaches = branchUsers.stream()
          .filter(bu -> bu.getUserRole() == UserRole.COACH)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted())
          .collect(Collectors.toList());

      return BranchResponse.from(branch, owner, coaches, branchImages);

    } catch (Exception e) {
      log.error("🚨 Branch {} 조회 중 오류 발생: {}", branchId, e.getMessage());
      return BranchResponse.fromBranchOnly(branch);
    }
  }

  /**
   * 지부 목록 조회 - 배치 로딩으로 N+1 문제 완전 해결
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "branches", key = "#page + '_' + #size + '_' + #region + '_' + #area + '_' + #branchIds?.hashCode()")
  public PageResponse<BranchResponse> getAllBranch(int page, int size, String region, String area, List<Long> branchIds) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "region"));

    Specification<Branch> spec = Specification.where(BranchSpecification.regionContains(region))
        .and(BranchSpecification.areaContains(area))
        .and(BranchSpecification.branchIdIn(branchIds));

    Page<Branch> branches = branchRepository.findAll(spec, pageRequest);

    if (branches.isEmpty()) {
      return PageResponse.fromPage(Page.empty());
    }

    // 🚀 조회된 지부들의 ID 수집
    Set<Long> branchIdSet = branches.getContent().stream()
        .map(Branch::getId)
        .collect(Collectors.toSet());

    // 🚀 배치 로딩으로 N+1 문제 해결
    Map<Long, List<BranchUser>> branchUserMap = branchUserRepository
        .findByBranchIdInWithUser(branchIdSet)
        .stream()
        .collect(Collectors.groupingBy(bu -> bu.getBranch().getId()));

    Map<Long, List<BranchImage>> branchImageMap = branchImageRepository
        .findByBranchIdIn(branchIdSet)
        .stream()
        .collect(Collectors.groupingBy(bi -> bi.getBranch().getId()));

    // 🚀 응답 생성 (추가 쿼리 없음)
    Page<BranchResponse> branchResponses = branches.map(branch ->
        createBranchResponse(branch, branchUserMap, branchImageMap)
    );

    return PageResponse.fromPage(branchResponses);
  }

  /**
   * 지부 수정
   */
  @CacheEvict(value = {"branches", "branch"}, allEntries = true)
  public void updateBranch(Long userId, Long branchId, BranchUpdate update,
      List<MultipartFile> images, List<Long> keepImageIds) {
    User user = findUserById(userId);
    Branch branch = findBranchForUpdate(user, branchId);

    // 지부 정보 업데이트
    if (hasContentChanges(update)) {
      branch.updateBranch(update);
    }

    // 이미지 처리 (변경사항이 있을 때만, 같은 트랜잭션에서)
    if (hasImageChanges(images, keepImageIds)) {
      branchImageService.updateImages(branch, images, keepImageIds);
    }
  }

  /**
   * 지부 삭제 - 연관 데이터 정리
   */
  @CacheEvict(value = {"branches", "branch"}, allEntries = true)
  public void deleteBranch(Long userId, Long branchId) {
    User user = findUserById(userId);
    validateAdminPermission(user);

    Branch branch = findBranchById(branchId);

    // 연관 데이터 정리
    cleanupBranchRelatedData(branch);

    // 브랜치 soft delete
    branch.softDelete();
  }

  /**
   * 지역 중복 체크
   */
  @Transactional(readOnly = true)
  public boolean isRegionDuplicate(String region) {
    return branchRepository.existsByRegion(region);
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private Branch findBranchById(Long branchId) {
    return branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));
  }

  private void validateAdminPermission(User user) {
    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 해당 작업이 가능합니다.");
    }
  }

  private Branch findBranchForUpdate(User user, Long branchId) {
    if (user.isAdminUser()) {
      return findBranchById(branchId);
    } else {
      return user.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .filter(bu -> bu.getBranch().getId().equals(branchId))
          .map(BranchUser::getBranch)
          .findFirst()
          .orElseThrow(() -> new IllegalArgumentException("해당 지부의 관장 권한이 없습니다."));
    }
  }

  /**
   * 🚀 BranchResponse 생성 헬퍼 - 안전한 응답 처리
   */
  private BranchResponse createBranchResponse(Branch branch,
      Map<Long, List<BranchUser>> branchUserMap,
      Map<Long, List<BranchImage>> branchImageMap) {
    try {
      List<BranchUser> branchUsers = branchUserMap.getOrDefault(branch.getId(), Collections.emptyList());
      List<BranchImage> branchImages = branchImageMap.getOrDefault(branch.getId(), Collections.emptyList());

      // 삭제되지 않은 사용자들만 필터링
      User owner = branchUsers.stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted())
          .findFirst()
          .orElse(null);

      List<User> coaches = branchUsers.stream()
          .filter(bu -> bu.getUserRole() == UserRole.COACH)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted())
          .collect(Collectors.toList());

      return BranchResponse.from(branch, owner, coaches, branchImages);

    } catch (Exception e) {
      log.error("🚨 Branch {} 처리 중 오류 발생: {}", branch.getId(), e.getMessage());
      return BranchResponse.fromBranchOnly(branch);
    }
  }

  private boolean hasContentChanges(BranchUpdate update) {
    return update.region().isPresent() ||
        update.address().isPresent() ||
        update.area().isPresent();
  }

  private boolean hasImageChanges(List<MultipartFile> images, List<Long> keepImageIds) {
    return (images != null && !images.isEmpty()) || keepImageIds != null;
  }

  private void cleanupBranchRelatedData(Branch branch) {
    try {
      List<BranchUser> branchUsers = branchUserRepository.findByBranch(branch);
      branchUserRepository.deleteAll(branchUsers);
      log.info("지부 관련 데이터 정리 완료: branchId={}", branch.getId());
    } catch (Exception e) {
      log.warn("지부 관련 데이터 정리 실패: branchId={}, error={}", branch.getId(), e.getMessage());
    }
  }
}