package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Sponsor;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SponsorRepository extends JpaRepository<Sponsor, Long> {

  @Query("SELECT s FROM Sponsor s JOIN FETCH s.user WHERE s.isDeleted = false ORDER BY s.createdAt DESC")
  Page<Sponsor> findAllWithUser(Pageable pageable);

  @Query("SELECT s FROM Sponsor s JOIN FETCH s.user WHERE s.user.name LIKE %:name% AND s.isDeleted = false ORDER BY s.createdAt DESC")
  Page<Sponsor> findByUser_NameContainingIgnoreCaseWithUser(@Param("name") String name, Pageable pageable);

  @Query("SELECT s FROM Sponsor s JOIN FETCH s.user WHERE s.id = :sponsorId AND s.isDeleted = false")
  Optional<Sponsor> findByIdWithUser(@Param("sponsorId") Long sponsorId);
}
