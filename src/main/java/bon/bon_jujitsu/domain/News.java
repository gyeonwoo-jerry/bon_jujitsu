package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

@Builder
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Where(clause = "is_deleted = false")
@Table(name = "news")
public class News extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String content;

  @Builder.Default
  @Column(name = "is_deleted", nullable = false)
  private boolean isDeleted = false;

  @Builder.Default
  @Column(nullable = false)
  private Long viewCount = 0L;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public void updateNews(NewsUpdate newsUpdate) {
    newsUpdate.title().ifPresent(title -> {
      if (!title.isBlank()) this.title = title;
    });

    newsUpdate.content().ifPresent(content -> {
      if (!content.isBlank()) this.content = content;
    });
  }

  public void softDelete() {
    this.isDeleted = true;
  }

  public void increaseViewCount() {
    this.viewCount += 1;
  }
}
