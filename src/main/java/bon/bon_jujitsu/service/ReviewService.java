package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.ReviewRequest;
import bon.bon_jujitsu.dto.response.ReviewResponse;
import bon.bon_jujitsu.dto.update.ReviewUpdate;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.ReviewRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final ReviewRepository reviewRepository;
  private final OrderRepository orderRepository;
  private final ReviewImageService reviewImageService;

  public void createReview(Long userId, ReviewRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    Item item = itemRepository.findById(request.itemId()).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    // 구매 이력 확인 및 주문 찾기
    Order order = orderRepository.findTopByUserIdAndOrderItems_Item_IdOrderByCreatedAtDesc(user.getId(), item.getId())
        .orElseThrow(() -> new IllegalArgumentException("상품을 구매한 사용자만 리뷰를 작성할 수 있습니다."));

    // 상품을 받은사람 체크
    if (order.getOrderStatus() != OrderStatus.COMPLETED) {
      throw new IllegalArgumentException("주문이 완료된 경우에만 리뷰를 작성할 수 있습니다.");
    }

    // 부모 리뷰 확인
    Review parentReview = null;
    if (request.parentId() != null) {
      parentReview = reviewRepository.findById(request.parentId())
          .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

      if (parentReview.getDepth() >= 3) {
        throw new IllegalArgumentException("더 이상 대댓글을 작성할 수 없습니다.");
      }
    }

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

    reviewImageService.uploadImage(review, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<ReviewResponse> getReviews(Long itemId, PageRequest pageRequest) {
    itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    // 페이지네이션된 리뷰 조회
    Page<Review> reviews = reviewRepository.findAllByItem_Id(itemId, pageRequest);

    // Review → ReviewResponse 변환
    List<ReviewResponse> reviewResponses = reviews.getContent().stream()
        .map(review -> new ReviewResponse(
            review,
            new ArrayList<>() // 대댓글 리스트 초기화
        ))
        .collect(Collectors.toList());

    // 계층 구조로 변환
    List<ReviewResponse> reviewTree = buildReviewTree(reviewResponses);

    // Page 형식으로 다시 변환 (트리 구조 적용 후)
    Page<ReviewResponse> reviewPage = new PageImpl<>(reviewTree, pageRequest, reviews.getTotalElements());

    return PageResponse.fromPage(reviewPage);
  }

  // 대댓글을 포함한 트리 구조로 변환하는 메서드
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
          parent.childReviews().add(review); // 대댓글 추가
        }
      } else {
        roots.add(review); // 부모 리뷰면 루트에 추가
      }
    }

    return roots.isEmpty() ? reviews : roots;
  }

  @Transactional(readOnly = true)
  public PageResponse<ReviewResponse> getMyReviews(Long userId, PageRequest pageRequest) {
    userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

    // 1. 부모 리뷰만 조회 (depth = 0인 리뷰)
    Page<Review> parentReviews = reviewRepository.findAllByUserIdAndDepth(userId, 0, pageRequest);

    // 2. 해당 유저의 모든 부모 리뷰 ID 목록을 추출
    List<Long> parentReviewIds = parentReviews.getContent().stream()
        .map(Review::getId)
        .collect(Collectors.toList());

    // 3. 한 번의 쿼리로 모든 자식 리뷰 조회 (in 절 사용)
    List<Review> allChildReviews = Collections.emptyList();
    if (!parentReviewIds.isEmpty()) {
      allChildReviews = reviewRepository.findAllByParentReviewIdIn(parentReviewIds);
    }

    // 4. 부모 ID를 키로 하는 자식 리뷰 맵 생성
    Map<Long, List<Review>> childReviewMap = allChildReviews.stream()
        .collect(Collectors.groupingBy(review -> review.getParentReview().getId()));

    // 5. 페이지 변환
    Page<ReviewResponse> reviewResponses = parentReviews.map(parentReview -> {
      // 현재 부모 리뷰에 해당하는 자식 리뷰 목록 가져오기
      List<Review> children = childReviewMap.getOrDefault(parentReview.getId(), Collections.emptyList());

      // 자식 리뷰를 ReviewResponse로 변환
      List<ReviewResponse> childResponses = children.stream()
          .map(childReview -> new ReviewResponse(
              childReview,
              Collections.emptyList() // 손자 리뷰는 없다고 가정
          ))
          .collect(Collectors.toList());

      // 부모 리뷰와 자식 리뷰 목록으로 ReviewResponse 생성
      return new ReviewResponse(parentReview, childResponses);
    });

    return PageResponse.fromPage(reviewResponses);
  }

  public void updateReview(Long userId, Long reviewId, ReviewUpdate request, List<MultipartFile> images) {
    Review review = reviewRepository.findById(reviewId)
        .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

    // 사용자 검증
    if (!userId.equals(review.getUser().getId())) {
      throw new IllegalArgumentException("리뷰를 수정할 권한이 없습니다.");
    }

    // 부모 리뷰 수정 불가
    if (review.getParentReview() != null && request.parentId() != null) {
      throw new IllegalArgumentException("부모 리뷰는 수정할 수 없습니다.");
    }

    review.updateReview(request.content(), request.star());

    if (images != null && !images.isEmpty()) {
      reviewImageService.updateImages(review, images);
    }
  }


  public void deleteReview(Long userId, Long reviewId) {
    Review review = reviewRepository.findById(reviewId).orElseThrow(()->new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

    User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if (!user.isAdmin() && !review.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("삭제 권한이 없습니다.");
    }

    review.softDelete();
  }
}
