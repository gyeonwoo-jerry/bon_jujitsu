package bon.bon_jujitsu.dummy;

import bon.bon_jujitsu.config.PasswordEncoder;
import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.BoardImage;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Comment;
import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemImage;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.NoticeImage;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderItem;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.PayType;
import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.ReviewImage;
import bon.bon_jujitsu.domain.Stripe;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.repository.BoardImageRepository;
import bon.bon_jujitsu.repository.BoardRepository;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.CommentRepository;
import bon.bon_jujitsu.repository.ItemImageRepository;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.NoticeImageRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.OrderRepository;
import bon.bon_jujitsu.repository.ReviewImageRepository;
import bon.bon_jujitsu.repository.ReviewRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.service.BoardImageService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@Transactional
public class DummyDataLoader implements CommandLineRunner {

  private final UserRepository userRepository;
  private final BranchRepository branchRepository;
  private final ItemRepository itemRepository;
  private final ItemImageRepository itemImageRepository;
  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final OrderRepository orderRepository;
  private final PasswordEncoder passwordEncoder;
  private final ReviewRepository reviewRepository;
  private final ReviewImageRepository reviewImageRepository;
  private final BoardRepository boardRepository;
  private final BoardImageRepository boardImageRepository;
  private final NoticeRepository noticeRepository;
  private final NoticeImageRepository noticeImageRepository;
  private final CommentRepository commentRepository;
  private final Faker faker = new Faker();
  private final Random random = new Random();

  @Override
  public void run(String... args) {
    // 1. 먼저 지부(Branch) 데이터 생성
    createBranchData();

    // 2. 사용자(User) 데이터 생성
    createUserData();

    // 3. 상품(Item) 데이터 생성
    createItemData();

    // 4. 카트 데이터 생성
    createCartData();

    // 5. 주문 데이터 생성
    createOrderData();

    // 6. 리뷰 데이터 생성
    createReviewData();

    // 7. 게시판 데이터 생성
    createBoardData();

    // 8. 공지사항 데이터 생성
    createNoticeData();

    // 9. 댓글 데이터 생성
    createCommentData();
  }

