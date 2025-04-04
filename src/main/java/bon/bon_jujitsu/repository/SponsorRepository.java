package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Sponsor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SponsorRepository extends JpaRepository<Sponsor, Long> {

  Page<Sponsor> findByUser_NameContainingIgnoreCase(String name, PageRequest pageRequest);
}
