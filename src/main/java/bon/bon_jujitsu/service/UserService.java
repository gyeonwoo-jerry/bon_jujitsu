package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.request.UserRoleRequest;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.GetAllUserRequest;
import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.response.LoginResponse;
import bon.bon_jujitsu.dto.response.LogoutResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.UserSpecification;
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
        .branch(branch)
        .level(req.level())
        .sns1(req.sns1())
        .sns2(req.sns2())
        .sns3(req.sns3())
        .sns4(req.sns4())
        .sns5(req.sns5())
        .stripe(req.stripe())
        .userRole(UserRole.PENDING)
        .build();
    userRepository.save(user);

    userImageService.uploadImage(user, images);
  }

  public LoginResponse login(LoginRequest req) {
    User user = userRepository.findByMemberId(req.memberId())
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("회원가입 승인 대기 중입니다. 승인 완료 후 로그인할 수 있습니다.");
    }

    if (!passwordEncoder.matches(req.password(), user.getPassword())) {
      throw new IllegalArgumentException("아이디나 비밀번호를 정확하게 입력해주세요.");
    }

    JwtUtil.TokenInfo tokenInfo = jwtUtil.createTokens(user.getId());

    return new LoginResponse(
        tokenInfo.getAccessToken(),
        tokenInfo.getRefreshToken(),
        user.getUserRole(),
        user.getName()
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

    // ADMIN이 아니라면 OWNER인지 확인
    if (loggedInUser.getUserRole() != UserRole.ADMIN && loggedInUser.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("권한이 없습니다.");
    }

    // OWNER라면 같은 지부의 유저만 변경 가능
    if (loggedInUser.getUserRole() == UserRole.OWNER && !loggedInUser.getBranch().equals(targetUser.getBranch())) {
      throw new IllegalArgumentException("해당 지부의 회원만 역할을 변경할 수 있습니다.");
    }

    // OWNER가 변경 가능한 역할 제한 (PENDING, USER, COACH만 가능)
    if (loggedInUser.getUserRole() == UserRole.OWNER) {
      List<UserRole> allowedRoles = List.of(UserRole.PENDING, UserRole.USER, UserRole.COACH);
      if (!allowedRoles.contains(request.role())) {
        throw new IllegalArgumentException("OWNER는 PENDING, USER, COACH 역할만 변경할 수 있습니다.");
      }
    }

    // 이미 같은 역할로 변경하려는 경우 예외 처리
    if (targetUser.getUserRole() == request.role()) {
      throw new IllegalArgumentException("이미 " + request.role() + "으로 등록된 회원입니다.");
    }

    // 역할 변경
    targetUser.updateUserRole(request.role());
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getUsers(int page, int size, Long userId, GetAllUserRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN && user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("관리자 또는 지부장(Owner) 권한이 없습니다.");
    }

    if (page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // 검색 조건 가져오기
    String name = (request != null) ? request.name() : null;
    UserRole role = (request != null) ? request.role() : null;
    Long branchId = (request != null) ? request.branchId() : null;

    // Owner인 경우, 자신의 지부(branchId) 내에서만 검색 가능하도록 제한
    if (user.getUserRole() == UserRole.OWNER) {
      branchId = user.getBranch().getId(); // Owner의 지부 ID로 고정
    }

    // 검색 조건이 없으면 전체 조회 (Owner는 본인 지부만)
    if (name == null && role == null && branchId == null) {
      Page<User> userPage = (user.getUserRole() == UserRole.ADMIN) ?
          userRepository.findAllByIsDeletedFalse(pageRequest) :
          userRepository.findAllByBranch_IdAndIsDeletedFalse(user.getBranch().getId(), pageRequest);

      return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
    }

    // 검색 조건이 있을 경우 Specification 사용
    Specification<User> spec = UserSpecification.withFilters(name, role, branchId);
    Page<User> userPage = userRepository.findAll(spec, pageRequest);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public UserResponse getProfile(Long userId) {
    User profile = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

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

    request.branchId().ifPresent(branchId -> {
      Branch newBranch = branchRepository.findById(branchId)
          .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지사입니다."));
      profile.updateBranch(newBranch);
    });

    if (images != null && !images.isEmpty()) {
      userImageService.updateImages(profile, images);
    }
  }

  public void deleteUser(Long userId, ProfileDeleteRequest request) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if(!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    user.softDelete();
  }

  public PageResponse<UserResponse> getDeletedUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> deletedUsers = userRepository.findAllByIsDeletedTrue(pageRequest);

    return PageResponse.fromPage(deletedUsers.map(UserResponse::fromEntity));
  }

  public String refreshAccessToken(String refreshToken) {
    return jwtUtil.refreshAccessToken(refreshToken);
  }
}
