package bon.bon_jujitsu.service;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final BranchRepository branchRepository;
  private final JwtUtil jwtUtil;

  public void signup(SignupRequest req) {
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
        .stripe(req.stripe())
        .userRole(UserRole.USER)
        .build();
    userRepository.save(user);
  }

  public String login(LoginRequest req) {
    User user = userRepository.findByMemberId(req.memberId()).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if (!passwordEncoder.matches(req.password(), user.getPassword())) {
      throw new IllegalArgumentException("아이디나 비밀번호를 정확하게 입력해주세요 .");
    }

    String token = jwtUtil.createToken(user.getId());

    return token;
  }

  public Status assignOwnerRole(Long userId) {
    User user = userRepository.findByIdAndIsDeletedFalse(userId).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if (user.getUserRole() == UserRole.OWNER) {
      throw new IllegalArgumentException("이미 관장(OWNER)으로 등록된 회원입니다.");
    }

    user.setUserRole(UserRole.OWNER);

    userRepository.save(user);

    return Status.builder()
        .status(HttpStatus.CREATED.value())
        .message("관장으로 등록되었습니다.")
        .build();
    }

  @Transactional(readOnly = true)
  public ListResponse<UserResponse> getUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<User> userPage = userRepository.findAllByIsDeletedFalse(pageRequest);

    List<UserResponse> userResponses = userPage.getContent().stream()
        .map(UserResponse::fromEntity)
        .collect(Collectors.toList());

    return ListResponse.success(
        userResponses,
        HttpStatus.OK,
        "회원 조회 성공"
    );
  }

  @Transactional(readOnly = true)
  public ListResponse<UserResponse> getDeletedUsers(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<User> userPage = userRepository.findAllByIsDeletedTrue(pageRequest);

    List<UserResponse> userResponses = userPage.getContent().stream()
        .map(UserResponse::fromEntity)
        .collect(Collectors.toList());

    return ListResponse.success(
        userResponses,
        HttpStatus.OK,
        "회원 조회 성공"
    );
  }

  @Transactional(readOnly = true)
  public ListResponse<UserResponse> getMyUsers(Long id, int page, int size) {
    User user = userRepository.findById(id).orElseThrow(()-> new IllegalArgumentException("회원을 찾을수 없습니다."));

    if(page < 1 || size < 1) {
      throw new IllegalArgumentException("페이지 번호와 크기는 1 이상이어야 합니다.");
    }

    if (user.getUserRole() != UserRole.OWNER) {
      throw new IllegalArgumentException("관장 권한이 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<User> userPage = userRepository.findAllByBranch_RegionAndIsDeletedFalse(user.getBranch().getRegion(), pageRequest);

    List<UserResponse> userResponses = userPage.getContent().stream()
        .map(UserResponse::fromEntity)
        .collect(Collectors.toList());

    return ListResponse.success(
        userResponses,
        HttpStatus.OK,
        "회원 조회 성공"
    );
  }

  @Transactional(readOnly = true)
  public UserResponse getProfile(Long id) {
    User profile = userRepository.findById(id).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    UserResponse userResponse = UserResponse.fromEntity(profile);
    return userResponse;
  }

  public void updateProfile(Long id, ProfileUpdateRequest request) {

    User profile = userRepository.findById(id)
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
  }

  public void deleteUser(Long id, ProfileDeleteRequest request) {
    User user = userRepository.findById(id).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if(!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }

    user.softDelete();
  }

  public Status assignAdmin(Long userId) {
    User user = userRepository.findByIdAndIsDeletedFalse(userId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

    if (user.getUserRole() == UserRole.ADMIN) {
      throw new IllegalArgumentException("이미 관리자(ADMIN) 으로 등록된 회원입니다.");
    }

    user.setUserRole(UserRole.ADMIN);

    userRepository.save(user);

    return Status.builder()
        .status(HttpStatus.CREATED.value())
        .message("관리자로 등록되었습니다.")
        .build();
  }
}
