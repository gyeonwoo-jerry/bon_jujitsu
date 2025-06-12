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
import bon.bon_jujitsu.dto.response.MemberIdCheckResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdate;
import bon.bon_jujitsu.dto.update.UserBranchUpdate;
import bon.bon_jujitsu.dto.update.UserInfoUpdate;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.BranchUserRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.UserSpecification;

import jakarta.validation.constraints.NotBlank;
import java.util.*;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
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

    // 지점 중복 방지 검증
    List<Long> branchIds = req.branchIds();
    Set<Long> uniqueBranchIds = new HashSet<>(branchIds);

    if (uniqueBranchIds.size() != branchIds.size()) {
      throw new IllegalArgumentException("같은 지점에 중복으로 가입할 수 없습니다.");
    }

    // 선택된 지점들이 모두 존재하는지 확인
    List<Branch> branches = branchRepository.findAllById(branchIds);

    if (branches.size() != branchIds.size()) {
      throw new IllegalArgumentException("존재하지 않는 지점이 포함되어 있습니다.");
    }

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

    // 선택된 모든 지점에 대해 BranchUser 생성
    List<BranchUser> branchUsers = branches.stream()
            .map(branch -> BranchUser.builder()
                    .user(user)
                    .branch(branch)
                    .userRole(UserRole.PENDING)
                    .build())
            .toList();

    branchUserRepository.saveAll(branchUsers);

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

    // 권한 체크
    if (!loggedInUser.isAdmin()) {
      BranchUser loginBranchUser = branchUserRepository.findByUserAndBranch(loggedInUser, branch)
              .orElseThrow(() -> new IllegalArgumentException("해당 지부에 소속되지 않은 사용자입니다."));

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
    Optional<BranchUser> optionalBranchUser = branchUserRepository.findByUserAndBranch(targetUser, branch);

    if (optionalBranchUser.isPresent()) {
      BranchUser targetBranchUser = optionalBranchUser.get();

      if (targetBranchUser.getUserRole() == request.role()) {
        throw new IllegalArgumentException("이미 " + request.role() + " 역할입니다.");
      }

      // 역할 업데이트
      targetBranchUser.updateUserRole(request.role());
    } else {
      // 소속이 없다면 새롭게 등록 (어드민이거나 OWNER인 경우 허용)
      BranchUser newBranchUser = BranchUser.builder()
              .user(targetUser)
              .branch(branch)
              .userRole(request.role())
              .build();

      branchUserRepository.save(newBranchUser);
    }
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getUsers(int page, int size, Long userId, GetAllUserRequest request) {
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
    List<Long> branchIds = (request != null) ? request.branchIds() : null;

    // OWNER 권한 검증 - 요청된 branchIds가 자신이 관리하는 지부에 포함되는지 확인
    if (!isAdmin && isOwner && branchIds != null && !branchIds.isEmpty()) {
      List<Long> unauthorizedBranches = branchIds.stream()
              .filter(branchId -> !ownerBranchIds.contains(branchId))
              .toList();

      if (!unauthorizedBranches.isEmpty()) {
        throw new IllegalArgumentException("해당 지부의 회원을 조회할 권한이 없습니다: " + unauthorizedBranches);
      }
    }

    // 검색 조건 없는 경우 (전체 조회)
    if (name == null && role == null && (branchIds == null || branchIds.isEmpty())) {
      Page<User> userPage = isAdmin
              ? userRepository.findAllByIsDeletedFalse(pageRequest)
              : userRepository.findAllByBranchIdInAndIsDeletedFalse(ownerBranchIds, pageRequest);

      return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
    }

    // 검색 조건이 있는 경우
    List<Long> finalBranchIds;
    if (!isAdmin && isOwner) {
      // OWNER인 경우: branchIds가 지정되면 해당 지부들, 없으면 자신이 관리하는 모든 지부
      finalBranchIds = (branchIds != null && !branchIds.isEmpty()) ? branchIds : ownerBranchIds;
    } else {
      // ADMIN인 경우: branchIds가 지정되면 해당 지부들, 없으면 null (전체 조회)
      finalBranchIds = branchIds;
    }

    Specification<User> spec = UserSpecification.withFilters(name, role, finalBranchIds);
    Page<User> userPage = userRepository.findAll(spec, pageRequest);
    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public UserResponse getProfile(Long userId) {
    User profile = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    return UserResponse.fromEntity(profile);
  }

  public void updateProfile(Long userId, ProfileUpdate request, List<MultipartFile> images, List<Long> keepImageIds) {

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
    request.branchIds().ifPresent(newBranchIds -> {
      if (newBranchIds != null && !newBranchIds.isEmpty()) {
        updateUserBranches(profile, newBranchIds);
      }
    });

      userImageService.updateImages(profile, images, keepImageIds);
  }

  // 지부 업데이트 로직을 별도 메서드로 분리
  private void updateUserBranches(User user, List<Long> newBranchIds) {
    // 중복 지부 ID 제거
    Set<Long> uniqueBranchIds = new HashSet<>(newBranchIds);
    if (uniqueBranchIds.size() != newBranchIds.size()) {
      throw new IllegalArgumentException("같은 지부에 중복으로 가입할 수 없습니다.");
    }

    // 새로운 지부들이 모두 존재하는지 확인
    List<Branch> newBranches = branchRepository.findAllById(newBranchIds);
    if (newBranches.size() != newBranchIds.size()) {
      throw new IllegalArgumentException("존재하지 않는 지부가 포함되어 있습니다.");
    }

    // 현재 사용자의 지부 소속 정보
    List<BranchUser> currentBranchUsers = user.getBranchUsers();
    Set<Long> currentBranchIds = currentBranchUsers.stream()
            .map(bu -> bu.getBranch().getId())
            .collect(Collectors.toSet());

    // OWNER 또는 COACH 역할을 가진 지부가 있는지 확인
    boolean hasSpecialRole = currentBranchUsers.stream()
            .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER || bu.getUserRole() == UserRole.COACH);

    if (hasSpecialRole) {
      throw new IllegalArgumentException("OWNER 또는 COACH 역할을 가진 사용자는 지부를 변경할 수 없습니다.");
    }

    // 추가할 지부들 (새로운 지부 중 현재 소속되지 않은 지부들)
    Set<Long> branchesToAdd = new HashSet<>(uniqueBranchIds);
    branchesToAdd.removeAll(currentBranchIds);

    // 제거할 지부들 (현재 소속 지부 중 새로운 목록에 없는 지부들)
    Set<Long> branchesToRemove = new HashSet<>(currentBranchIds);
    branchesToRemove.removeAll(uniqueBranchIds);

    // 지부 제거
    if (!branchesToRemove.isEmpty()) {
      List<BranchUser> branchUsersToRemove = currentBranchUsers.stream()
              .filter(bu -> branchesToRemove.contains(bu.getBranch().getId()))
              .toList();
      branchUserRepository.deleteAll(branchUsersToRemove);
    }

    // 지부 추가
    if (!branchesToAdd.isEmpty()) {
      Map<Long, Branch> branchMap = newBranches.stream()
              .collect(Collectors.toMap(Branch::getId, branch -> branch));

      List<BranchUser> newBranchUsers = branchesToAdd.stream()
              .map(branchId -> {
                Branch branch = branchMap.get(branchId);
                return BranchUser.builder()
                        .user(user)
                        .branch(branch)
                        .userRole(UserRole.PENDING) // 새로 추가되는 지부에서는 PENDING 상태로 시작
                        .build();
              })
              .toList();

      branchUserRepository.saveAll(newBranchUsers);
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
        Sort.by(Sort.Direction.DESC, "id"));

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

  public void updateBranch(Long adminUserId, UserBranchUpdate update) {
    // 관리자 권한 확인
    User adminUser = userRepository.findById(adminUserId)
            .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    if (!adminUser.isAdminUser()) {
      throw new IllegalArgumentException("관리자만 가능한 기능입니다.");
    }

    // 대상 사용자 조회
    User targetUser = userRepository.findById(update.targetUserId())
            .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    // 브랜치 추가
    if (update.branchesToAdd() != null && !update.branchesToAdd().isEmpty()) {
      addUserToBranches(targetUser, update.branchesToAdd());
    }

    // 브랜치 제거
    if (update.branchesToRemove() != null && !update.branchesToRemove().isEmpty()) {
      removeUserFromBranches(targetUser, update.branchesToRemove());
    }
  }

  private void addUserToBranches(User user, List<Long> branchesToAdd) {
    for (Long branchId : branchesToAdd) {
      // 브랜치 존재 여부 확인
      Branch branch = branchRepository.findById(branchId)
              .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

      // 이미 해당 브랜치에 속해있는지 확인
      boolean alreadyExists = branchUserRepository.existsByUserIdAndBranchId(
              user.getId(), branch.getId());

      if (!alreadyExists) {
        // 새로운 BranchUser 생성 (기본 역할은 PENDING로 설정)
        BranchUser branchUser = BranchUser.builder()
                .user(user)
                .branch(branch)
                .userRole(UserRole.PENDING)
                .build();
        branchUserRepository.save(branchUser);
      }
    }
  }

  private void removeUserFromBranches(User user, List<Long> branchesToRemove) {
    for (Long branchId : branchesToRemove) {
      // 브랜치 존재 여부 확인
      Branch branch = branchRepository.findById(branchId)
              .orElseThrow(() -> new IllegalArgumentException("지부를 찾을 수 없습니다."));

      // BranchUser 관계 삭제
      BranchUser branchUser = branchUserRepository
              .findByUserIdAndBranchId(user.getId(), branch.getId())
              .orElseThrow(() -> new IllegalArgumentException("해당 정보가 없습니다."));

      branchUserRepository.delete(branchUser);
    }
  }

  public void updateUserInfo(Long adminUserId, UserInfoUpdate update) {
    // 관리자 권한 확인
    User adminUser = userRepository.findById(adminUserId)
            .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    if (!adminUser.isAdminUser()) {
      throw new IllegalArgumentException("관리자만 가능한 기능입니다.");
    }

    // 대상 사용자 조회
    User targetUser = userRepository.findById(update.targetUserId())
            .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    // 레벨 업데이트
    if (update.level().isPresent()) {
      targetUser.updateLevel(update.level().get());
    }

    // 스트라이프 업데이트
    if (update.stripe().isPresent()) {
      targetUser.updateStripe(update.stripe().get());
    }
  }

  public MemberIdCheckResponse checkMemberIdDuplicate(String memberId) {
    // 아이디 유효성 검사
    if (memberId == null || memberId.trim().isEmpty()) {
      throw new IllegalArgumentException("아이디를 입력해주세요.");
    }

    if (memberId.length() < 4) {
      throw new IllegalArgumentException("아이디는 4자리 이상 입력해주세요.");
    }

    // 아이디 패턴 검사 (영문, 숫자, 특수문자 조합 등)
    if (!isValidMemberIdPattern(memberId)) {
      throw new IllegalArgumentException("아이디는 영문, 숫자만 사용 가능합니다.");
    }

    // 데이터베이스에서 중복 확인
    boolean exists = userRepository.existsByMemberId(memberId);

    if (exists) {
      return new MemberIdCheckResponse(false, "이미 사용중인 아이디입니다.");
    } else {
      return new MemberIdCheckResponse(true, "사용 가능한 아이디입니다.");
    }
  }

  // 아이디 패턴 검증 메서드
  private boolean isValidMemberIdPattern(String memberId) {
    // 영문, 숫자만 허용하는 정규식 (4-20자)
    String pattern = "^[a-zA-Z0-9]{4,20}$";
    return memberId.matches(pattern);
  }
}
