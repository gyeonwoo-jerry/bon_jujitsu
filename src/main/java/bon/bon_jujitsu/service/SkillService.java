package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.SkillImage;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.SkillRequest;
import bon.bon_jujitsu.dto.response.SkillResponse;
import bon.bon_jujitsu.dto.update.SkillUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.SkillRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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

  public void createNotice(Long userId, SkillRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    // 공지사항은 OWNER만 작성 가능
    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스킬게시물은 관장만 작성할 수 있습니다.");
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
  public PageResponse<SkillResponse> getSkills(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Skill> skill = skillRepository.findAll(pageRequest);

    Page<SkillResponse> skillResponses = skill.map(skills-> new SkillResponse(
        skills.getId(),
        skills.getTitle(),
        skills.getContent(),
        skills.getUser().getName(),
        skills.getImages().stream().map(SkillImage::getImagePath).toList(),
        skills.getCreatedAt(),
        skills.getModifiedAt()
    ));

    return PageResponse.success(skillResponses, HttpStatus.OK, "스킬게시물 조회 성공");
  }

  @Transactional(readOnly = true)
  public SkillResponse getskill(Long skillId) {
    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    SkillResponse skillResponse = SkillResponse.fromEntity(skill);
    return skillResponse;
  }

  public Status updateSkill(SkillUpdate update, Long userId, Long skillId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스킬게시물은 관장만 수정 할 수 있습니다.");
    }

    skill.updateSkill(update);

    postImageService.updateImages(skill.getId(), "skill", images);

    return Status.builder().status(HttpStatus.OK.value()).message("스킬게시물 수정 완료").build();
  }


  public void deleteSkill(Long userId, Long skillId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Skill skill = skillRepository.findById(skillId).orElseThrow(()-> new IllegalArgumentException("스킬게시물을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("스킬게시물은 관장만 삭제 할 수 있습니다.");
    }

    skill.softDelte();
  }
}
