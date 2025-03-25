package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.BranchImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchImageRepository extends JpaRepository<BranchImage, Long> {
    List<BranchImage> findByBranchId(Long id);
}
