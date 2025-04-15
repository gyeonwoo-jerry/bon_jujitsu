package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.BranchRoleDto;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.GetAllUserRequest;
import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.request.UserRoleRequest;
import bon.bon_jujitsu.dto.response.LoginResponse;
import bon.bon_jujitsu.dto.response.LogoutResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.BranchUserRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.UserSpecification;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final BranchRepository branchRepository;
  private final JwtUtil jwtUtil;
  private final UserImageService userImageService;
  private final BranchUserRepository branchUserRepository;

  public void signup(SignupRequest req, List<MultipartFile> images) {
    String memberId = req.memberId();
    String password = passwordEncoder.encode(req.password());

    //회원 중복 확인
    Optional<User> checkUser = userRepository.findByMemberId(memberId);
    if (checkUser.isPresent()) {
      throw new IllegalArgumentException("중복된 사용자가 존재합니다.");
    }

    // email 중복 확인
    String email = req.email();
    Optional<User> checkEmail = userRepository.findByEmail(email);
    if (checkEmail.isPresent()) {
      throw new IllegalArgumentException("중복된 Email 입니다.");
    }

    // 휴대전화 번호 유효성 검사
    String phoneNum = req.phoneNum();
    String phoneRegex = "^(01[0|1|6|7|8|9])\\d{7,8}$";

    boolean isOnlyDigits = phoneNum.chars().allMatch(Character::isDigit);

    if (!phoneNum.matches(phoneRegex) || !isOnlyDigits) {
      throw new IllegalArgumentException("휴대전화 번호는 숫자만 입력하며, 010으로 시작하는 10~11자리여야 합니다.");
    }

    // 휴대전화 중복 검사
    if (userRepository.findByPhoneNum(phoneNum).isPresent()) {
      throw new IllegalArgumentException("중복된 전화번호입니다.");
    }

    // 지사 확인
    Branch branch = branchRepository.findById(req.branchId())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지사입니다."));

    // 유저를 빌더로 저장
    User user = User.builder()
        .name(req.name())
        .memberId(req.memberId())
        .password(password)
        .email(email)
        .phoneNum(phoneNum)
        .address(req.address())
        .birthday(req.birthday())
        .gender(req.gender())
        .level(req.level())
        .sns1(req.sns1())
        .sns2(req.sns2())
        .sns3(req.sns3())
        .sns4(req.sns4())
        .sns5(req.sns5())
        .stripe(req.stripe())
        .build();
    userRepository.save(user);

    BranchUser branchUser = BranchUser.builder()
        .user(user)
        .branch(branch)
        .userRole(UserRole.PENDING)
        .build();
    branchUserRepository.save(branchUser);

    userImageService.uploadImage(user, images);
  }

  public LoginResponse login(LoginRequest req) {
    User user = userRepository.findByMemberId(req.memberId())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if (user.isDeleted()) {
      throw new IllegalArgumentException("탈퇴한 회원입니다.");
    }

    if (!passwordEncoder.matches(req.password(), user.getPassword())) {
      throw new IllegalArgumentException("아이디나 비밀번호를 정확하게 입력해주세요.");
    }

    if (!user.isAdmin()) {
      boolean onlyPending = user.getBranchUsers().stream()
          .allMatch(bu -> bu.getUserRole() == UserRole.PENDING);
      if (onlyPending) {
        throw new IllegalArgumentException("회원가입 승인 대기 중입니다. 승인 완료 후 로그인할 수 있습니다.");
      }
    }

    JwtUtil.TokenInfo tokenInfo = jwtUtil.createTokens(user.getId());

    List<BranchRoleDto> branchRoles = user.getBranchUsers().stream()
        .map(bu -> new BranchRoleDto(bu.getBranch().getId(), bu.getBranch().getRegion(),
            bu.getUserRole()))
        .toList();

    return new LoginResponse(
        tokenInfo.getAccessToken(),
        tokenInfo.getRefreshToken(),
        user.getName(),
        user.isAdmin(),
        branchRoles
    );
  }

  public LogoutResponse logout(String accessToken) {
    try {
      Long userId = jwtUtil.getPayload(accessToken);

      jwtUtil.logout(userId, accessToken);           // 로그아웃 처리 (ex. Redis 블랙리스트)

      return new LogoutResponse(userId, "정상적으로 로그아웃되었습니다.");
    } catch (Exception e) {
      log.error("로그아웃 처리 중 오류 발생", e);
      throw new IllegalArgumentException("로그아웃 처리 중 오류가 발생했습니다: " + e.getMessage());
    }
  }

  public void assignRole(Long loggedInUserId, UserRoleRequest request) {
    User loggedInUser = userRepository.findById(loggedInUserId)
        .orElseThrow(() -> new IllegalArgumentException("로그인한 회원을 찾을 수 없습니다."));

    User targetUser = userRepository.findByIdAndIsDeletedFalse(request.targetUserId())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

    Branch branch = branchRepository.findById(request.branchId())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지부입니다."));

    BranchUser loginBranchUser = branchUserRepository.findByUserAndBranch(loggedInUser, branch)
        .orElseThrow(() -> new IllegalArgumentException("해당 지부에 소속되지 않은 사용자입니다."));

    // 권한 체크
    if (!loggedInUser.isAdmin()) {
      if (loginBranchUser.getUserRole() != UserRole.OWNER) {
        throw new IllegalArgumentException("권한이 없습니다.");
      }

      // OWNER가 권한 변경 가능한 범위 제한
      List<UserRole> allowedRoles = List.of(UserRole.PENDING, UserRole.USER, UserRole.COACH);
      if (!allowedRoles.contains(request.role())) {
        throw new IllegalArgumentException("OWNER는 PENDING, USER, COACH 역할만 변경할 수 있습니다.");
      }
    }

    // 대상 유저가 이미 해당 지부에 소속되어 있는지 확인
    Optional<BranchUser> optionalBranchUser = branchUserRepository.findByUserAndBranch(targetUser,
        branch);

    if (optionalBranchUser.isPresent()) {
      BranchUser targetBranchUser = optionalBranchUser.get();

      if (targetBranchUser.getUserRole() == request.role()) {
        throw new IllegalArgumentException("이미 " + request.role() + " 역할입니다.");
      }

      // 역할 업데이트
      targetBranchUser.updateUserRole(request.role());
    } else {
      // 소속이 없다면 새롭게 등록
      BranchUser newBranchUser = BranchUser.builder()
          .user(targetUser)
          .branch(branch)
          .userRole(request.role())
          .build();

      branchUserRepository.save(newBranchUser);
    }
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getUsers(int page, int size, Long userId,
      GetAllUserRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    // ADMIN or OWNER 권한 체크
    boolean isAdmin = user.isAdmin();
    List<Long> ownerBranchIds = user.getBranchUsers().stream()
        .filter(bu -> bu.getUserRole() == UserRole.OWNER)
        .map(bu -> bu.getBranch().getId())
        .toList();
    boolean isOwner = !ownerBranchIds.isEmpty();

    // 권한 체크
    if (!isAdmin && !isOwner) {
      throw new IllegalArgumentException("관리자 또는 지부장(Owner) 권한이 없습니다.");
    }

    // 페이지 체크
    if (page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size,
        Sort.by(Sort.Direction.DESC, "createdAt"));

    String name = (request != null) ? request.name() : null;
    UserRole role = (request != null) ? request.role() : null;
    Long branchId = (request != null) ? request.branchId() : null;

    // 검색 조건 없는 경우
    if (name == null && role == null && branchId == null) {
      Page<User> userPage = isAdmin
          ? userRepository.findAllByIsDeletedFalse(pageRequest)
          : userRepository.findAllByBranchIdInAndIsDeletedFalse(ownerBranchIds, pageRequest);

      return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
    }

    // 검색 조건 있는 경우
    if (!isAdmin && isOwner) {
      // Owner는 검색 조건이 있더라도 자신의 지부들 안에서만 필터링
      Specification<User> spec = UserSpecification.withFilters(name, role, ownerBranchIds);
      Page<User> userPage = userRepository.findAll(spec, pageRequest);
      return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
    }

    // Admin인 경우 전체 필터링 가능
    Specification<User> spec = UserSpecification.withFilters(name, role, branchId);
    Page<User> userPage = userRepository.findAll(spec, pageRequest);
    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public UserResponse getProfile(Long userId) {
    User profile = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    return UserResponse.fromEntity(profile);
  }

  public void updateProfile(Long userId, ProfileUpdateRequest request, List<MultipartFile> images) {

    User profile = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    profile.updateProfile(request);

    // 비밀번호 변경 (Optional 체크 후 업데이트)
    request.password().ifPresent(password -> {
      if (!password.isBlank()) {
        profile.changePassword(passwordEncoder.encode(password));
      }
    });

    // 지부 변경
    request.branchId().ifPresent(branchId -> {
      Branch newBranch = branchRepository.findById(branchId)
          .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지사입니다."));

      // 유저가 이미 새 지부에 소속되어 있는지 확인
      boolean alreadyInBranch = profile.getBranchUsers().stream()
          .anyMatch(bu -> bu.getBranch().getId().equals(branchId));

      if (!alreadyInBranch) {
        // 유저의 첫 번째 지부 기준으로 역할 확인 (대표 지부 기준이 없으므로)
        BranchUser currentBranchUser = profile.getBranchUsers().stream()
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("지부 소속 정보가 없습니다."));

        UserRole currentRole = currentBranchUser.getUserRole();

        if (currentRole == UserRole.OWNER || currentRole == UserRole.COACH) {
          throw new IllegalArgumentException("OWNER 또는 COACH는 지부를 변경할 수 없습니다.");
        }

        // 새 지부 등록 + 역할 PENDING 부여
        BranchUser newBranchUser = BranchUser.builder()
            .user(profile)
            .branch(newBranch)
            .userRole(UserRole.PENDING)
            .build();

        branchUserRepository.save(newBranchUser);
      }
    });

    if (images != null && !images.isEmpty()) {
      userImageService.updateImages(profile, images);
    }
  }

  public void deleteUser(Long userId, ProfileDeleteRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    user.softDelete();
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getDeletedUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    if (page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size,
        Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> deletedUsers;

    if (user.isAdmin()) {
      // 관리자: 전체 탈퇴 유저 조회
      deletedUsers = userRepository.findAllByIsDeletedTrueNative(pageRequest);

    } else {
      // 지부장 여부 확인
      List<Long> ownerBranchIds = user.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(bu -> bu.getBranch().getId())
          .toList();

      if (ownerBranchIds.isEmpty()) {
        throw new IllegalArgumentException("탈퇴 회원을 조회할 권한이 없습니다.");
      }

      // 지부장: 해당 지부에 속한 탈퇴 유저 조회
      deletedUsers = userRepository.findDeletedUsersByBranchIdsNative(ownerBranchIds, pageRequest);
    }

    return PageResponse.fromPage(deletedUsers.map(UserResponse::fromEntity));
  }

  public String refreshAccessToken(String refreshToken) {
    return jwtUtil.refreshAccessToken(refreshToken);
  }
}
