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

  // 사용자 조회 시 BranchUser 관계까지 함께 조회 (로그인용)
  @Query("SELECT u FROM User u LEFT JOIN FETCH u.branchUsers bu LEFT JOIN FETCH bu.branch WHERE u.memberId = :memberId AND u.isDeleted = false")
  Optional<User> findByMemberIdWithBranchUsers(@Param("memberId") String memberId);

  // 사용자 목록 조회 시 BranchUser 관계까지 함께 조회
  @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.branchUsers bu LEFT JOIN FETCH bu.branch WHERE u.isDeleted = false ORDER BY u.createdAt DESC")
  Page<User> findAllByIsDeletedFalseWithBranchUsers(Pageable pageable);

  // 특정 지점의 사용자 조회 시 BranchUser 관계까지 함께 조회
  @Query("SELECT DISTINCT u FROM User u JOIN FETCH u.branchUsers bu JOIN FETCH bu.branch WHERE bu.branch.id IN :branchIds AND u.isDeleted = false ORDER BY u.createdAt DESC")
  Page<User> findAllByBranchIdInAndIsDeletedFalseWithBranchUsers(@Param("branchIds") List<Long> branchIds, Pageable pageable);

  @Query("SELECT u FROM User u LEFT JOIN FETCH u.branchUsers bu LEFT JOIN FETCH bu.branch WHERE u.id = :userId AND u.isDeleted = false")
  Optional<User> findByIdWithBranchUsersAndIsDeletedFalse(@Param("userId") Long userId);
}
