package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.SkillPosition;
import bon.bon_jujitsu.domain.SkillType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SkillRepository extends JpaRepository<Skill, Long> {

  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.isDeleted = false")
  Page<Skill> findAllWithUser(Pageable pageable);

  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.id = :skillId AND s.isDeleted = false")
  Optional<Skill> findByIdWithUser(@Param("skillId") Long skillId);

  // 포지션별 조회
  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.position = :position AND s.isDeleted = false ORDER BY s.createdAt DESC")
  Page<Skill> findByPositionWithUser(@Param("position") SkillPosition position, Pageable pageable);

  // 기술 타입별 조회
  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.skillType = :skillType AND s.isDeleted = false ORDER BY s.createdAt DESC")
  Page<Skill> findBySkillTypeWithUser(@Param("skillType") SkillType skillType, Pageable pageable);

  // 포지션 + 기술 타입 조회
  @Query("SELECT s FROM Skill s JOIN FETCH s.user WHERE s.position = :position AND s.skillType = :skillType AND s.isDeleted = false ORDER BY s.createdAt DESC")
  Page<Skill> findByPositionAndSkillTypeWithUser(@Param("position") SkillPosition position, @Param("skillType") SkillType skillType, Pageable pageable);

}
