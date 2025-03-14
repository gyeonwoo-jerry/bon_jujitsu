package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
}
