package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {

  Page<Skill> findByUser_NameContainingIgnoreCase(String name, PageRequest pageRequest);
}
