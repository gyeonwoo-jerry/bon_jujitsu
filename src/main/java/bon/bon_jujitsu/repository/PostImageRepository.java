package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    List<PostImage> findByPostIdAndPostType(Long postId, String postType);

    List<PostImage> findByPostTypeAndPostId(String board, Long id);
}
