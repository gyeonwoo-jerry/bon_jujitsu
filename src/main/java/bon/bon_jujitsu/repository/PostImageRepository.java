package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    @Query("SELECT pi FROM PostImage pi WHERE pi.postType = :postType AND pi.postId = :postId")
    List<PostImage> findByPostTypeAndPostId(@Param("postType") PostType postType, @Param("postId") Long postId);
}
