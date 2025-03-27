package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Builder.Default
  @OneToMany(mappedBy = "news", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<NewsImage> images = new ArrayList<>();

  public void updateNews(NewsUpdate newsUpdate) {
    newsUpdate.title().ifPresent(title -> {
      if (!title.isBlank()) this.title = title;
    });

    newsUpdate.content().ifPresent(content -> {
      if (!content.isBlank()) this.content = content;
    });
  }

  public void softDelte() {
    this.isDeleted = true;
    this.images.forEach(NewsImage::softDelete);
  }

}
