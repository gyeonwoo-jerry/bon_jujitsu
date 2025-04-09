package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Notice;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NoticeRepository extends JpaRepository<Notice, Long>,
    JpaSpecificationExecutor<Notice> {

  Optional<Notice> findTopByBranchOrderByCreatedAtDesc(Branch branch);
}
