package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<News, Long> {

  Page<News> findByUser_NameContainingIgnoreCase(String name, PageRequest pageRequest);
}
