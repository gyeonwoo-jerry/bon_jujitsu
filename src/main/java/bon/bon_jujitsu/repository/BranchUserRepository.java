package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchUserRepository extends JpaRepository<BranchUser, Long> {

  Optional<BranchUser> findByUserAndBranch(User loggedInUser, Branch branch);
}
