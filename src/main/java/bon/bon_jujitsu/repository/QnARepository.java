package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.QnA;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QnARepository extends JpaRepository<QnA, Long> {

    @Query("SELECT q FROM QnA q LEFT JOIN FETCH q.user ORDER BY q.createdAt DESC")
    Page<QnA> findAllWithUser(PageRequest pageRequest);

    @Query("SELECT q FROM QnA q LEFT JOIN FETCH q.user WHERE q.id = :id")
    Optional<QnA> findByIdWithUser(@Param("id") Long id);
}
