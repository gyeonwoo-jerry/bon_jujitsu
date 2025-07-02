package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.News;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsRepository extends JpaRepository<News, Long> {

  @Query("SELECT DISTINCT n FROM News n " +
      "LEFT JOIN FETCH n.user " +
      "WHERE LOWER(n.user.name) LIKE LOWER(CONCAT('%', :name, '%')) " +
      "ORDER BY n.createdAt DESC")
  Page<News> findByUserNameContainingIgnoreCaseWithFetch(@Param("name") String name, PageRequest pageRequest);

  @Query("SELECT DISTINCT n FROM News n " +
      "LEFT JOIN FETCH n.user " +
      "ORDER BY n.createdAt DESC")
  Page<News> findAllWithFetch(PageRequest pageRequest);

  @Query("SELECT DISTINCT n FROM News n " +
      "LEFT JOIN FETCH n.user " +
      "WHERE n.id = :newsId")
  Optional<News> findByIdWithFetch(@Param("newsId") Long newsId);
}
