package bon.bon_jujitsu.domain;

public enum UserRole {
  USER(Authority.USER), //일반유저 권한
  OWNER(Authority.OWNER), //관장님 권한
  ADMIN(Authority.ADMIN); //관리자 권한;

  private final String authority;

  UserRole(String authority) {
    this.authority = authority;
  }

  public String getAuthority() {
    return this.authority;
  }

  public static class Authority {
    public static final String USER = "ROLE_USER";
    public static final String OWNER = "ROLE_OWNER";
    public static final String ADMIN = "ROLE_ADMIN";
  }
}
