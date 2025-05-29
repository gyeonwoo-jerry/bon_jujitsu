package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchUserRepository extends JpaRepository<BranchUser, Long> {

  Optional<BranchUser> findByUserAndBranch(User loggedInUser, Branch branch);

  boolean existsByUserIdAndBranchId(Long userId, Long branchId);

  Optional<BranchUser> findByUserIdAndBranchId(Long userId, Long branchId);

  List<BranchUser> findByBranch(Branch branch);
}
