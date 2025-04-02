package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

  Optional<User> findByIdAndIsDeletedFalse(Long id);

  Optional<User> findByEmail(String email);

  Optional<User> findByPhoneNum(String phoneNum);

  Optional<User> findByMemberId(String nickname);

  Page<User> findAllByIsDeletedFalse(Pageable pageable);

  Page<User> findAllByBranch_IdAndIsDeletedFalse(Long id, PageRequest pageRequest);

  Page<User> findAllByIsDeletedTrue(PageRequest pageRequest);
}
