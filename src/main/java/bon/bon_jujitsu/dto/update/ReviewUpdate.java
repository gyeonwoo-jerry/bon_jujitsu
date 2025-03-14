package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReviewUpdate (
    String content,
    @Min(0)
    @Max(5)
    double star,
    Long parentId
){

}