  private void createBranchData() {
    if (branchRepository.count() > 0) {
      log.info("✅ 이미 지부 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 지부 데이터 생성 시작!");

    for (int i = 0; i < 5; i++) {
      Branch branch = Branch.builder()
          .region(faker.address().city())
          .address(faker.address().fullAddress())
          .build();
      branchRepository.save(branch);
    }

    log.info("✅ 5개의 더미 지부 데이터가 생성되었습니다!");
  }

  private void createUserData() {
    if (userRepository.count() > 0) {
      log.info("✅ 이미 사용자 데이터가 존재하므로 더미 사용자 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 사용자 데이터 생성 시작!");

    List<Branch> branches = branchRepository.findAll();
    if (branches.isEmpty()) {
      throw new IllegalStateException("❌ 지사(Branch) 데이터가 존재하지 않습니다! 먼저 지사 데이터를 생성하세요.");
    }

    // 관리자 계정 생성 (상품 등록을 위해 필요)
    User admin = User.builder()
        .name("관리자")
        .memberId("admin")
        .password(passwordEncoder.encode("admin123"))
        .email("admin@example.com")
        .phoneNum("010-1234-5678")
        .address("서울시 강남구")
        .birthday("1990-01-01")
        .gender("Male")
        .level(10)
        .stripe(Stripe.values()[0])
        .userRole(UserRole.ADMIN)  // 관리자 권한 부여
        .branch(branches.get(0))
        .build();
    userRepository.save(admin);
    log.info("✅ 관리자 계정이 생성되었습니다!");

    // 일반 사용자 계정 생성
    for (int i = 0; i < 10; i++) {
      User user = User.builder()
          .name(faker.name().fullName())
          .memberId(faker.name().username())
          .password(passwordEncoder.encode("password123"))
          .email(faker.internet().emailAddress())
          .phoneNum(faker.phoneNumber().cellPhone())
          .address(faker.address().fullAddress())
          .birthday(faker.date().birthday().toString())
          .gender(random.nextBoolean() ? "Male" : "Female")
          .level(random.nextInt(10) + 1)  // 1~10 레벨
          .stripe(Stripe.values()[random.nextInt(Stripe.values().length)])
          .userRole(UserRole.values()[random.nextInt(UserRole.values().length)])
          .branch(branches.get(random.nextInt(branches.size()))) // 랜덤한 지사 연결
          .build();

      userRepository.save(user);
    }

    log.info("✅ 10명의 더미 사용자 데이터가 생성되었습니다!");
  }

  private void createItemData() {
    if (itemRepository.count() > 0) {
      log.info("✅ 이미 상품 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 상품 데이터 생성 시작!");

    // 상품 카테고리 및 이름 생성을 위한 샘플 데이터
    String[] categories = {"의류", "신발", "가방", "액세서리", "모자"};
    String[] clothingTypes = {"티셔츠", "바지", "자켓", "코트", "셔츠", "스웨터", "드레스"};
    String[] sizes = {"S", "M", "L", "XL", "XXL", "FREE"};

    // 더미 이미지 경로 생성을 위한 기본 URL
    String[] imageBaseUrls = {
        "https://example.com/images/products/",
        "https://storage.example.com/shop/items/",
        "https://cdn.example.org/store/products/",
        "https://images.example.net/fashion/"
    };

    // 이미지 확장자
    String[] extensions = {".jpg", ".png", ".webp"};

    for (int i = 0; i < 20; i++) {
      String category = categories[random.nextInt(categories.length)];
      String type = clothingTypes[random.nextInt(clothingTypes.length)];
      String brand = faker.company().name();

      Item item = Item.builder()
          .name(brand + " " + category + " " + type)
          .size(sizes[random.nextInt(sizes.length)])
          .content(faker.lorem().paragraph(3))
          .price((random.nextInt(10) + 1) * 10000)  // 10000 ~ 100000원 사이
          .sale(random.nextInt(50))  // 0 ~ 49% 할인
          .amount(random.nextInt(100) + 1)  // 1 ~ 100개 재고
          .build();

      Item savedItem = itemRepository.save(item);

      // 각 상품마다 1~5개의 이미지 경로 생성
      int imageCount = random.nextInt(5) + 1;
      for (int j = 0; j < imageCount; j++) {
        String baseUrl = imageBaseUrls[random.nextInt(imageBaseUrls.length)];
        String extension = extensions[random.nextInt(extensions.length)];
        String uuid = UUID.randomUUID().toString();
        String imagePath = baseUrl + category.toLowerCase() + "/" + uuid + extension;

        ItemImage itemImage = ItemImage.builder()
            .item(savedItem)
            .imagePath(imagePath)
            .build();

        itemImageRepository.save(itemImage);
      }
    }

    log.info("✅ 20개의 더미 상품 데이터와 이미지 경로가 생성되었습니다!");
  }

  private void createCartData() {
    if (cartRepository.count() > 0) {
      log.info("✅ 이미 장바구니 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 장바구니 데이터 생성 시작!");

    // 관리자가 아닌 일반 사용자 목록 조회
    List<User> users = userRepository.findAll().stream()
        .filter(user -> user.getUserRole() != UserRole.ADMIN)
        .collect(Collectors.toList());

    if (users.isEmpty()) {
      log.info("❌ 일반 사용자가 없어서 장바구니 데이터를 생성할 수 없습니다.");
      return;
    }

    // 상품 목록 조회
    List<Item> items = itemRepository.findAll();
    if (items.isEmpty()) {
      log.info("❌ 상품 데이터가 없어서 장바구니 데이터를 생성할 수 없습니다.");
      return;
    }

    // 각 사용자마다 장바구니 생성
    for (User user : users) {
      // 이미 장바구니가 있는지 확인
      Optional<Cart> existingCart = cartRepository.findByUser(user);

      Cart cart;
      if (existingCart.isPresent()) {
        cart = existingCart.get();
      } else {
        cart = Cart.builder()
            .user(user)
            .build();
        cart = cartRepository.save(cart);
      }

      // 각 장바구니에 1~5개의 상품 랜덤 추가
      int itemCount = random.nextInt(5) + 1;

      // 중복 상품 방지를 위한 세트
      Set<Long> addedItemIds = new HashSet<>();

      for (int i = 0; i < itemCount; i++) {
        // 랜덤 상품 선택 (중복 방지)
        Item item;
        do {
          item = items.get(random.nextInt(items.size()));
        } while (addedItemIds.contains(item.getId()));

        addedItemIds.add(item.getId());

        // 1~5개 수량으로 장바구니에 추가
        int quantity = random.nextInt(5) + 1;

        CartItem cartItem = CartItem.builder()
            .cart(cart)
            .item(item)
            .quantity(quantity)
            .price(item.getPrice())
            .build();

        cartItemRepository.save(cartItem);
      }
    }

    log.info("✅ 더미 장바구니 데이터가 생성되었습니다!");
  }

  private void createOrderData() {
    if (orderRepository.count() > 0) {
      log.info("✅ 이미 주문 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 주문 데이터 생성 시작!");

    // 관리자가 아닌 일반 사용자 목록 조회
    List<User> users = userRepository.findAll().stream()
        .filter(user -> user.getUserRole() != UserRole.ADMIN)
        .collect(Collectors.toList());

    if (users.isEmpty()) {
      log.info("❌ 일반 사용자가 없어서 주문 데이터를 생성할 수 없습니다.");
      return;
    }

    // 상품 목록 조회
    List<Item> items = itemRepository.findAll();
    if (items.isEmpty()) {
      log.info("❌ 상품 데이터가 없어서 주문 데이터를 생성할 수 없습니다.");
      return;
    }

    // 주문 상태 배열
    OrderStatus[] statuses = OrderStatus.values();
    // 결제 유형 배열
    PayType[] payTypes = PayType.values();

    // 각 사용자마다 1~3개의 주문 생성
    for (User user : users) {
      int orderCount = random.nextInt(3) + 1;

      for (int i = 0; i < orderCount; i++) {
        // 1~5개의 랜덤 상품으로 주문 구성
        int itemCount = random.nextInt(5) + 1;
        Set<Long> orderedItemIds = new HashSet<>();

        int totalCount = 0;
        int totalPrice = 0;

        // 주문 생성
        Order order = Order.builder()
            .name(user.getName())
            .address(faker.address().streetAddress())
            .zipcode(faker.address().zipCode())
            .addrDetail(faker.address().secondaryAddress())
            .phoneNum(faker.phoneNumber().cellPhone())
            .requirement(random.nextBoolean() ? faker.lorem().sentence() : null)
            .totalPrice(0) // 임시값, 나중에 업데이트
            .totalCount(0) // 임시값, 나중에 업데이트
            .payType(payTypes[random.nextInt(payTypes.length)])
            .orderStatus(statuses[random.nextInt(statuses.length)])
            .user(user)
            .build();

        // 각 주문에 1~5개의 상품 추가
        for (int j = 0; j < itemCount; j++) {
          // 랜덤 상품 선택 (중복 방지)
          Item item;
          do {
            item = items.get(random.nextInt(items.size()));
          } while (orderedItemIds.contains(item.getId()));

          orderedItemIds.add(item.getId());

          // 1~3개 수량으로 주문 아이템 추가
          int quantity = random.nextInt(3) + 1;
          int price = item.getPrice();

          // 총 금액과 수량 계산
          totalCount += quantity;
          totalPrice += price * quantity;

          // 주문 아이템 생성 및 연결
          OrderItem orderItem = OrderItem.builder()
              .quantity(quantity)
              .price(price)
              .item(item)
              .build();

          order.addOrderItem(orderItem);
        }

        // 총 금액과 수량 업데이트
        order.updateTotalInfo(totalPrice, totalCount);

        // 주문 저장
        orderRepository.save(order);
      }
    }

    log.info("✅ 더미 주문 데이터가 성공적으로 생성되었습니다!");
  }

  private void createReviewData() {
    if (reviewRepository.count() > 0) {
      log.info("✅ 이미 리뷰 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 리뷰 데이터 생성 시작!");

    // 완료된 주문 목록 조회
    List<Order> completedOrders = orderRepository.findAllByOrderStatus(OrderStatus.COMPLETED);
    if (completedOrders.isEmpty()) {
      log.info("❌ 완료된 주문이 없어서 리뷰 데이터를 생성할 수 없습니다.");
      return;
    }

    // 별점 범위
    double[] starRatings = {1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0};

    // 리뷰 내용 샘플
    String[] reviewContents = {
        "상품이 정말 마음에 들어요. 배송도 빨랐고 품질도 좋습니다.",
        "기대했던 것보다 약간 아쉬웠지만 가격 대비 괜찮은 것 같습니다.",
        "색상이 사진과 조금 다르네요. 그래도 디자인은 마음에 듭니다.",
        "사이즈가 딱 맞아서 좋았어요. 다음에도 이 브랜드 제품을 구매할 것 같아요.",
        "배송이 생각보다 오래 걸렸지만 제품 자체는 만족스럽습니다.",
        "여러 번 구매했는데 항상 만족합니다. 품질과 서비스 모두 좋아요.",
        "가격이 조금 비싸지만 그만큼 품질이 좋아서 만족합니다.",
        "친구에게도 추천하고 싶은 제품이에요. 정말 마음에 들어요.",
        "처음 구매해봤는데 기대 이상으로 좋았습니다. 다음에도 구매할 예정입니다.",
        "포장이 꼼꼼해서 좋았고 제품도 하자 없이 잘 받았습니다."
    };

    // 50% 확률로 부모 리뷰에 대한 답글 생성
    boolean createReplies = true;
    Map<Long, Review> parentReviewMap = new HashMap<>();

    for (Order order : completedOrders) {
      User user = order.getUser();

      // 각 주문의 주문 아이템에 대해 리뷰 생성
      for (OrderItem orderItem : order.getOrderItems()) {
        Item item = orderItem.getItem();

        // 80% 확률로 리뷰 작성
        if (random.nextDouble() < 0.8) {
          // 리뷰 내용 랜덤 선택
          String content = reviewContents[random.nextInt(reviewContents.length)];

          // 별점 랜덤 선택 (높은 별점이 더 많이 나오도록 가중치 부여)
          double star;
          double ratingRandom = random.nextDouble();
          if (ratingRandom < 0.7) {
            // 70% 확률로 4.0 이상의 별점
            star = starRatings[random.nextInt(3) + 6]; // 4.0, 4.5, 5.0
          } else if (ratingRandom < 0.9) {
            // 20% 확률로 3.0~3.5 별점
            star = starRatings[random.nextInt(2) + 4]; // 3.0, 3.5
          } else {
            // 10% 확률로 3.0 미만의 별점
            star = starRatings[random.nextInt(4)]; // 1.0, 1.5, 2.0, 2.5
          }

          // 부모 리뷰 생성
          Review parentReview = Review.builder()
              .content(content)
              .star(star)
              .depth(0)
              .user(user)
              .item(item)
              .order(order)
              .build();

          Review savedParentReview = reviewRepository.save(parentReview);
          parentReviewMap.put(savedParentReview.getId(), savedParentReview);

          // 이미지 생성 (30% 확률로 1~3개의 이미지 추가)
          if (random.nextDouble() < 0.3) {
            int imageCount = random.nextInt(3) + 1;
            for (int i = 0; i < imageCount; i++) {
              String imagePath = "https://example.com/reviews/images/" + UUID.randomUUID().toString() + ".jpg";

              ReviewImage reviewImage = ReviewImage.builder()
                  .review(savedParentReview)
                  .imagePath(imagePath)
                  .build();

              reviewImageRepository.save(reviewImage);
            }
          }
        }
      }
    }

    // 관리자 사용자 찾기 (관리자 답글 용)
    User admin = userRepository.findFirstByUserRole(UserRole.ADMIN).orElse(null);

    // 리뷰에 대한 답글 생성
    if (createReplies && admin != null) {
      String[] replyContents = {
          "소중한 리뷰 감사합니다. 앞으로도 좋은 제품으로 보답하겠습니다.",
          "리뷰 감사합니다. 말씀해주신 부분은 개선하도록 노력하겠습니다.",
          "고객님의 소중한 피드백 감사드립니다. 더 나은 서비스로 보답하겠습니다.",
          "소중한 의견 감사합니다. 다음에도 만족스러운 쇼핑이 되도록 최선을 다하겠습니다.",
          "불편을 드려 죄송합니다. 개선하여 더 나은 서비스를 제공하겠습니다."
      };

      // 부모 리뷰의 50%에 대해 관리자 답글 생성
      for (Review parentReview : parentReviewMap.values()) {
        if (random.nextDouble() < 0.5) {
          String replyContent = replyContents[random.nextInt(replyContents.length)];

          Review adminReply = Review.builder()
              .content(replyContent)
              .star(0) // 관리자 답글은 별점 없음
              .depth(1)
              .parentReview(parentReview)
              .user(admin)
              .item(parentReview.getItem())
              .order(parentReview.getOrder())
              .build();

          reviewRepository.save(adminReply);
        }
      }
    }

    log.info("✅ 더미 리뷰 데이터가 성공적으로 생성되었습니다!");
  }

  public void createBoardData() {
    if (boardRepository.count() > 0) {
      log.info("✅ 이미 게시글 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 게시글 데이터 생성 시작!");

    List<User> users = userRepository.findAll();
    List<Branch> branches = branchRepository.findAll();
    if (users.isEmpty() || branches.isEmpty()) {
      log.warn("❌ 사용자 또는 지부 데이터가 부족하여 게시글을 생성할 수 없습니다.");
      return;
    }

    String[] imageBaseUrls = {
        "https://example.com/images/boards/",
        "https://cdn.example.com/board_images/",
        "https://storage.example.net/board/"
    };
    String[] extensions = {".jpg", ".png", ".webp"};

    for (int i = 0; i < 20; i++) {
      User user = users.get(random.nextInt(users.size()));
      Branch branch = branches.get(random.nextInt(branches.size()));

      Board board = Board.builder()
          .title("더미 게시글 제목 " + i)
          .content(faker.lorem().paragraph(3))
          .branch(branch)
          .user(user)
          .build();

      Board savedBoard = boardRepository.save(board);

      // 30% 확률로 1~3개의 이미지 추가
      if (random.nextDouble() < 0.3) {
        int imageCount = random.nextInt(3) + 1;
        for (int j = 0; j < imageCount; j++) {
          String baseUrl = imageBaseUrls[random.nextInt(imageBaseUrls.length)];
          String extension = extensions[random.nextInt(extensions.length)];
          String uuid = UUID.randomUUID().toString();
          String imagePath = baseUrl + uuid + extension;

          BoardImage boardImage = BoardImage.builder()
              .board(savedBoard)
              .imagePath(imagePath)
              .build();

          boardImageRepository.save(boardImage);
        }
      }
    }

    log.info("✅ 20개의 더미 게시글 데이터가 생성되었습니다!");
  }

  public void createNoticeData() {
    if (noticeRepository.count() > 0) {
      log.info("✅ 이미 공지사항 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 공지사항 데이터 생성 시작!");

    List<User> owners = userRepository.findByUserRole(UserRole.OWNER);
    List<Branch> branches = branchRepository.findAll();
    if (owners.isEmpty() || branches.isEmpty()) {
      log.warn("❌ OWNER 권한을 가진 사용자 또는 지부 데이터가 부족하여 공지사항을 생성할 수 없습니다.");
      return;
    }

    String[] titles = {
        "공지사항 - 새로운 수업 일정 안내",
        "센터 운영 시간 변경 안내",
        "회원 대상 특별 이벤트 공지",
        "긴급 공지 - 시설 점검 안내",
        "새로운 강사 소개 및 수업 개설"
    };

    String[] contents = {
        "안녕하세요, 회원 여러분! 이번 주부터 새로운 수업 일정이 적용됩니다. 변경된 스케줄을 확인해주세요!",
        "운영 시간 변경 안내드립니다. 주말 운영 시간이 변경되었으니 참고 부탁드립니다.",
        "회원 여러분을 위한 특별 이벤트를 진행합니다! 많은 참여 바랍니다!",
        "시설 점검으로 인해 일부 프로그램이 일시 중단됩니다. 불편을 드려 죄송합니다.",
        "새로운 강사님이 오셨습니다! 새롭게 개설된 수업에 많은 관심 부탁드립니다."
    };

    String[] imageBaseUrls = {
        "https://example.com/images/notices/",
        "https://cdn.example.com/notice_images/",
        "https://storage.example.net/notices/"
    };
    String[] extensions = {".jpg", ".png", ".webp"};

    for (int i = 0; i < 10; i++) {
      User owner = owners.get(random.nextInt(owners.size()));
      Branch branch = owner.getBranch();

      Notice notice = Notice.builder()
          .title(titles[random.nextInt(titles.length)])
          .content(contents[random.nextInt(contents.length)])
          .branch(branch)
          .user(owner)
          .build();

      Notice savedNotice = noticeRepository.save(notice);

      // 30% 확률로 1~3개의 이미지 추가
      if (random.nextDouble() < 0.3) {
        int imageCount = random.nextInt(3) + 1;
        for (int j = 0; j < imageCount; j++) {
          String baseUrl = imageBaseUrls[random.nextInt(imageBaseUrls.length)];
          String extension = extensions[random.nextInt(extensions.length)];
          String uuid = UUID.randomUUID().toString();
          String imagePath = baseUrl + uuid + extension;

          NoticeImage noticeImage = NoticeImage.builder()
              .notice(savedNotice)
              .imagePath(imagePath)
              .build();

          noticeImageRepository.save(noticeImage);
        }
      }
    }

    log.info("✅ 10개의 더미 공지사항 데이터가 생성되었습니다!");
  }

  public void createCommentData() {
    if (commentRepository.count() > 0) {
      log.info("✅ 이미 댓글 데이터가 존재하므로 더미 데이터를 생성하지 않습니다.");
      return;
    }

    log.info("🚀 더미 댓글 데이터 생성 시작!");

    List<User> users = userRepository.findAll();
    List<Board> boards = boardRepository.findAll();
    List<Notice> notices = noticeRepository.findAll();

    if (users.isEmpty() || (boards.isEmpty() && notices.isEmpty())) {
      log.warn("❌ 사용자 또는 대상(게시글/공지사항) 데이터가 부족하여 댓글을 생성할 수 없습니다.");
      return;
    }

    Random random = new Random();
    String[] commentsContent = {
        "좋은 정보 감사합니다!", "정말 유용한 글이네요!", "잘 보고 갑니다!", "이 부분이 궁금한데요?",
        "더 자세한 설명이 필요해요.", "이거 정말 유용하네요!", "좋은 글이에요!", "다음에도 좋은 글 부탁드려요!"
    };

    // 댓글 저장을 위한 맵 (부모 댓글 ID를 저장하여 대댓글 생성에 사용)
    Map<Long, Comment> parentComments = new HashMap<>();

    // 각 게시글과 공지사항에 대해 3~5개 댓글 생성
    for (Board board : boards) {
      createCommentsForTarget(users, commentsContent, board.getId(), CommentType.BOARD, parentComments, random);
    }

    for (Notice notice : notices) {
      createCommentsForTarget(users, commentsContent, notice.getId(), CommentType.NOTICE, parentComments, random);
    }

    // 대댓글 생성 (전체 부모 댓글 중 50%에 대해 랜덤하게 대댓글 추가)
    createReplies(users, commentsContent, parentComments, random);

    log.info("✅ 더미 댓글 데이터가 성공적으로 생성되었습니다!");
  }

  /**
   * 특정 대상(게시글 또는 공지사항)에 대해 랜덤한 댓글을 생성
   */
  private void createCommentsForTarget(List<User> users, String[] commentsContent, Long targetId, CommentType type,
      Map<Long, Comment> parentComments, Random random) {
    int commentCount = random.nextInt(3) + 3; // 3~5개 생성
    for (int i = 0; i < commentCount; i++) {
      User user = users.get(random.nextInt(users.size()));
      String content = commentsContent[random.nextInt(commentsContent.length)];

      Comment comment = Comment.builder()
          .content(content)
          .depth(0)
          .user(user)
          .commentType(type)
          .targetId(targetId)
          .build();

      Comment savedComment = commentRepository.save(comment);
      parentComments.put(savedComment.getId(), savedComment); // 부모 댓글로 저장
    }
  }

  /**
   * 대댓글을 생성 (부모 댓글의 50%를 랜덤 선택하여 대댓글 작성)
   */
  private void createReplies(List<User> users, String[] commentsContent, Map<Long, Comment> parentComments, Random random) {
    List<Comment> parentList = new ArrayList<>(parentComments.values());

    for (Comment parent : parentList) {
      if (random.nextDouble() < 0.5) { // 50% 확률로 대댓글 생성
        User user = users.get(random.nextInt(users.size()));
        String content = commentsContent[random.nextInt(commentsContent.length)];

        Comment reply = Comment.builder()
            .content(content)
            .depth(parent.getDepth() + 1)
            .parentComment(parent)
            .user(user)
            .commentType(parent.getCommentType())
            .targetId(parent.getTargetId())
            .build();

        Comment savedReply = commentRepository.save(reply);

        // 추가적인 대댓글 (depth < 3) 가능하도록 저장
        if (savedReply.getDepth() < 3) {
          parentComments.put(savedReply.getId(), savedReply);
        }
      }
    }
  }
}

