package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderItem;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.OrderItemDto;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.OrderRequest;
import bon.bon_jujitsu.dto.response.OrderResponse;
import bon.bon_jujitsu.dto.update.OrderUpdate;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

  private final UserRepository userRepository;
  private final OrderRepository orderRepository;
  private final CartItemRepository cartItemRepository;
  private final CartRepository cartRepository;

  public void createOrder(Long userId, OrderRequest request) {
    User orderUser = userRepository.findById(userId).orElseThrow(()->
        new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    List<Long> cartItemIds = Optional.ofNullable(request.cartItemIds())
        .filter(list -> !list.isEmpty())
        .orElseThrow(() -> new IllegalArgumentException("장바구니에 최소 한 개의 상품이 있어야 합니다."));

    List<CartItem> cartItems = cartItemRepository.findAllById(cartItemIds);

    if (cartItems.isEmpty()) {
      throw new IllegalArgumentException("장바구니 상품을 찾을 수 없습니다.");
    }

    int totalCount = cartItems.stream()
        .mapToInt(CartItem::getQuantity)
        .sum();

    double totalPrice = cartItems.stream()
        .mapToDouble(cartItem -> cartItem.getPrice() * cartItem.getQuantity())
        .sum();

    Order order = Order.builder()
        .name(request.name())
        .address(request.address())
        .zipcode(request.zipcode())
        .addrDetail(request.addrDetail())
        .phoneNum(request.phoneNum())
        .requirement(request.requirement())
        .totalPrice(totalPrice)
        .totalCount(totalCount)
        .user(orderUser)
        .payType(request.payType())
        .build();

    // CartItem -> OrderItem으로만 변환하고, CartItem은 Order와 연결하지 않음
    for (CartItem cartItem : cartItems) {
      OrderItem orderItem = OrderItem.builder()
          .quantity(cartItem.getQuantity())
          .price(cartItem.getPrice())
          .item(cartItem.getItem())
          .build();

      order.addOrderItem(orderItem);  // 여기서 양방향 관계 설정
    }

    orderRepository.save(order);

    // 카트에서 아이템 제거
    Cart cart = cartRepository.findByUser(orderUser)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));

    for (CartItem cartItem : cartItems) {
      cart.removeItem(cartItem.getItem().getId());
    }
  }

  @Transactional(readOnly = true)
  public PageResponse<OrderResponse> getMyOrders(int page, int size, Long id) {
    userRepository.findById(id).orElseThrow(()-> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Order> orders = orderRepository.findAllByUserId(id, pageRequest);

    Page<OrderResponse> myOrders = orders.map(order -> new OrderResponse(
        order.getId(),
        order.getName(),
        order.getAddress(),
        order.getZipcode(),
        order.getAddrDetail(),
        order.getPhoneNum(),
        order.getRequirement(),
        order.getTotalPrice(),
        order.getTotalCount(),
        order.getPayType(),
        order.getOrderStatus(),
        order.getUser().getId(),
        order.getOrderItems().stream()
            .map(OrderItemDto::new)
            .collect(Collectors.toList()),
        order.getCreatedAt(),
        order.getModifiedAt()
    ));

    return PageResponse.success(myOrders, HttpStatus.OK, "내 주문 조회 성공");
  }

  @Transactional(readOnly = true)
  public PageResponse<OrderResponse> getWaitingOrders(int page, int size, Long id) {
    User user = userRepository.findById(id).orElseThrow(()-> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Order> orders = orderRepository.findAllByOrderStatusOrderByCreatedAtDesc(OrderStatus.WAITING, pageRequest);

    Page<OrderResponse> waitingOrders = orders.map(order -> new OrderResponse(
        order.getId(),
        order.getName(),
        order.getAddress(),
        order.getZipcode(),
        order.getAddrDetail(),
        order.getPhoneNum(),
        order.getRequirement(),
        order.getTotalPrice(),
        order.getTotalCount(),
        order.getPayType(),
        order.getOrderStatus(),
        order.getUser().getId(),
        order.getOrderItems().stream()
            .map(OrderItemDto::new)
            .collect(Collectors.toList()),
        order.getCreatedAt(),
        order.getModifiedAt()
    ));

    return PageResponse.success(waitingOrders, HttpStatus.OK, "주문 조회 성공");
  }

  public Status updateOrderByAdmin(OrderUpdate request, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    Order order = orderRepository.findById(request.orderId()).orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    OrderStatus currentStatus = order.getOrderStatus();
    OrderStatus requestedStatus = request.status();

    switch (currentStatus) {
      case WAITING:
        // WAITING상태에서 DELIVERING로 변경 또는 CANCELLED로 변경
        if (requestedStatus == OrderStatus.DELIVERING) {
          order.UpdateOrderStatus(OrderStatus.DELIVERING);
        } else if (requestedStatus == OrderStatus.CANCELLED) {
          order.UpdateOrderStatus(OrderStatus.CANCELLED);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case DELIVERING:
        // DELIVERING상태에서 COMPLETED로 변경
        if (requestedStatus == OrderStatus.COMPLETED) {
          order.UpdateOrderStatus(OrderStatus.COMPLETED);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case COMPLETED:
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      case RETURN_REQUESTED:
        // RETURN_REQUESTED상태에서 RETURNING으로 변경
        if (requestedStatus == OrderStatus.RETURNING) {
          order.UpdateOrderStatus(OrderStatus.RETURNING);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case RETURNING:
        // RETURNING상태에서 RERETURNED으로 변경
        if (requestedStatus == OrderStatus.RERETURNED) {
          order.UpdateOrderStatus(OrderStatus.RERETURNED);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case RERETURNED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      case CANCELLED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      case REFUNDED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      default:
        throw new IllegalArgumentException("잘못된 형태의 주문입니다.");
    }

    orderRepository.save(order);

    return Status.builder()
        .status(HttpStatus.OK.value())
        .message("주문 상태변경 완료")
        .build();
  }

  public Status cancelOrder(Long orderId, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Order order = orderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN && !order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 취소할 수 있습니다.");
    }

    if(order.getOrderStatus() == OrderStatus.WAITING) {
      order.UpdateOrderStatus(OrderStatus.CANCELLED);
    } else {
      throw new IllegalArgumentException("주문 취소는 대기중인 주문만 가능합니다.");
    }

    return Status.builder()
        .status(HttpStatus.OK.value())
        .message("주문 취소 완료")
        .build();
  }

  public Status returnOrder(Long orderId, Long userId) {
    userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    // 본인 주문인지 확인
    if (!order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 반품 신청할 수 있습니다.");
    }

    // COMPLETED 상태인 경우에만 반품 신청 가능
    if (order.getOrderStatus() == OrderStatus.COMPLETED) {
      order.UpdateOrderStatus(OrderStatus.RETURN_REQUESTED);
    } else {
      throw new IllegalArgumentException("완료된 주문만 반품 신청이 가능합니다.");
    }

    return Status.builder()
        .status(HttpStatus.OK.value())
        .message("반품 신청 완료")
        .build();
  }
}
