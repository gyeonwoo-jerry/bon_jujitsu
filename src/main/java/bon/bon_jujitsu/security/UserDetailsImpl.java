//package bon.bon_jujitsu.security;
//
//import bon.bon_jujitsu.domain.User;
//import bon.bon_jujitsu.domain.UserRole;
//import java.util.ArrayList;
//import java.util.Collection;
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.userdetails.UserDetails;
//
//public class UserDetailsImpl implements UserDetails {
//
//  private final User user;
//
//  public UserDetailsImpl(User user) {
//    this.user = user;
//  }
//
//  public User getUser() {
//    return user;
//  }
//
//  @Override
//  public String getPassword() {
//    return user.getPassword();
//  }
//
//  @Override
//  public String getUsername() {
//    return user.getNickname();
//  }
//
//  @Override
//  public Collection<? extends GrantedAuthority> getAuthorities() {
//    UserRole role = user.getUserRole();
//    String authority = role.getAuthority();
//
//    SimpleGrantedAuthority simpleGrantedAuthority = new SimpleGrantedAuthority(authority);
//    Collection<GrantedAuthority> authorities = new ArrayList<>();
//    authorities.add(simpleGrantedAuthority);
//
//    return authorities;
//  }
//
//  @Override
//  public boolean isAccountNonExpired() {
//    return true;
//  }
//
//  @Override
//  public boolean isAccountNonLocked() {
//    return true;
//  }
//
//  @Override
//  public boolean isCredentialsNonExpired() {
//    return true;
//  }
//
//  @Override
//  public boolean isEnabled() {
//    return true;
//  }
//}
