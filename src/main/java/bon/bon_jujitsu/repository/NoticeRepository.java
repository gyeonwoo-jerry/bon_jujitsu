package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    Optional<Notice> findTopByBranchOrderByCreatedAtDesc(Branch branch);
}
