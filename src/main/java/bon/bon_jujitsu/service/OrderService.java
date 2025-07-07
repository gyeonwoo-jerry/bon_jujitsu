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
import bon.bon_jujitsu.dto.request.DirectOrderRequest;
import bon.bon_jujitsu.dto.request.OrderCancelRequest;
import bon.bon_jujitsu.dto.request.OrderRequest;
import bon.bon_jujitsu.dto.request.OrderReturnRequest;
import bon.bon_jujitsu.dto.response.OrderResponse;
import bon.bon_jujitsu.dto.update.OrderUpdate;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.ItemOptionRepository;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.OrderActionRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

  private final UserRepository userRepository;
  private final OrderRepository orderRepository;
  private final CartItemRepository cartItemRepository;
  private final CartRepository cartRepository;
  private final OrderActionRepository orderActionRepository;
  private final OrderImageService orderImageService;
  private final ItemRepository itemRepository;
  private final ItemOptionRepository itemOptionRepository;

  @Transactional
  public void createOrder(Long userId, OrderRequest request) {
    User orderUser = getValidatedUser(userId);
    validateUserCanOrder(orderUser);

    List<Long> cartItemIds = Optional.ofNullable(request.cartItemIds())
        .filter(list -> !list.isEmpty())
        .orElseThrow(() -> new IllegalArgumentException("장바구니에 최소 한 개의 상품이 있어야 합니다."));

    List<CartItem> cartItems = cartItemRepository.findAllByIdWithItemAndOption(cartItemIds);

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
      ItemOption itemOption = cartItem.getItemOption();

      if (itemOption == null) {
        throw new IllegalArgumentException("상품 옵션이 선택되지 않았습니다: " + item.getName());
      }

      if (itemOption.getAmount() < cartItem.getQuantity()) {
        throw new IllegalArgumentException("재고가 부족한 상품이 있습니다: " + item.getName() +
            " (" + itemOption.getSize() + ", " + itemOption.getColor() + ")");
      }

      OrderItem orderItem = OrderItem.builder()
          .quantity(cartItem.getQuantity())
          .price(cartItem.getPrice())
          .item(item)
          .itemOption(itemOption)
          .build();

      order.addOrderItem(orderItem);
      itemOption.decreaseAmount(cartItem.getQuantity());
    }

    orderRepository.save(order);

    Cart cart = cartRepository.findByUser(orderUser)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));

    for (CartItem cartItem : cartItems) {
      cart.removeItem(cartItem.getItem().getId());
    }

    log.info("주문 생성 완료: 사용자 ID {}, 주문 ID {}", userId, order.getId());
  }

  @Transactional
  public void createDirectOrder(Long userId, DirectOrderRequest request) {
    User orderUser = getValidatedUser(userId);
    validateUserCanOrder(orderUser);

    List<DirectOrderRequest.DirectOrderItem> orderItems = request.orderItems();

    if (orderItems.isEmpty()) {
      throw new IllegalArgumentException("주문할 상품이 최소 한 개는 있어야 합니다.");
    }

    int totalCount = 0;
    long totalPrice = 0;

    Order order = Order.builder()
        .name(request.name())
        .address(request.address())
        .zipcode(request.zipcode())
        .addrDetail(request.addrDetail())
        .phoneNum(request.phoneNum())
        .requirement(request.requirement())
        .user(orderUser)
        .payType(request.payType())
        .build();

    for (DirectOrderRequest.DirectOrderItem orderItemRequest : orderItems) {
      // 상품과 옵션 조회
      Item item = itemRepository.findById(orderItemRequest.itemId())
          .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + orderItemRequest.itemId()));

      ItemOption itemOption = itemOptionRepository.findById(orderItemRequest.itemOptionId())
          .orElseThrow(() -> new IllegalArgumentException("상품 옵션을 찾을 수 없습니다: " + orderItemRequest.itemOptionId()));

      // 옵션이 해당 상품의 것인지 확인
      if (!itemOption.getItem().getId().equals(item.getId())) {
        throw new IllegalArgumentException("잘못된 상품 옵션입니다.");
      }

      // 재고 확인
      if (itemOption.getAmount() < orderItemRequest.quantity()) {
        throw new IllegalArgumentException("재고가 부족한 상품이 있습니다: " + item.getName() +
            " (" + itemOption.getSize() + ", " + itemOption.getColor() + ")");
      }

      // 가격 계산 (할인가가 있으면 할인가, 없으면 정가)
      int itemPrice = item.getSale() > 0 ? item.getSale() : item.getPrice();

      OrderItem orderItem = OrderItem.builder()
          .quantity(orderItemRequest.quantity())
          .price(itemPrice)
          .item(item)
          .itemOption(itemOption)
          .build();

      order.addOrderItem(orderItem);

      // 재고 차감
      itemOption.decreaseAmount(orderItemRequest.quantity());

      // 총 수량 및 가격 계산
      totalCount += orderItemRequest.quantity();
      totalPrice += (long) itemPrice * orderItemRequest.quantity();
    }

    // 총액 설정
    order.updateTotalInfo(totalPrice, totalCount);

    orderRepository.save(order);

    log.info("직접 주문 생성 완료: 사용자 ID {}, 주문 ID {}", userId, order.getId());
  }

  @Transactional(readOnly = true)
  @Cacheable(value = "orders", key = "#userId + '_' + #status + '_' + #page + '_' + #size")
  public PageResponse<OrderResponse> getOrdersByStatus(int page, int size, Long userId, OrderStatus status) {
    User user = getValidatedUser(userId);

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    OrderStatus orderStatus = Optional.ofNullable(status).orElse(OrderStatus.WAITING);
    PageRequest pageRequest = createPageRequest(page, size);

    Page<Order> orders = orderRepository.findAllByOrderStatusWithUserAndItems(orderStatus, pageRequest);

    return PageResponse.fromPage(orders.map(OrderResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  @Cacheable(value = "myOrders", key = "#userId + '_' + #status + '_' + #page + '_' + #size")
  public PageResponse<OrderResponse> getMyOrders(int page, int size, Long userId, List<OrderStatus> status) {
    User user = getValidatedUser(userId);
    validateUserCanOrder(user);

    List<OrderStatus> statusList = Optional.ofNullable(status)
        .filter(list -> !list.isEmpty())
        .orElse(List.of(
            OrderStatus.WAITING,
            OrderStatus.DELIVERING,
            OrderStatus.COMPLETE,
            OrderStatus.CANCELLED,
            OrderStatus.RETURN_REQUESTED,
            OrderStatus.RETURNING,
            OrderStatus.RETURNED
        ));

    PageRequest pageRequest = createPageRequest(page, size);

    Page<Order> orders = orderRepository.findAllByUserAndOrderStatusInWithItems(user, statusList, pageRequest);

    return PageResponse.fromPage(orders.map(OrderResponse::fromEntity));
  }

  @Transactional
  @CacheEvict(value = {"orders", "myOrders"}, allEntries = true)
  public void updateOrderByAdmin(OrderUpdate request, Long userId) {
    User user = getValidatedUser(userId);

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자 권한이 없습니다.");
    }

    Order order = getOrderById(request.orderId());
    OrderStatus currentStatus = order.getOrderStatus();
    OrderStatus requestedStatus = request.status();

    switch (currentStatus) {
      case WAITING:
        if (requestedStatus == OrderStatus.DELIVERING) {
          order.UpdateOrderStatus(OrderStatus.DELIVERING);
        } else if (requestedStatus == OrderStatus.CANCELLED) {
          restoreItemStock(order.getOrderItems());
          order.UpdateOrderStatus(OrderStatus.CANCELLED);
        } else {
          throw new IllegalArgumentException("상태를 변경할 수 없습니다.");
        }
        break;

      case DELIVERING:
        if (requestedStatus == OrderStatus.COMPLETE) {
          order.UpdateOrderStatus(OrderStatus.COMPLETE);
        } else {
          throw new IllegalArgumentException("상태를 변경할 수 없습니다.");
        }
        break;

      case RETURN_REQUESTED:
        if (requestedStatus == OrderStatus.RETURNING) {
          order.UpdateOrderStatus(OrderStatus.RETURNING);
        } else {
          throw new IllegalArgumentException("상태를 변경할 수 없습니다.");
        }
        break;

      case RETURNING:
        if (requestedStatus == OrderStatus.RETURNED) {
          order.UpdateOrderStatus(OrderStatus.RETURNED);
        } else {
          throw new IllegalArgumentException("상태를 변경할 수 없습니다.");
        }
        break;

      case COMPLETE:
      case RETURNED:
      case CANCELLED:
      case REFUNDED:
        throw new IllegalArgumentException("상태를 변경할 수 없습니다.");

      default:
        throw new IllegalArgumentException("잘못된 형태의 주문입니다.");
    }

    log.info("주문 상태 변경: 주문 ID {}, {} -> {}", order.getId(), currentStatus, requestedStatus);
  }

  @Transactional
  @CacheEvict(value = {"orders", "myOrders"}, allEntries = true)
  public void cancelOrder(Long orderId, Long userId, OrderCancelRequest request) {
    User user = getValidatedUser(userId);
    Order order = getOrderById(orderId);

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

    restoreItemStock(order.getOrderItems());
    order.UpdateOrderStatus(OrderStatus.CANCELLED);

    OrderAction cancelAction = OrderAction.builder()
        .order(order)
        .actionType(OrderActionType.CANCEL)
        .reason(request.reason())
        .description(request.description())
        .actionBy(userId)
        .build();

    orderActionRepository.save(cancelAction);

    log.info("주문 취소 완료: 주문 ID {}, 사용자 ID {}", orderId, userId);
  }

  @Transactional
  @CacheEvict(value = {"orders", "myOrders"}, allEntries = true)
  public void returnOrder(Long orderId, Long userId, OrderReturnRequest request, List<MultipartFile> images) {
    User user = getValidatedUser(userId);
    Order order = getOrderById(orderId);

    if (!order.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("본인의 주문만 반품 신청할 수 있습니다.");
    }

    if (order.getOrderStatus() != OrderStatus.COMPLETE) {
      throw new IllegalArgumentException("완료된 주문만 반품 신청이 가능합니다.");
    }

    Optional<OrderAction> existingReturn = orderActionRepository
        .findFirstByOrderIdAndActionTypeOrderByCreatedAtDesc(orderId, OrderActionType.RETURN);

    if (existingReturn.isPresent()) {
      throw new IllegalArgumentException("이미 반품 신청된 주문입니다.");
    }

    order.UpdateOrderStatus(OrderStatus.RETURN_REQUESTED);

    OrderAction returnAction = OrderAction.builder()
        .order(order)
        .actionType(OrderActionType.RETURN)
        .reason(request.reason())
        .description(request.description())
        .actionBy(userId)
        .build();

    orderActionRepository.save(returnAction);
    orderImageService.uploadImage(order, images);

    log.info("반품 신청 완료: 주문 ID {}, 사용자 ID {}", orderId, userId);
  }

  // ==================== Private Helper Methods (2회 이상 사용) ====================

  private User getValidatedUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));
  }

  private Order getOrderById(Long orderId) {
    return orderRepository.findById(orderId)
        .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
  }

  private void validateUserCanOrder(User user) {
    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 주문을 할 수 없습니다.");
    }
  }

  private void restoreItemStock(List<OrderItem> orderItems) {
    for (OrderItem orderItem : orderItems) {
      ItemOption itemOption = orderItem.getItemOption();
      if (itemOption == null) {
        throw new IllegalStateException("해당 주문 아이템에 대한 옵션이 존재하지 않습니다.");
      }
      itemOption.increaseAmount(orderItem.getQuantity());
    }
  }

  private PageRequest createPageRequest(int page, int size) {
    return PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
  }
}