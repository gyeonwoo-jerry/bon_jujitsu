package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.UserImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserImageRepository extends JpaRepository<UserImage, Long> {
    List<UserImage> findByUserId(Long id);
}
