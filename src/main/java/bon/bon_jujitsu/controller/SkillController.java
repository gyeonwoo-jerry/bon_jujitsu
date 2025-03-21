package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.SkillRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.response.SkillResponse;
import bon.bon_jujitsu.dto.update.SkillUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.SkillService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SkillController {

  private final SkillService skillService;

  @PostMapping("/skill")
  public ResponseEntity<Status> createSkill(
      @AuthenticationUserId Long id,
      @Valid @RequestPart("request") SkillRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    skillService.createNotice(id, request, images);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "기술게시판 생성 완료"));
  }

  @GetMapping("/skill")
  public ResponseEntity<PageResponse<SkillResponse>> getSkills (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(skillService.getSkills(page, size));
  }

  @GetMapping("/skill/{skillId}")
  public ResponseEntity<SkillResponse> getskill(
      @PathVariable("skillId") Long skillId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(skillService.getskill(skillId));
  }

  @PatchMapping("/skill/{skillId}")
  public ResponseEntity<Status> updateSkill(
      @Valid @RequestPart("update") SkillUpdate update,
      @AuthenticationUserId Long id,
      @PathVariable("skillId") Long skillId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(skillService.updateSkill(update, id, skillId, images));
  }

  @DeleteMapping("/skill/{skillId}")
  private ResponseEntity<Status> deleteNotice(
      @AuthenticationUserId Long id,
      @PathVariable("skillId") Long skillId
  ) {
    skillService.deleteSkill(id, skillId);
    return ResponseEntity.noContent().build();
  }
}

