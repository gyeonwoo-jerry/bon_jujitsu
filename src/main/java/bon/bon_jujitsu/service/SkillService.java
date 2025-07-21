package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.*;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SkillRequest;
import bon.bon_jujitsu.dto.response.SkillResponse;
import bon.bon_jujitsu.dto.update.SkillUpdate;
import bon.bon_jujitsu.repository.PostMediaRepository;
import bon.bon_jujitsu.repository.SkillRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SkillService {

  private final SkillRepository skillRepository;
  private final UserRepository userRepository;
  private final PostMediaService postMediaService;
  private final PostMediaRepository postMediaRepository;

  private static final String VIEWED_SKILL_PREFIX = "viewed_skill_";
  private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

  /**
   * 스킬 게시물 생성
   */
  @CacheEvict(value = "skills", allEntries = true)
  public void createSkill(Long userId, SkillRequest request, List<MultipartFile> files) {
    User user = findUserById(userId);

    // 권한 검증 (관장 또는 관리자만 작성 가능)
    validateSkillCreatePermission(user);

    Skill skill = Skill.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    skillRepository.save(skill);

    if (files != null && !files.isEmpty()) {
      postMediaService.uploadMedia(skill.getId(), PostType.SKILL, files);
    }
  }

  /**
   * 스킬 게시물 목록 조회 (N+1 문제 해결)
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "skills", key = "#page + '_' + #size + '_' + (#name != null ? #name : 'all')")
  public PageResponse<SkillResponse> getSkills(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // N+1 문제 방지를 위한 fetch join 사용
    Page<Skill> skills = (name != null && !name.isBlank())
        ? skillRepository.findByUser_NameContainingIgnoreCaseWithUser(name, pageRequest)
        : skillRepository.findAllWithUser(pageRequest);

    if (skills.isEmpty()) {
      return PageResponse.fromPage(skills.map(skill -> null));
    }

    // 이미지만 별도로 배치 로딩
    Set<Long> skillIds = skills.getContent().stream()
        .map(Skill::getId)
        .collect(Collectors.toSet());

    Map<Long, List<PostMedia>> fileMap = loadFilesInBatch(skillIds);

    // SkillResponse 생성
    return PageResponse.fromPage(skills.map(skill -> {
      List<PostMedia> files = fileMap.getOrDefault(skill.getId(), Collections.emptyList());
      return SkillResponse.fromEntity(skill, files);
    }));
  }

  /**
   * 스킬 게시물 상세 조회 (N+1 문제 해결)
   */
  public SkillResponse getSkill(Long skillId, HttpServletRequest request) {
    // N+1 문제 방지를 위한 fetch join 사용
    Skill skill = skillRepository.findByIdWithUser(skillId)
        .orElseThrow(() -> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    // 세션 기반 조회수 증가 처리
    handleViewCountIncrease(skill, skillId, request);

    // 이미지 조회
    List<PostMedia> postMedia = postMediaRepository.findByPostTypeAndPostId(PostType.SKILL, skill.getId());

    return SkillResponse.fromEntity(skill, postMedia);
  }

  /**
   * 스킬 게시물 수정
   */
  @CacheEvict(value = {"skills", "skill"}, allEntries = true)
  public void updateSkill(SkillUpdate update, Long userId, Long skillId,
      List<MultipartFile> files, List<Long> keepfileIds) {
    User user = findUserById(userId);
    Skill skill = findSkillById(skillId);

    // 권한 검증
    validateSkillUpdatePermission(user, skill);

    skill.updateSkill(update);

    if (files != null || keepfileIds != null) {
      postMediaService.updateMedia(skill.getId(), PostType.SKILL, files, keepfileIds);
    }
  }

  /**
   * 스킬 게시물 삭제
   */
  @CacheEvict(value = {"skills", "skill"}, allEntries = true)
  public void deleteSkill(Long userId, Long skillId) {
    User user = findUserById(userId);
    Skill skill = findSkillById(skillId);

    // 권한 검증
    validateSkillDeletePermission(user, skill);

    // 소프트 삭제 실행
    skill.softDelete();
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private Skill findSkillById(Long skillId) {
    return skillRepository.findById(skillId)
        .orElseThrow(() -> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));
  }

  private boolean isOwnerOrAdmin(User user) {
    return user.isAdmin() ||
        user.getBranchUsers().stream()
            .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER);
  }

  private void validateSkillCreatePermission(User user) {
    if (!isOwnerOrAdmin(user)) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 작성할 수 있습니다.");
    }
  }

  private void validateSkillUpdatePermission(User user, Skill skill) {
    if (user.isAdmin()) {
      // 관리자는 모든 글 수정 가능
      return;
    }

    boolean isOwner = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER);

    if (!isOwner) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 수정할 수 있습니다.");
    }

    // 관장이지만 본인 글이 아닌 경우
    if (!skill.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스킬게시물만 수정할 수 있습니다.");
    }
  }

  private void validateSkillDeletePermission(User user, Skill skill) {
    if (user.isAdmin()) {
      // 관리자는 모든 글 삭제 가능
      return;
    }

    boolean isOwner = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER);

    if (!isOwner) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 삭제할 수 있습니다.");
    }

    // 관장이지만 본인 글이 아닌 경우
    if (!skill.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스킬게시물만 삭제할 수 있습니다.");
    }
  }

  private Map<Long, List<PostMedia>> loadFilesInBatch(Set<Long> skillIds) {
    List<PostMedia> allfiles = postMediaRepository.findByPostTypeAndPostIdIn(PostType.SKILL, skillIds);
    return allfiles.stream()
        .collect(Collectors.groupingBy(PostMedia::getPostId));
  }

  private void handleViewCountIncrease(Skill skill, Long skillId, HttpServletRequest request) {
    HttpSession session = request.getSession();
    String sessionKey = VIEWED_SKILL_PREFIX + skillId;

    Long lastViewTime = (Long) session.getAttribute(sessionKey);
    long currentTime = System.currentTimeMillis();

    // 5초(5000ms) 이내 중복 호출 방지
    if (lastViewTime == null || (currentTime - lastViewTime) > 5000) {
      skill.increaseViewCount();
      session.setAttribute(sessionKey, currentTime);
      session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
    } else {
      long timeDiff = currentTime - lastViewTime;
    }
  }
}