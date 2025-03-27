package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.response.LoginResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
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

    // 휴대전화번호 중복 확인
    String phoneNum = req.phoneNum();
    Optional<User> checkPhone_num = userRepository.findByPhoneNum(phoneNum);
    if (checkPhone_num.isPresent()) {
      throw new IllegalArgumentException("중복된 전화번호 입니다.");
    }

    // 휴대전화 번호 검사
    if (req.phoneNum().toString().length() < 10) {
      throw new IllegalArgumentException("유효한 휴대전화 번호를 입력해주세요.");
    }

    // 지사 확인
    Branch branch = branchRepository.findById(req.branchId())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지사입니다."));

    // 유저를 빌더로 저장
    User user = User.builder()
        .name(req.name())
        .memberId(req.memberId())
        .password(password)
        .email(req.email())
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

    String token = jwtUtil.createToken(user.getId());

    return new LoginResponse(token, user.getUserRole(), user.getName());
  }

  public void assignOwnerRole(Long adminUserId, Long targetUserId) {
    User targetUser = userRepository.findByIdAndIsDeletedFalse(targetUserId).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원입니다."));
    User admin = userRepository.findById(adminUserId).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if(admin.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if (targetUser.getUserRole() == UserRole.OWNER) {
      throw new IllegalArgumentException("이미 관장(OWNER)으로 등록된 회원입니다.");
    }

    targetUser.setUserRole(UserRole.OWNER);

    userRepository.save(targetUser);
    }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> userPage = userRepository.findAllByIsDeletedFalse(pageRequest);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getDeletedUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> userPage = userRepository.findAllByIsDeletedTrue(pageRequest);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getMyUsers(Long userId, int page, int size) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("관장 권한이 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> userPage = userRepository.findAllByBranch_RegionAndIsDeletedFalseAndUserRoleNot(
            user.getBranch().getRegion(), UserRole.PENDING, pageRequest);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  public UserResponse getProfile(Long userId) {
    User profile = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    UserResponse userResponse = UserResponse.fromEntity(profile);
    return userResponse;
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
      profile.setBranch(newBranch);
    });

    userImageService.updateImages(profile, images);
  }

  public void deleteUser(Long userId, ProfileDeleteRequest request) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if(!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    user.softDelete();
  }

//  public Status assignAdmin(Long targetUserId) {
//    User user = userRepository.findByIdAndIsDeletedFalse(targetUserId)
//        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
//
//    if (user.getUserRole() == UserRole.ADMIN) {
//      throw new IllegalArgumentException("이미 관리자(ADMIN) 으로 등록된 회원입니다.");
//    }
//
//    user.setUserRole(UserRole.ADMIN);
//
//    userRepository.save(user);
//
//    return Status.builder()
//        .status(HttpStatus.CREATED.value())
//        .message("관리자로 등록되었습니다.")
//        .build();
//  }

  @Transactional(readOnly = true)
  public PageResponse<UserResponse> getPendingUsers(Long userId, int page, int size) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("관장 권한이 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<User> userPage = userRepository.findAllByBranch_RegionAndIsDeletedFalseAndUserRole(
            user.getBranch().getRegion(), UserRole.PENDING, pageRequest);

    return PageResponse.fromPage(userPage.map(UserResponse::fromEntity));
  }

  public void assignUser(Long ownerUserId, Long targetUserId) {
    User user = userRepository.findByIdAndIsDeletedFalse(targetUserId).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원입니다."));
    User owner = userRepository.findById(ownerUserId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    if(owner.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("관장 권한이 없습니다.");
    }

    if (!owner.getBranch().equals(user.getBranch())) {
      throw new IllegalArgumentException("해당 지부의 회원만 승인 할 수 있습니다.");
    }

    if (user.getUserRole() == UserRole.USER) {
      throw new IllegalArgumentException("이미 유저(USER)으로 등록된 회원입니다.");
    }

    user.setUserRole(UserRole.USER);
  }
}
