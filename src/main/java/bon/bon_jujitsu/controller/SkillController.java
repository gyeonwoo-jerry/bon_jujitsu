package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
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
  public ApiResponse<Void> createSkill(
      @AuthenticationUserId Long userId,
      @Valid @RequestPart("request") SkillRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    skillService.createSkill(userId, request, images);
    return ApiResponse.success("기술 게시물 생성 완료", null);
  }

  @GetMapping("/skill")
  public ApiResponse<PageResponse<SkillResponse>> getSkills (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ApiResponse.success("기술 게시물 목록 조회 성공", skillService.getSkills(page, size));
  }

  @GetMapping("/skill/{skillId}")
  public ApiResponse<SkillResponse> getSkill(
      @PathVariable("skillId") Long skillId
  ) {
    return ApiResponse.success("기술 게시물 조회 성공", skillService.getSkill(skillId));
  }

  @PatchMapping("/skill/{skillId}")
  public ApiResponse<Status> updateSkill(
      @Valid @RequestPart("update") SkillUpdate update,
      @AuthenticationUserId Long userId,
      @PathVariable("skillId") Long skillId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    skillService.updateSkill(update, userId, skillId, images);
    return ApiResponse.success("기술 게시물 수정 성공", null);
  }

  @DeleteMapping("/skill/{skillId}")
  private ApiResponse<Status> deleteNotice(
      @AuthenticationUserId Long userId,
      @PathVariable("skillId") Long skillId
  ) {
    skillService.deleteSkill(userId, skillId);
    return ApiResponse.success("기술 게시물 삭제 성공", null);
  }
}

