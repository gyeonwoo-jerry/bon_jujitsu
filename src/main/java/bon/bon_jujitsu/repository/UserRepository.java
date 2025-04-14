package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

  Optional<User> findByIdAndIsDeletedFalse(Long id);

  Optional<User> findByEmail(String email);

  Optional<User> findByPhoneNum(String phoneNum);

  Optional<User> findByMemberId(String nickname);

  Page<User> findAllByIsDeletedFalse(Pageable pageable);

  Page<User> findAllByIsDeletedTrue(PageRequest pageRequest);

  @Query("SELECT DISTINCT u FROM User u JOIN u.branchUsers bu WHERE bu.branch.id IN :branchIds AND u.isDeleted = false")
  Page<User> findAllByBranchIdInAndIsDeletedFalse(@Param("branchIds") List<Long> branchIds, PageRequest pageRequest);

  @Query("SELECT DISTINCT u FROM User u JOIN u.branchUsers bu WHERE bu.branch.id IN :branchIds AND u.isDeleted = true")
  Page<User> findDeletedUsersByBranchIds(@Param("branchIds") List<Long> branchIds, PageRequest pageRequest);
}
