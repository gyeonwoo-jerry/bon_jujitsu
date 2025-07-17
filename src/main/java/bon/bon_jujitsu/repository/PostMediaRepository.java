package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.PostType;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {

    // 기존 메서드 (이미 구현되어 있음)
    @Query("SELECT pm FROM PostMedia pm WHERE pm.postType = :postType AND pm.postId = :postId")
    List<PostMedia> findByPostTypeAndPostId(@Param("postType") PostType postType, @Param("postId") Long postId);

    // 여러 게시물의 미디어 일괄 조회 (N+1 문제 해결용)
    List<PostMedia> findByPostTypeAndPostIdIn(PostType postType, Set<Long> postIds);
}