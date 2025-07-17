package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.Stripe;
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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

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

  private static final String PHONE_REGEX = "^(01[0|1|6|7|8|9])\\d{7,8}$";
  private static final String MEMBER_ID_PATTERN = "^[a-zA-Z0-9]{4,20}$";
  private static final int MIN_MEMBER_ID_LENGTH = 4;

  /**
   * 회원가입
   */
  @CacheEvict(value = "users", allEntries = true)
  public void signup(SignupRequest req, List<MultipartFile> images) {
    // 중복 검증
    validateUserDuplication(req.memberId(), req.email(), req.phoneNum());

    // 휴대전화 유효성 검증
    validatePhoneNumber(req.phoneNum());

    // 지점 유효성 검증
    List<Branch> branches = validateAndGetBranches(req.branchIds());

    // 유저 생성 및 저장
    User user = createUser(req);
    userRepository.save(user);

    // 지점 관계 설정
    createBranchUserRelations(user, branches);

    // 이미지 업로드
    if (images != null && !images.isEmpty()) {
      userImageService.uploadImage(user, images);
    }
  }

  /**
   * 로그인
   */
  public LoginResponse login(LoginRequest req) {
    User user = findUserByMemberId(req.memberId());

    // 로그인 유효성 검증
    validateLogin(user, req.password());

    // JWT 토큰 생성
    JwtUtil.TokenInfo tokenInfo = jwtUtil.createTokens(user.getId());

    // 지점 역할 정보 생성
    List<BranchRoleDto> branchRoles = createBranchRoleDtos(user);

    return new LoginResponse(
        tokenInfo.getAccessToken(),
        tokenInfo.getRefreshToken(),
        user.getName(),
        user.isAdmin(),
        branchRoles
    );
  }

  /**
   * 로그아웃
   */
  public LogoutResponse logout(String accessToken) {
    try {
      if (jwtUtil.isTokenBlacklisted(accessToken)) {
        log.info("이미 로그아웃된 토큰으로 요청: {}", accessToken);
        return new LogoutResponse(null, "이미 로그아웃 처리된 사용자입니다.");
      }

      Long userId = jwtUtil.getPayload(accessToken);
      jwtUtil.logout(userId, accessToken);

      return new LogoutResponse(userId, "정상적으로 로그아웃되었습니다.");
    } catch (Exception e) {
      log.error("로그아웃 처리 중 오류 발생", e);
      throw new IllegalArgumentException("로그아웃 처리 중 오류가 발생했습니다: " + e.getMessage());
    }
  }

  /**
   * 사용자 역할 할당
   */
  @CacheEvict(value = "users", allEntries = true)
  public void assignRole(Long loggedInUserId, UserRoleRequest request) {
    User loggedInUser = findUserById(loggedInUserId);
    User targetUser = findActiveUserById(request.targetUserId());
    Branch branch = findBranchById(request.branchId());

    // 권한 검증
    validateRoleAssignmentPermission(loggedInUser, branch, request.role());

    // 역할 할당 또는 업데이트
    assignOrUpdateUserRole(targetUser, branch, request.role());
  }

  /**
   * 사용자 목록 조회 (N+1 문제 해결)
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "users", key = "#page + '_' + #size + '_' + #userId + '_' + (#request != null ? #request.toString() : 'all')")
  public PageResponse<UserResponse> getUsers(int page, int size, Long userId, GetAllUserRequest request) {
    User user = findUserById(userId);

    // 권한 검증 및 조회 범위 결정
    UserQueryContext context = validateAndCreateQueryContext(user);

    // 페이지 검증
    validatePageRequest(page, size);

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // 필터 조건 추출
    FilterConditions filters = extractFilterConditions(request, context);

    // 검색 조건에 따른 조회
    Page<User> userPage = executeUserQuery(filters, pageRequest, context);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  /**
   * 프로필 조회
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "userProfile", key = "#userId")
  public UserResponse getProfile(Long userId) {
    // 1단계: BranchUsers와 함께 User 조회
    User profile = userRepository.findByIdWithBranchUsersAndIsDeletedFalse(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    // 2단계: Images Lazy Loading 강제 초기화 (가장 간단)
    profile.getImages().size(); // 이 한 줄이 images를 로딩함

    return UserResponse.fromEntity(profile);
  }

  /**
   * 프로필 수정
   */
  @CacheEvict(value = {"users", "userProfile"}, allEntries = true)
  public void updateProfile(Long userId, ProfileUpdate request, List<MultipartFile> images, List<Long> keepImageIds) {
    User profile = findUserById(userId);

    profile.updateProfile(request);

    // 비밀번호 변경
    updatePasswordIfPresent(profile, request.password());

    // 지점 변경
    updateUserBranches(profile, request);

    // 이미지 업데이트
    if (images != null || keepImageIds != null) {
      userImageService.updateImages(profile, images, keepImageIds);
    }
  }

  /**
   * 사용자 삭제
   */
  @CacheEvict(value = {"users", "userProfile"}, allEntries = true)
  public void deleteUser(Long userId, ProfileDeleteRequest request) {
    User user = findUserById(userId);

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    user.softDelete();
  }

  /**
   * 삭제된 사용자 목록 조회
   */
  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getDeletedUsers(int page, int size, Long userId) {
    User user = findUserById(userId);
    validatePageRequest(page, size);

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));

    Page<User> deletedUsers = executeDeletedUserQuery(user, pageRequest);

    return PageResponse.fromPage(deletedUsers.map(UserResponse::fromEntity));
  }

  /**
   * 액세스 토큰 재발급
   */
  public String refreshAccessToken(String refreshToken) {
    return jwtUtil.refreshAccessToken(refreshToken);
  }

  /**
   * 사용자 지점 정보 업데이트 (관리자 전용)
   */
  @CacheEvict(value = "users", allEntries = true)
  public void updateBranch(Long adminUserId, UserBranchUpdate update) {
    validateAdminUser(adminUserId);
    User targetUser = findUserById(update.targetUserId());

    updateUserBranchRelations(targetUser, update);
  }

  /**
   * 사용자 기본 정보 업데이트 (관리자 전용)
   */
  @CacheEvict(value = {"users", "userProfile"}, allEntries = true)
  public void updateUserInfo(Long adminUserId, UserInfoUpdate update) {
    validateAdminUser(adminUserId);
    User targetUser = findUserById(update.targetUserId());

    updateUserBasicInfo(targetUser, update);
  }

  /**
   * 회원 ID 중복 확인
   */
  public MemberIdCheckResponse checkMemberIdDuplicate(String memberId) {
    validateMemberIdFormat(memberId);

    boolean exists = userRepository.existsByMemberId(memberId);

    if (exists) {
      return new MemberIdCheckResponse(false, "이미 사용중인 아이디입니다.");
    } else {
      return new MemberIdCheckResponse(true, "사용 가능한 아이디입니다.");
    }
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
  }

  private User findActiveUserById(Long userId) {
    return userRepository.findByIdAndIsDeletedFalse(userId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
  }

  private User findUserByMemberId(String memberId) {
    return userRepository.findByMemberIdWithBranchUsers(memberId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
  }

  private Branch findBranchById(Long branchId) {
    return branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지부입니다."));
  }

  private void validateUserDuplication(String memberId, String email, String phoneNum) {
    if (userRepository.findByMemberId(memberId).isPresent()) {
      throw new IllegalArgumentException("중복된 사용자가 존재합니다.");
    }
    if (userRepository.findByEmail(email).isPresent()) {
      throw new IllegalArgumentException("중복된 Email 입니다.");
    }
    if (userRepository.findByPhoneNum(phoneNum).isPresent()) {
      throw new IllegalArgumentException("중복된 전화번호입니다.");
    }
  }

  private void validatePhoneNumber(String phoneNum) {
    boolean isOnlyDigits = phoneNum.chars().allMatch(Character::isDigit);
    if (!phoneNum.matches(PHONE_REGEX) || !isOnlyDigits) {
      throw new IllegalArgumentException("휴대전화 번호는 숫자만 입력하며, 010으로 시작하는 10~11자리여야 합니다.");
    }
  }

  private List<Branch> validateAndGetBranches(List<Long> branchIds) {
    // 지점 중복 방지 검증
    Set<Long> uniqueBranchIds = new HashSet<>(branchIds);
    if (uniqueBranchIds.size() != branchIds.size()) {
      throw new IllegalArgumentException("같은 지점에 중복으로 가입할 수 없습니다.");
    }

    // 선택된 지점들이 모두 존재하는지 확인
    List<Branch> branches = branchRepository.findAllById(branchIds);
    if (branches.size() != branchIds.size()) {
      throw new IllegalArgumentException("존재하지 않는 지점이 포함되어 있습니다.");
    }

    return branches;
  }

  private User createUser(SignupRequest req) {
    return User.builder()
        .name(req.name())
        .memberId(req.memberId())
        .password(passwordEncoder.encode(req.password()))
        .email(req.email())
        .phoneNum(req.phoneNum())
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
  }

  private void createBranchUserRelations(User user, List<Branch> branches) {
    List<BranchUser> branchUsers = branches.stream()
        .map(branch -> BranchUser.builder()
            .user(user)
            .branch(branch)
            .userRole(UserRole.PENDING)
            .build())
        .collect(Collectors.toList());

    branchUserRepository.saveAll(branchUsers);
  }

  private void validateLogin(User user, String password) {
    if (user.isDeleted()) {
      throw new IllegalArgumentException("탈퇴한 회원입니다.");
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new IllegalArgumentException("아이디나 비밀번호를 정확하게 입력해주세요.");
    }

    if (!user.isAdmin()) {
      boolean onlyPending = user.getBranchUsers().stream()
          .allMatch(bu -> bu.getUserRole() == UserRole.PENDING);
      if (onlyPending) {
        throw new IllegalArgumentException("회원가입 승인 대기 중입니다. 승인 완료 후 로그인할 수 있습니다.");
      }
    }
  }

  private List<BranchRoleDto> createBranchRoleDtos(User user) {
    return user.getBranchUsers().stream()
        .map(bu -> new BranchRoleDto(
            bu.getBranch().getId(),
            bu.getBranch().getRegion(),
            bu.getUserRole()))
        .collect(Collectors.toList());
  }

  private void validateAdminUser(Long userId) {
    User adminUser = findUserById(userId);
    if (!adminUser.isAdminUser()) {
      throw new IllegalArgumentException("관리자만 가능한 기능입니다.");
    }
  }

  private void validateMemberIdFormat(String memberId) {
    if (memberId == null || memberId.trim().isEmpty()) {
      throw new IllegalArgumentException("아이디를 입력해주세요.");
    }
    if (memberId.length() < MIN_MEMBER_ID_LENGTH) {
      throw new IllegalArgumentException("아이디는 4자리 이상 입력해주세요.");
    }
    if (!memberId.matches(MEMBER_ID_PATTERN)) {
      throw new IllegalArgumentException("아이디는 영문, 숫자만 사용 가능합니다.");
    }
  }

  private void validatePageRequest(int page, int size) {
    if (page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }
  }

  // === Inner Classes for Query Context ===

  private static class UserQueryContext {
    private final boolean isAdmin;
    private final List<Long> ownerBranchIds;

    public UserQueryContext(boolean isAdmin, List<Long> ownerBranchIds) {
      this.isAdmin = isAdmin;
      this.ownerBranchIds = ownerBranchIds;
    }

    public boolean isAdmin() { return isAdmin; }
    public List<Long> getOwnerBranchIds() { return ownerBranchIds; }
    public boolean isOwner() { return !ownerBranchIds.isEmpty(); }
  }

  private static class FilterConditions {
    private final String name;
    private final UserRole role;
    private final List<Long> branchIds;
    private final Stripe stripe;

    public FilterConditions(String name, UserRole role, List<Long> branchIds, Stripe stripe) {
      this.name = name;
      this.role = role;
      this.branchIds = branchIds;
      this.stripe = stripe;
    }

    public boolean hasFilters() {
      return name != null || role != null || stripe != null || (branchIds != null && !branchIds.isEmpty());
    }

    // getters
    public String getName() { return name; }
    public UserRole getRole() { return role; }
    public List<Long> getBranchIds() { return branchIds; }
    public Stripe getStripe() { return stripe; }
  }

  private UserQueryContext validateAndCreateQueryContext(User user) {
    boolean isAdmin = user.isAdmin();
    List<Long> ownerBranchIds = user.getBranchUsers().stream()
        .filter(bu -> bu.getUserRole() == UserRole.OWNER)
        .map(bu -> bu.getBranch().getId())
        .collect(Collectors.toList());

    boolean isOwner = !ownerBranchIds.isEmpty();

    if (!isAdmin && !isOwner) {
      throw new IllegalArgumentException("관리자 또는 지부장(Owner) 권한이 없습니다.");
    }

    return new UserQueryContext(isAdmin, ownerBranchIds);
  }

  private FilterConditions extractFilterConditions(GetAllUserRequest request, UserQueryContext context) {
    String name = (request != null) ? request.name() : null;
    UserRole role = (request != null) ? request.role() : null;
    List<Long> branchIds = (request != null) ? request.branchIds() : null;
    Stripe stripe = (request != null) ? request.stripe() : null;

    // OWNER 권한 검증
    if (!context.isAdmin() && context.isOwner() && branchIds != null && !branchIds.isEmpty()) {
      List<Long> unauthorizedBranches = branchIds.stream()
          .filter(branchId -> !context.getOwnerBranchIds().contains(branchId))
          .collect(Collectors.toList());

      if (!unauthorizedBranches.isEmpty()) {
        throw new IllegalArgumentException("해당 지부의 회원을 조회할 권한이 없습니다: " + unauthorizedBranches);
      }
    }

    return new FilterConditions(name, role, branchIds, stripe);
  }

  private Page<User> executeUserQuery(FilterConditions filters, PageRequest pageRequest, UserQueryContext context) {
    // 검색 조건 없는 경우 (전체 조회) - fetch join 사용
    if (!filters.hasFilters()) {
      return context.isAdmin()
          ? userRepository.findAllByIsDeletedFalseWithBranchUsers(pageRequest)
          : userRepository.findAllByBranchIdInAndIsDeletedFalseWithBranchUsers(context.getOwnerBranchIds(), pageRequest);
    }

    // 검색 조건이 있는 경우
    List<Long> finalBranchIds;
    if (!context.isAdmin() && context.isOwner()) {
      finalBranchIds = (filters.getBranchIds() != null && !filters.getBranchIds().isEmpty())
          ? filters.getBranchIds() : context.getOwnerBranchIds();
    } else {
      finalBranchIds = filters.getBranchIds();
    }

    Specification<User> spec = UserSpecification.withFilters(
        filters.getName(), filters.getRole(), finalBranchIds, filters.getStripe());
    return userRepository.findAll(spec, pageRequest);
  }

  private Page<User> executeDeletedUserQuery(User user, PageRequest pageRequest) {
    if (user.isAdmin()) {
      return userRepository.findAllByIsDeletedTrueNative(pageRequest);
    } else {
      List<Long> ownerBranchIds = user.getBranchUsers().stream()
          .filter(bu -> bu.getUserRole() == UserRole.OWNER)
          .map(bu -> bu.getBranch().getId())
          .collect(Collectors.toList());

      if (ownerBranchIds.isEmpty()) {
        throw new IllegalArgumentException("탈퇴 회원을 조회할 권한이 없습니다.");
      }

      return userRepository.findDeletedUsersByBranchIdsNative(ownerBranchIds, pageRequest);
    }
  }

  private void validateRoleAssignmentPermission(User loggedInUser, Branch branch, UserRole requestedRole) {
    if (!loggedInUser.isAdmin()) {
      BranchUser loginBranchUser = branchUserRepository.findByUserAndBranch(loggedInUser, branch)
          .orElseThrow(() -> new IllegalArgumentException("해당 지부에 소속되지 않은 사용자입니다."));

      if (loginBranchUser.getUserRole() != UserRole.OWNER) {
        throw new IllegalArgumentException("권한이 없습니다.");
      }

      // OWNER가 권한 변경 가능한 범위 제한
      List<UserRole> allowedRoles = List.of(UserRole.PENDING, UserRole.USER, UserRole.COACH);
      if (!allowedRoles.contains(requestedRole)) {
        throw new IllegalArgumentException("OWNER는 PENDING, USER, COACH 역할만 변경할 수 있습니다.");
      }
    }
  }

  private void assignOrUpdateUserRole(User targetUser, Branch branch, UserRole role) {
    Optional<BranchUser> optionalBranchUser = branchUserRepository.findByUserAndBranch(targetUser, branch);

    if (optionalBranchUser.isPresent()) {
      BranchUser targetBranchUser = optionalBranchUser.get();

      if (targetBranchUser.getUserRole() == role) {
        throw new IllegalArgumentException("이미 " + role + " 역할입니다.");
      }

      targetBranchUser.updateUserRole(role);
    } else {
      BranchUser newBranchUser = BranchUser.builder()
          .user(targetUser)
          .branch(branch)
          .userRole(role)
          .build();

      branchUserRepository.save(newBranchUser);
    }
  }

  private void updatePasswordIfPresent(User profile, Optional<String> passwordOpt) {
    passwordOpt.ifPresent(password -> {
      if (!password.isBlank()) {
        profile.changePassword(passwordEncoder.encode(password));
      }
    });
  }

  private void updateUserBranches(User profile, ProfileUpdate request) {
    if (request.branchesToAdd() != null && !request.branchesToAdd().isEmpty()) {
      addUserToBranches(profile, request.branchesToAdd());
    }

    if (request.branchesToRemove() != null && !request.branchesToRemove().isEmpty()) {
      removeUserFromBranches(profile, request.branchesToRemove());
    }
  }

  private void updateUserBranchRelations(User targetUser, UserBranchUpdate update) {
    if (update.branchesToAdd() != null && !update.branchesToAdd().isEmpty()) {
      addUserToBranches(targetUser, update.branchesToAdd());
    }

    if (update.branchesToRemove() != null && !update.branchesToRemove().isEmpty()) {
      removeUserFromBranches(targetUser, update.branchesToRemove());
    }
  }

  private void updateUserBasicInfo(User targetUser, UserInfoUpdate update) {
    update.level().ifPresent(targetUser::updateLevel);
    update.stripe().ifPresent(targetUser::updateStripe);
  }

  private void addUserToBranches(User user, List<Long> branchesToAdd) {
    for (Long branchId : branchesToAdd) {
      Branch branch = findBranchById(branchId);

      boolean alreadyExists = branchUserRepository.existsByUserIdAndBranchId(user.getId(), branch.getId());

      if (!alreadyExists) {
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
      Branch branch = findBranchById(branchId);

      BranchUser branchUser = branchUserRepository
          .findByUserIdAndBranchId(user.getId(), branch.getId())
          .orElseThrow(() -> new IllegalArgumentException("해당 정보가 없습니다."));

      branchUserRepository.delete(branchUser);
    }
  }
}