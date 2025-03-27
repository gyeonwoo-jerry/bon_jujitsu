package bon.bon_jujitsu.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관장님, 관리자만 지부 등록이 가능합니다.");
    }

    Branch branch = Branch.builder()
        .region(request.region())
        .address(request.address())
        .area(request.area())
        .build();

    branchRepository.save(branch);

    branchImageService.uploadImage(branch, images);
  }

  public BranchResponse getBranch(Long branchId) {
    Branch branch = branchRepository.findById(branchId).orElseThrow(()->new IllegalArgumentException("지부를 찾을 수 없습니다."));

    User owner = branch.getUsers().stream()
            .filter(user -> UserRole.OWNER.equals(user.getUserRole()))
            .findFirst()
            .orElse(null);

    BranchResponse branchResponse = BranchResponse.from(branch, owner);
    return branchResponse;
  }


  public PageResponse<BranchResponse> getAllBranch(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "region"));

    Page<Branch> branches = branchRepository.findAllWithOwner(pageRequest);

    Page<BranchResponse> branchResponses = branches.map(branch -> {
      // 각 지부마다 OWNER 찾기
      User owner = branch.getUsers().stream()
              .filter(user -> UserRole.OWNER.equals(user.getUserRole()))
              .findFirst()
              .orElse(null);

      // OWNER 정보를 포함한 응답 생성
      return BranchResponse.from(branch, owner);
    });

    return PageResponse.fromPage(branchResponses);
  }


  public void updateBranch(Long userId, BranchUpdate update, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()
        -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    branch.updateBranch(update);

    branchImageService.updateImages(branch, images);
  }


  public void deleteBranch(Long userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관장님, 관리자만 지부 정보 삭제가 가능합니다.");
    }

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()
        -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    branch.softDelte();
  }
}
