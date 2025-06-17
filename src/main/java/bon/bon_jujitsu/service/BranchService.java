package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.BranchUserRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.BranchSpecification;
import java.util.List;
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
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BranchService {

  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final BranchImageService branchImageService;
  private final BranchUserRepository branchUserRepository;

  public void createBranch(Long userId, BranchRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 지부 등록이 가능합니다.");
    }

    Branch branch = Branch.builder()
        .region(request.region())
        .address(request.address())
        .area(request.area())
        .content(request.content())
        .build();

    branchRepository.save(branch);

    branchImageService.uploadImage(branch, images);
  }

  @Transactional(readOnly = true)
  public BranchResponse getBranch(Long branchId) {
    Branch branch = branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    try {
      // OWNER 권한을 가진 유저 찾기 - 삭제된 사용자 제외
      User owner = branch.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted()) // 삭제된 사용자 제외
          .findFirst()
          .orElse(null);

      // COACH 권한을 가진 유저들 리스트 - 삭제된 사용자 제외
      List<User> coaches = branch.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.COACH)
          .map(BranchUser::getUser)
          .filter(user -> user != null && !user.isDeleted()) // 삭제된 사용자 제외
          .collect(Collectors.toList());

      return BranchResponse.from(branch, owner, coaches);

    } catch (Exception e) {
      log.error("🚨 Branch {} 조회 중 오류 발생: {}", branchId, e.getMessage());

      // 오류 발생 시 안전한 응답 반환 (owner와 coaches 없이)
      return BranchResponse.fromBranchOnly(branch);
    }
  }

  @Transactional(readOnly = true)
  public PageResponse<BranchResponse> getAllBranch(int page, int size, String region, String area, List<Long> branchIds) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "region"));

    Specification<Branch> spec = Specification.where(BranchSpecification.regionContains(region))
        .and(BranchSpecification.areaContains(area))
        .and(BranchSpecification.branchIdIn(branchIds));

    Page<Branch> branches = branchRepository.findAll(spec, pageRequest);

    Page<BranchResponse> branchResponses = branches.map(branch -> {
      try {
        // OWNER 찾기 - 삭제된 사용자는 제외
        User owner = branch.getBranchUsers().stream()
            .filter(bu -> bu.getUserRole() == UserRole.OWNER)
            .map(BranchUser::getUser)
            .filter(user -> user != null && !user.isDeleted()) // 여기가 핵심!
            .findFirst()
            .orElse(null);

        // COACH들 찾기 - 삭제된 사용자는 제외
        List<User> coaches = branch.getBranchUsers().stream()
            .filter(bu -> bu.getUserRole() == UserRole.COACH)
            .map(BranchUser::getUser)
            .filter(user -> user != null && !user.isDeleted()) // 여기가 핵심!
            .collect(Collectors.toList());

        return BranchResponse.from(branch, owner, coaches);

      } catch (Exception e) {
        log.error("🚨 Branch {} 처리 중 오류 발생: {}", branch.getId(), e.getMessage());

        // 오류 발생 시 안전한 응답 반환
        return BranchResponse.fromBranchOnly(branch);
      }
    });

    return PageResponse.fromPage(branchResponses);
  }

  public void updateBranch(Long userId, Long branchId, BranchUpdate update, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch;

    if (user.isAdminUser()) {
      branch = branchRepository.findById(branchId)
          .orElseThrow(() -> new IllegalArgumentException("해당 ID의 지부를 찾을 수 없습니다."));
    } else {
      BranchUser branchUser = user.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .findFirst()
          .orElseThrow(() -> new IllegalArgumentException("해당 유저는 지부의 관장(OWNER)이 아닙니다."));
      branch = branchUser.getBranch();
    }

    branch.updateBranch(update);

    branchImageService.updateImages(branch, images, keepImageIds);
  }


  public void deleteBranch(Long userId, Long branchId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 지부 삭제가 가능합니다.");
    }

    Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    // 해당 브랜치에 속한 모든 BranchUser 관계 제거
    List<BranchUser> branchUsers = branchUserRepository.findByBranch(branch);
    branchUserRepository.deleteAll(branchUsers);

    // 브랜치 soft delete
    branch.softDelete();
  }

  public boolean isRegionDuplicate(String region) {
    return branchRepository.existsByRegion(region);
  }

  public List<String> getAllAreas() {
    return branchRepository.findDistinctAreas();
  }

  public List<String> getRegionsByArea(String area) {
    return branchRepository.findDistinctRegionsByArea(area);
  }
}
