package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.SkillRequest;
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

    branchRepository.findById(user.getBranch().getId()).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관장님, 관리자만 공지 등록이 가능합니다.");
    }

    Skill skill = Skill.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    skillRepository.save(skill);

    postImageService.uploadImage(skill.getId(), "skill", images);
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
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("SKILL", skill.getId())
          .stream()
          .map(postImage -> Optional.ofNullable(postImage.getImagePath()).orElse(""))
          .collect(Collectors.toList());

      return new SkillResponse(
          skill.getId(),
          skill.getTitle(),
          skill.getContent(),
          skill.getUser().getName(),
          imagePaths,
          skill.getViewCount(),
          skill.getCreatedAt(),
          skill.getModifiedAt()
      );
    });

    return PageResponse.fromPage(skillResponses);
  }

  @Transactional(readOnly = true)
  public SkillResponse getSkill(Long skillId, HttpServletRequest request) {
    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    HttpSession session = request.getSession();
    String sessionKey = "viewed_skill_" + skillId;

    if (session.getAttribute(sessionKey) == null) {
      skill.increaseViewCount(); // 처음 본 경우에만 조회수 증가
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60); // 1시간 유지
    }

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("SKILL", skill.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              return path;
            })
            .toList();

    return SkillResponse.fromEntity(skill, imagePaths);
  }

  public void updateSkill(SkillUpdate update, Long userId, Long skillId, List<MultipartFile> images) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId)
        .orElseThrow(() -> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 수정 할 수 있습니다.");
    }

    if (user.getUserRole() == UserRole.OWNER && !skill.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스킬게시물만 수정할 수 있습니다.");
    }

    skill.updateSkill(update);

    if (images != null && !images.isEmpty()) {
      postImageService.updateImages(skill.getId(), "skill", images);
    }
  }


  public void deleteSkill(Long userId, Long skillId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("스킬게시물은 관장이나 관리자만 삭제 할 수 있습니다.");
    }

    if (user.getUserRole() == UserRole.OWNER && !skill.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 스킬게시물만 삭제할 수 있습니다.");
    }

    skill.softDelete();
  }
}
