package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchService {

  private final BranchRepository branchRepository;
  private final UserRepository userRepository;

  public void createBranch(Long id, BranchRequest request) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관장님, 관리자만 지부 등록이 가능합니다.");
    }

    Branch branch = Branch.builder()
        .region(request.region())
        .address(request.address())
        .build();

    branchRepository.save(branch);
  }

  public BranchResponse getBranch(Long branchId) {
    Branch branch = branchRepository.findById(branchId).orElseThrow(()->new IllegalArgumentException("지부를 찾을 수 없습니다."));

    BranchResponse branchResponse = BranchResponse.from(branch);
    return branchResponse;
  }


  public PageResponse<BranchResponse> getAllBranch(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<Branch> branches = branchRepository.findAll(pageRequest);

    Page<BranchResponse> branchResponses = branches.map(BranchResponse::from);

    return PageResponse.success(branchResponses, HttpStatus.OK, "모든 지부 조회 완료");
  }


  public Status updateBranch(Long id, BranchUpdate update) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()
        -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    branch.updateBranch(update);

    return Status.builder().status(HttpStatus.OK.value()).message("지부 정보 수정완료").build();
  }


  public void deleteBranch(Long id) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관장님, 관리자만 지부 정보 삭제가 가능합니다.");
    }

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()
        -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

    branch.softDelte();
  }
}
