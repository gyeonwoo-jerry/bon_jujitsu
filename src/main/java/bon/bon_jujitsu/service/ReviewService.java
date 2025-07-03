package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.ReviewRequest;
import bon.bon_jujitsu.dto.response.ReviewResponse;
import bon.bon_jujitsu.dto.response.ReviewableOrderResponse;
import bon.bon_jujitsu.dto.update.ReviewUpdate;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.ReviewRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReviewService {

  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final ReviewRepository reviewRepository;
  private final OrderRepository orderRepository;
  private final ReviewImageService reviewImageService;

  private static final int REVIEWABLE_MONTHS = 6;
  private static final int MAX_REVIEW_DEPTH = 3;

  /**
   * 리뷰 생성
   */
  @CacheEvict(value = {"reviews", "myReviews"}, allEntries = true)
  public void createReview(Long userId, ReviewRequest request, List<MultipartFile> images) {
    User user = findUserById(userId);
    Item item = findItemById(request.itemId());

    // 구매 이력 확인 및 주문 찾기
    Order order = validatePurchaseHistory(user.getId(), item.getId());

    // 부모 리뷰 확인
    Review parentReview = validateParentReview(request.parentId());

    Review review = Review.builder()
        .content(request.content())
        .star(request.star())
        .parentReview(parentReview)
        .depth(parentReview != null ? parentReview.getDepth() + 1 : 0)
        .user(user)
        .item(item)
        .order(order)
        .build();

    reviewRepository.save(review);

    if (images != null && !images.isEmpty()) {
      reviewImageService.uploadImage(review, images);
    }
  }

  /**
   * 상품별 리뷰 목록 조회 (계층 구조)
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "reviews", key = "#itemId + '_' + #pageRequest.pageNumber + '_' + #pageRequest.pageSize")
  public PageResponse<ReviewResponse> getReviews(Long itemId, PageRequest pageRequest) {
    findItemById(itemId); // 상품 존재 확인

    // 페이지네이션된 리뷰 조회
    Page<Review> reviews = reviewRepository.findAllByItem_Id(itemId, pageRequest);

    // Review → ReviewResponse 변환
    List<ReviewResponse> reviewResponses = reviews.getContent().stream()
        .map(review -> new ReviewResponse(review, new ArrayList<>()))
        .collect(Collectors.toList());

    // 계층 구조로 변환
    List<ReviewResponse> reviewTree = buildReviewTree(reviewResponses);

    // Page 형식으로 다시 변환
    Page<ReviewResponse> reviewPage = new PageImpl<>(reviewTree, pageRequest, reviews.getTotalElements());

    return PageResponse.fromPage(reviewPage);
  }

  /**
   * 내 리뷰 목록 조회 (N+1 문제 해결)
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "myReviews", key = "#userId + '_' + #pageRequest.pageNumber + '_' + #pageRequest.pageSize")
  public PageResponse<ReviewResponse> getMyReviews(Long userId, PageRequest pageRequest) {
    findUserById(userId); // 회원 존재 확인

    // 부모 리뷰만 조회 (depth = 0인 리뷰)
    Page<Review> parentReviews = reviewRepository.findAllByUserIdAndDepth(userId, 0, pageRequest);

    if (parentReviews.isEmpty()) {
      return PageResponse.fromPage(parentReviews.map(review -> null));
    }

    // N+1 문제 해결: 자식 리뷰들을 한 번에 조회
    List<Long> parentReviewIds = parentReviews.getContent().stream()
        .map(Review::getId)
        .collect(Collectors.toList());

    Map<Long, List<Review>> childReviewMap = loadChildReviewsInBatch(parentReviewIds);

    // 페이지 변환
    Page<ReviewResponse> reviewResponses = parentReviews.map(parentReview -> {
      List<Review> children = childReviewMap.getOrDefault(parentReview.getId(), Collections.emptyList());

      List<ReviewResponse> childResponses = children.stream()
          .map(childReview -> new ReviewResponse(childReview, Collections.emptyList()))
          .collect(Collectors.toList());

      return new ReviewResponse(parentReview, childResponses);
    });

    return PageResponse.fromPage(reviewResponses);
  }

  /**
   * 리뷰 수정
   */
  @CacheEvict(value = {"reviews", "myReviews"}, allEntries = true)
  public void updateReview(Long userId, Long reviewId, ReviewUpdate request,
      List<MultipartFile> images, List<Long> keepImageIds) {
    Review review = findReviewById(reviewId);

    // 권한 검증
    validateUpdatePermission(userId, review);

    // 부모 리뷰 수정 검증
    validateParentReviewUpdate(review, request);

    review.updateReview(request.content(), request.star());

    if (images != null || keepImageIds != null) {
      reviewImageService.updateImages(review, images, keepImageIds);
    }
  }

  /**
   * 리뷰 삭제
   */
  @CacheEvict(value = {"reviews", "myReviews"}, allEntries = true)
  public void deleteReview(Long userId, Long reviewId) {
    Review review = findReviewById(reviewId);

    // 권한 검증
    validateDeletePermission(userId, review);

    // 소프트 삭제 실행
    review.softDelete();
  }

  /**
   * 리뷰 작성 가능한 주문 목록 조회
   */
  @Transactional(readOnly = true)
  public List<ReviewableOrderResponse> getReviewableOrders(Long userId) {
    findUserById(userId); // 사용자 존재 확인

    LocalDateTime cutoffDate = LocalDateTime.now().minusMonths(REVIEWABLE_MONTHS);
    List<Order> completedOrders = orderRepository
        .findRecentCompletedOrdersByUserId(userId, OrderStatus.COMPLETE, cutoffDate);

    return buildReviewableOrderResponses(completedOrders, userId);
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
  }

  private Item findItemById(Long itemId) {
    return itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
  }

  private Review findReviewById(Long reviewId) {
    return reviewRepository.findById(reviewId)
        .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));
  }

  private Order validatePurchaseHistory(Long userId, Long itemId) {
    Order order = orderRepository.findTopByUserIdAndOrderItems_Item_IdOrderByCreatedAtDesc(userId, itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 구매한 사용자만 리뷰를 작성할 수 있습니다."));

    if (order.getOrderStatus() != OrderStatus.COMPLETE) {
      throw new IllegalArgumentException("주문이 완료된 경우에만 리뷰를 작성할 수 있습니다.");
    }

    return order;
  }

  private Review validateParentReview(Long parentId) {
    if (parentId == null) {
      return null;
    }

    Review parentReview = findReviewById(parentId);

    if (parentReview.getDepth() >= MAX_REVIEW_DEPTH) {
      throw new IllegalArgumentException("더 이상 대댓글을 작성할 수 없습니다.");
    }

    return parentReview;
  }

  private void validateUpdatePermission(Long userId, Review review) {
    if (!userId.equals(review.getUser().getId())) {
      throw new IllegalArgumentException("리뷰를 수정할 권한이 없습니다.");
    }
  }

  private void validateDeletePermission(Long userId, Review review) {
    if (!userId.equals(review.getUser().getId())) {
      throw new IllegalArgumentException("리뷰를 삭제할 권한이 없습니다.");
    }
  }

  private void validateParentReviewUpdate(Review review, ReviewUpdate request) {
    if (review.getParentReview() != null && request.parentId() != null) {
      throw new IllegalArgumentException("부모 리뷰는 수정할 수 없습니다.");
    }
  }

  private Map<Long, List<Review>> loadChildReviewsInBatch(List<Long> parentReviewIds) {
    if (parentReviewIds.isEmpty()) {
      return Collections.emptyMap();
    }

    List<Review> allChildReviews = reviewRepository.findAllByParentReviewIdIn(parentReviewIds);
    return allChildReviews.stream()
        .collect(Collectors.groupingBy(review -> review.getParentReview().getId()));
  }

  private List<ReviewResponse> buildReviewTree(List<ReviewResponse> reviews) {
    Map<Long, ReviewResponse> reviewMap = new HashMap<>();
    List<ReviewResponse> roots = new ArrayList<>();

    // 모든 리뷰를 매핑
    for (ReviewResponse review : reviews) {
      reviewMap.put(review.id(), review);
    }

    // 부모-자식 관계 설정
    for (ReviewResponse review : reviews) {
      if (review.parentId() != null) {
        ReviewResponse parent = reviewMap.get(review.parentId());
        if (parent != null) {
          parent.childReviews().add(review);
        }
      } else {
        roots.add(review);
      }
    }

    return roots.isEmpty() ? reviews : roots;
  }

  private List<ReviewableOrderResponse> buildReviewableOrderResponses(List<Order> completedOrders, Long userId) {
    List<ReviewableOrderResponse> reviewableItems = new ArrayList<>();

    for (Order order : completedOrders) {
      order.getOrderItems().forEach(orderItem -> {
        boolean hasReview = reviewRepository.existsByOrderIdAndItemIdAndUserId(
            order.getId(), orderItem.getItem().getId(), userId);

        if (!hasReview) {
          reviewableItems.add(ReviewableOrderResponse.builder()
              .orderId(order.getId())
              .itemId(orderItem.getItem().getId())
              .itemName(orderItem.getItem().getName())
              .orderDate(order.getCreatedAt())
              .quantity(orderItem.getQuantity())
              .price(orderItem.getPrice())
              .build());
        }
      });
    }

    // 최신 주문순으로 정렬
    return reviewableItems.stream()
        .sorted((a, b) -> b.orderDate().compareTo(a.orderDate()))
        .collect(Collectors.toList());
  }
}