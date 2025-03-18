package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByIdAndIsDeletedFalse(Long id);

  Optional<User> findByEmail(String email);

  Optional<User> findByPhoneNum(String phoneNum);

  Optional<User> findByNickname(String nickname);

  Page<User> findAllByIsDeletedFalse(Pageable pageable);

  Page<User> findAllByIsDeletedTrue(PageRequest pageRequest);

  Page<User> findAllByBranch_RegionAndIsDeletedFalse(String region, Pageable pageable);

  Optional<User> findFirstByUserRole(UserRole userRole);

  List<User> findByUserRole(UserRole userRole);
}
