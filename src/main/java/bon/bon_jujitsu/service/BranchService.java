package bon.bon_jujitsu.service;

import static bon.bon_jujitsu.specification.BranchSpecification.areaContains;
import static bon.bon_jujitsu.specification.BranchSpecification.regionContains;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import bon.bon_jujitsu.domain.BranchUser;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchService {

  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final BranchImageService branchImageService;

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

  public BranchResponse getBranch(Long branchId) {
    Branch branch = branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    // OWNER 권한을 가진 유저 찾기
    User owner = branch.getBranchUsers().stream()
        .filter(bu -> bu.getUserRole() == UserRole.OWNER)
        .map(BranchUser::getUser)
        .findFirst()
        .orElse(null);

    // COACH 권한을 가진 유저들 리스트
    List<User> coaches = branch.getBranchUsers().stream()
        .filter(bu -> bu.getUserRole() == UserRole.COACH)
        .map(BranchUser::getUser)
        .toList();

    return BranchResponse.from(branch, owner, coaches);
  }


  public PageResponse<BranchResponse> getAllBranch(int page, int size, String region, String area) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "region"));

    Specification<Branch> spec = Specification.where(regionContains(region))
        .and(areaContains(area));

    Page<Branch> branches = branchRepository.findAll(spec, pageRequest);

    Page<BranchResponse> branchResponses = branches.map(branch -> {
      // 각 지부마다 OWNER 찾기
      User owner = branch.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(BranchUser::getUser)
          .findFirst()
          .orElse(null);

      // OWNER 정보를 포함한 응답 생성
      return BranchResponse.from(branch, owner);
    });

    return PageResponse.fromPage(branchResponses);
  }


  public void updateBranch(Long userId, BranchUpdate update, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    BranchUser branchUser = user.getBranchUsers().stream()
        .filter(bu -> bu.getUserRole() == UserRole.OWNER)
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("해당 유저는 지부의 관장(OWNER)이 아닙니다."));

    Branch branch = branchUser.getBranch();

    branch.updateBranch(update);

    if (images != null && !images.isEmpty()) {
      branchImageService.updateImages(branch, images);
    }
  }


  public void deleteBranch(Long userId, Long branchId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 지부 삭제가 가능합니다.");
    }

    Branch branch = branchRepository.findById(branchId).orElseThrow(()
        -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    branch.softDelete();
  }

  public boolean isRegionDuplicate(String region) {
    return branchRepository.existsByRegion(region);
  }
}
