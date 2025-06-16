package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemOption;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderAction;
import bon.bon_jujitsu.domain.OrderActionType;
import bon.bon_jujitsu.domain.OrderItem;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.OrderCancelRequest;
import bon.bon_jujitsu.dto.request.OrderRequest;
import bon.bon_jujitsu.dto.request.OrderReturnRequest;
import bon.bon_jujitsu.dto.response.OrderResponse;
import bon.bon_jujitsu.dto.update.OrderUpdate;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.OrderActionRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

  private final UserRepository userRepository;
  private final OrderRepository orderRepository;
  private final CartItemRepository cartItemRepository;
  private final CartRepository cartRepository;
  private final OrderActionRepository orderActionRepository;
  private final OrderImageService orderImageService;

  public void createOrder(Long userId, OrderRequest request) {
    User orderUser = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (orderUser.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 주문을 할 수 없습니다.");
    }

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

    long totalPrice = cartItems.stream()
        .mapToLong(cartItem -> (long) cartItem.getPrice() * cartItem.getQuantity())
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

    for (CartItem cartItem : cartItems) {
      Item item = cartItem.getItem();
      ItemOption itemOption = cartItem.getItemOption(); // 선택한 옵션 가져오기

      if (itemOption == null) {
        throw new IllegalArgumentException("상품 옵션이 선택되지 않았습니다: " + item.getName());
      }

      // 재고 부족 체크
      if (itemOption.getAmount() < cartItem.getQuantity()) {
        throw new IllegalArgumentException("재고가 부족한 상품이 있습니다: " + item.getName() +
            " (" + itemOption.getSize() + ", " + itemOption.getColor() + ")");
      }

      // 주문 아이템 생성
      OrderItem orderItem = OrderItem.builder()
          .quantity(cartItem.getQuantity())
          .price(cartItem.getPrice())
          .item(item)
          .itemOption(itemOption)
          .build();

      order.addOrderItem(orderItem);

      // 아이템 옵션 재고 차감
      itemOption.decreaseAmount(cartItem.getQuantity());
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
  public PageResponse<OrderResponse> getOrdersByStatus(int page, int size, Long userId,
      OrderStatus status) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    // 상태값이 없으면 기본값(WAITING) 사용
    OrderStatus orderStatus = (status != null) ? status : OrderStatus.WAITING;

    PageRequest pageRequest = PageRequest.of(page - 1, size,
        Sort.by(Sort.Direction.DESC, "createdAt"));

    // 동적으로 주문 상태 검색
    Page<Order> orders = orderRepository.findAllByOrderStatusOrderByCreatedAtDesc(orderStatus,
        pageRequest);

    return PageResponse.fromPage(orders.map(OrderResponse::fromEntity));
  }


  public PageResponse<OrderResponse> getMyOrders(int page, int size, Long userId,
      List<OrderStatus> status) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 주문을 할 수 없습니다.");
    }

    // 상태값이 없으면 기본 조회 (WAITING, DELIVERING)
    if (status == null || status.isEmpty()) {
      status = List.of(OrderStatus.WAITING, OrderStatus.DELIVERING);
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size,
        Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Order> orders = orderRepository.findAllByUserAndOrderStatusIn(user, status, pageRequest);

    return PageResponse.fromPage(orders.map(OrderResponse::fromEntity));
  }

  public void updateOrderByAdmin(OrderUpdate request, Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    Order order = orderRepository.findById(request.orderId())
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    OrderStatus currentStatus = order.getOrderStatus();
    OrderStatus requestedStatus = request.status();

    switch (currentStatus) {
      case WAITING:
        // WAITING 상태에서 DELIVERING 또는 CANCELLED로 변경
        if (requestedStatus == OrderStatus.DELIVERING) {
          order.UpdateOrderStatus(OrderStatus.DELIVERING);
        } else if (requestedStatus == OrderStatus.CANCELLED) {
          for (OrderItem orderItem : order.getOrderItems()) {
            ItemOption itemOption = orderItem.getItemOption(); // 주문된 옵션 가져오기

            if (itemOption == null) {
              throw new IllegalStateException("해당 주문 아이템에 대한 옵션이 존재하지 않습니다.");
            }

            // 주문한 수량만큼 재고 복구
            itemOption.increaseAmount(orderItem.getQuantity());
          }

          order.UpdateOrderStatus(OrderStatus.CANCELLED);
        } else {
          throw new IllegalArgumentException("상태를 변경할 수 없습니다.");
        }
        break;

      case DELIVERING:
        // DELIVERING상태에서 COMPLETE로 변경
        if (requestedStatus == OrderStatus.COMPLETE) {
          order.UpdateOrderStatus(OrderStatus.COMPLETE);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case COMPLETE:
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
        if (requestedStatus == OrderStatus.RETURNED) {
          order.UpdateOrderStatus(OrderStatus.RETURNED);
        } else {
          throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");
        }
        break;

      case RETURNED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      case CANCELLED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      case REFUNDED:
        throw new IllegalArgumentException("상태를 변경 할 수 없습니다.");

      default:
        throw new IllegalArgumentException("잘못된 형태의 주문입니다.");
    }
  }

  public void cancelOrder(Long orderId, Long userId, OrderCancelRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    if (!user.isAdmin() && !order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 취소할 수 있습니다.");
    }

    if (order.getOrderStatus() != OrderStatus.WAITING) {
      throw new IllegalArgumentException("주문 취소는 대기중인 주문만 가능합니다.");
    }

    Optional<OrderAction> existingCancel = orderActionRepository
        .findFirstByOrderIdAndActionTypeOrderByCreatedAtDesc(orderId, OrderActionType.CANCEL);

    if (existingCancel.isPresent()) {
      throw new IllegalArgumentException("이미 취소된 주문입니다.");
    }

    // 주문 취소 시, 아이템 재고 복구
    for (OrderItem orderItem : order.getOrderItems()) {
      ItemOption itemOption = orderItem.getItemOption(); // 주문된 옵션 가져오기

      if (itemOption == null) {
        throw new IllegalStateException("해당 주문 아이템에 대한 옵션이 존재하지 않습니다.");
      }

      // 주문한 수량만큼 재고 복구
      itemOption.increaseAmount(orderItem.getQuantity());
    }

    order.UpdateOrderStatus(OrderStatus.CANCELLED);

    OrderAction cancelAction = OrderAction.builder()
        .order(order)
        .actionType(OrderActionType.CANCEL)
        .reason(request.reason())
        .description(request.description())
        .actionBy(userId)
        .build();

    orderActionRepository.save(cancelAction);
  }

  public void returnOrder(Long orderId, Long userId, OrderReturnRequest request,
      List<MultipartFile> images) {
    userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));

    // 본인 주문인지 확인
    if (!order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 반품 신청할 수 있습니다.");
    }

    // 상태 검증
    if (order.getOrderStatus() != OrderStatus.COMPLETE) {
      throw new IllegalArgumentException("완료된 주문만 반품 신청이 가능합니다.");
    }

    // 중복 반품 방지
    Optional<OrderAction> existingReturn = orderActionRepository
        .findFirstByOrderIdAndActionTypeOrderByCreatedAtDesc(orderId, OrderActionType.RETURN);

    if (existingReturn.isPresent()) {
      throw new IllegalArgumentException("이미 반품 신청된 주문입니다.");
    }

    // 주문 상태 변경
    order.UpdateOrderStatus(OrderStatus.RETURN_REQUESTED);

    // 반품 액션 기록 저장
    OrderAction returnAction = OrderAction.builder()
        .order(order)
        .actionType(OrderActionType.RETURN)
        .reason(request.reason())
        .description(request.description())
        .actionBy(userId)
        .build();

    orderActionRepository.save(returnAction);

    orderImageService.uploadImage(order, images);
  }
}
