package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Skill;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SkillRepository extends JpaRepository<Skill, Long> {

  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.user.name LIKE %:name% AND s.isDeleted = false")
  Page<Skill> findByUser_NameContainingIgnoreCaseWithUser(@Param("name") String name, Pageable pageable);

  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.isDeleted = false")
  Page<Skill> findAllWithUser(Pageable pageable);

  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.id = :skillId AND s.isDeleted = false")
  Optional<Skill> findByIdWithUser(@Param("skillId") Long skillId);
}
