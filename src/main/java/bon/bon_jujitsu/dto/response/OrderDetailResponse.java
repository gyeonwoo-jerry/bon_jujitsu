//package bon.bon_jujitsu.dto.response;
//
//import bon.bon_jujitsu.domain.OrderDetails;
//
//public record OrderDetailResponse(
//    Long id,
//    int price,
//    int count,
//    double totalPrice,
//    Long orderId,
//    Long itemId
//) {
//  public OrderDetailResponse (OrderDetails orderDetails){
//    this(
//        orderDetails.getId(),
//        orderDetails.getPrice(),
//        orderDetails.getCount(),
//        orderDetails.getTotalPrice(),
//        orderDetails.getOrder().getId(),
//        orderDetails.getItem().getId()
//    );
//  }
//}
