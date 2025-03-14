//package bon.bon_jujitsu.security;
//
//import bon.bon_jujitsu.domain.User;
//import bon.bon_jujitsu.repository.UserRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.annotation.Primary;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.stereotype.Service;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class UserDetailsServiceImpl implements UserDetailsService {
//
//  private final UserRepository userRepository;
//
//  @Override
//  public UserDetails loadUserByUsername(String nickname) throws UsernameNotFoundException {
//    log.info("🔍 UserDetailsService 호출 - nickname: {}", nickname);
//    User user = userRepository.findByNickname(nickname)
//        .orElseThrow(() -> new UsernameNotFoundException("Not Found " + nickname));
//    log.info("✅ 유저 찾음: {}", user.getNickname());
//
//    return new UserDetailsImpl(user);
//  }
//}
