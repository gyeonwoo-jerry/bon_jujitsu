package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SkillRequest;
import bon.bon_jujitsu.dto.response.ImageResponse;
import bon.bon_jujitsu.dto.response.SkillResponse;
import bon.bon_jujitsu.dto.update.SkillUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.SkillRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
public class SkillService {

  private final SkillRepository skillRepository;
  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final PostImageService postImageService;
  private final PostImageRepository postImageRepository;

  public void createSkill(Long userId, SkillRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 작성할 수 있습니다.");
    }

    Skill skill = Skill.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    skillRepository.save(skill);

    postImageService.uploadImage(skill.getId(), PostType.SKILL, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<SkillResponse> getSkills(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Skill> skills;

    if (name != null && !name.isBlank()) {
      // 작성자 이름으로 필터링
      skills = skillRepository.findByUser_NameContainingIgnoreCase(name, pageRequest);
    } else {
      // 전체 스킬 조회
      skills = skillRepository.findAll(pageRequest);
    }

    Page<SkillResponse> skillResponses = skills.map(skill -> {
      // 이미지 경로를 ImageResponse 객체 리스트로 변환
      List<ImageResponse> imageResponses = postImageRepository.findByPostTypeAndPostId(PostType.SKILL, skill.getId())
          .stream()
          .map(postImage -> {
            String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
            return ImageResponse.builder()
                .id(postImage.getId()) // PostImage의 ID 사용
                .url(path)
                .build();
          })
          .collect(Collectors.toList());

      return new SkillResponse(
          skill.getId(),
          skill.getTitle(),
          skill.getContent(),
          skill.getUser().getName(),
          imageResponses,
          skill.getViewCount(),
          skill.getCreatedAt(),
          skill.getModifiedAt()
      );
    });

    return PageResponse.fromPage(skillResponses);
  }

  public SkillResponse getSkill(Long skillId, HttpServletRequest request) {
    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    HttpSession session = request.getSession();
    String sessionKey = "viewed_skill_" + skillId;

    if (session.getAttribute(sessionKey) == null) {
      skill.increaseViewCount(); // 처음 본 경우에만 조회수 증가
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60); // 1시간 유지
    }

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId(PostType.SKILL, skill.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              return path;
            })
            .toList();

    return SkillResponse.fromEntity(skill, imagePaths);
  }

  public void updateSkill(SkillUpdate update, Long userId, Long skillId, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId)
        .orElseThrow(() -> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.isAdmin()) {
    }
    else if (user.getBranchUsers().stream().anyMatch(bu -> bu.getUserRole() == UserRole.OWNER)) {
      if (!skill.getUser().getId().equals(user.getId())) {
        throw new IllegalArgumentException("본인이 작성한 스킬게시물만 수정할 수 있습니다.");
      }
    }
    else {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 수정할 수 있습니다.");
    }

    skill.updateSkill(update);

    postImageService.updateImages(skill.getId(), PostType.SKILL, images, keepImageIds);
  }


  public void deleteSkill(Long userId, Long skillId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.isAdmin()) {
    }
    else if (user.getBranchUsers().stream().anyMatch(bu -> bu.getUserRole() == UserRole.OWNER)) {
      if (!skill.getUser().getId().equals(user.getId())) {
        throw new IllegalArgumentException("본인이 작성한 스킬게시물만 삭제할 수 있습니다.");
      }
    }
    else {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 삭제할 수 있습니다.");
    }

    skill.softDelete();
  }
}
