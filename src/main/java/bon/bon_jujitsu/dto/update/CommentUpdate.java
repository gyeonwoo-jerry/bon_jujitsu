package bon.bon_jujitsu.dto.update;

public record CommentUpdate(
    String content,
    Long parentId
) {

}
