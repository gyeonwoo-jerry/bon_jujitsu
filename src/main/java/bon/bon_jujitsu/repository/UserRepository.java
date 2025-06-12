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

  @Query(
      value = """
        SELECT * FROM users 
        WHERE is_deleted = true 
        ORDER BY id DESC
        """,
      countQuery = "SELECT COUNT(*) FROM users WHERE is_deleted = true",
      nativeQuery = true
  )
  Page<User> findAllByIsDeletedTrueNative(Pageable pageable);

  @Query("SELECT DISTINCT u FROM User u JOIN u.branchUsers bu WHERE bu.branch.id IN :branchIds AND u.isDeleted = false")
  Page<User> findAllByBranchIdInAndIsDeletedFalse(@Param("branchIds") List<Long> branchIds, PageRequest pageRequest);

  @Query(
      value = """
        SELECT u.* 
        FROM users u
        JOIN branch_users bu ON u.id = bu.user_id
        WHERE u.is_deleted = true
        AND bu.branch_id IN (:branchIds)
        ORDER BY u.id DESC
        """,
      countQuery = """
        SELECT COUNT(*) 
        FROM users u
        JOIN branch_users bu ON u.id = bu.user_id
        WHERE u.is_deleted = true
        AND bu.branch_id IN (:branchIds)
        """,
      nativeQuery = true
  )
  Page<User> findDeletedUsersByBranchIdsNative(@Param("branchIds") List<Long> branchIds, Pageable pageable);

  boolean existsByMemberId(String memberId);
}
