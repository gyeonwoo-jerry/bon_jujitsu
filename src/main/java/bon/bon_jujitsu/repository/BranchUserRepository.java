package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BranchUserRepository extends JpaRepository<BranchUser, Long> {

  Optional<BranchUser> findByUserAndBranch(User loggedInUser, Branch branch);

  boolean existsByUserIdAndBranchId(Long userId, Long branchId);

  Optional<BranchUser> findByUserIdAndBranchId(Long userId, Long branchId);

  List<BranchUser> findByBranch(Branch branch);

  @Query("SELECT bu FROM BranchUser bu " +
      "JOIN FETCH bu.user u " +
      "WHERE bu.branch.id = :branchId AND u.isDeleted = false")
  List<BranchUser> findByBranchIdWithUser(Long branchId);

  @Query("SELECT bu FROM BranchUser bu " +
      "JOIN FETCH bu.user u " +
      "JOIN FETCH bu.branch b " +
      "WHERE b.id IN :branchIds AND u.isDeleted = false")
  List<BranchUser> findByBranchIdInWithUser(@Param("branchIds") Set<Long> branchIds);
}
