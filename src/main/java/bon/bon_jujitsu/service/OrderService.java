package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderItem;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.OrderItemDto;
import bon.bon_jujitsu.dto.common.PageResponse;
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
    User orderUser = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

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

    // 주문 아이템 생성 및 아이템 재고 차감
    for (CartItem cartItem : cartItems) {
      Item item = cartItem.getItem();

      // 재고 부족 체크
      if (item.getAmount() < cartItem.getQuantity()) {
        throw new IllegalArgumentException("재고가 부족한 상품이 있습니다: " + item.getName());
      }

      // 주문 아이템 생성
      OrderItem orderItem = OrderItem.builder()
          .quantity(cartItem.getQuantity())
          .price(cartItem.getPrice())
          .item(item)
          .build();

      order.addOrderItem(orderItem);

      // 아이템 재고 차감
      item.decreaseAmount(cartItem.getQuantity());
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
  public PageResponse<OrderResponse> getOrdersByStatus(int page, int size, Long id, OrderStatus status) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    // 상태값이 없으면 기본값(WAITING) 사용
    OrderStatus orderStatus = (status != null) ? status : OrderStatus.WAITING;

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // 동적으로 주문 상태 검색
    Page<Order> orders = orderRepository.findAllByOrderStatusOrderByCreatedAtDesc(orderStatus, pageRequest);

    Page<OrderResponse> orderResponses = orders.map(order -> new OrderResponse(
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

    return PageResponse.fromPage(orderResponses);
  }

  public void updateOrderByAdmin(OrderUpdate request, Long userId) {
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
          for (OrderItem orderItem : order.getOrderItems()) {
            Item item = orderItem.getItem();
            item.updateAmount(item.getAmount() + orderItem.getQuantity());
          }

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
  }

  public void cancelOrder(Long orderId, Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.ADMIN && !order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 취소할 수 있습니다.");
    }

    if (order.getOrderStatus() != OrderStatus.WAITING) {
      throw new IllegalArgumentException("주문 취소는 대기중인 주문만 가능합니다.");
    }

    // 주문 취소 시, 아이템 재고 복구
    for (OrderItem orderItem : order.getOrderItems()) {
      Item item = orderItem.getItem();
      item.updateAmount(item.getAmount() + orderItem.getQuantity());
    }

    order.UpdateOrderStatus(OrderStatus.CANCELLED);
  }

  public void returnOrder(Long orderId, Long userId) {
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
  }
}
