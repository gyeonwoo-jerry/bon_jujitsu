package bon.bon_jujitsu.domain;

public enum OrderStatus {
  //결제 후 주문 상태 관련
  WAITING, DELIVERING, COMPLETE, CANCELLED
  //반품, 환불 관련
  ,RETURN_REQUESTED, RETURNING, RETURNED, REFUNDED
}
