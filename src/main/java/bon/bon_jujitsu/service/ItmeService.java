package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemImage;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.ItemRequest;
import bon.bon_jujitsu.dto.response.ItemResponse;
import bon.bon_jujitsu.dto.response.ReviewResponse;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ItmeService {

  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final ItemImageService itemImageService;

  public void createItem(Long userId, ItemRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자만 상품등록이 가능합니다.");
    }

    Item item = Item.builder()
        .name(request.name())
        .size(request.size())
        .content(request.content())
        .price(request.price())
        .sale(request.sale())
        .amount(request.amount())
        .build();

    itemRepository.save(item);

    itemImageService.uploadImage(item, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<ItemResponse> getItems(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!EnumSet.of(UserRole.ADMIN, UserRole.OWNER, UserRole.USER).contains(user.getUserRole())) {
      throw new IllegalArgumentException("잘못된 사용자 역할입니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Item> items = itemRepository.findAll(pageRequest);

    Page<ItemResponse> allItems = items.map(item -> new ItemResponse(
        item.getId(),
        item.getName(),
        item.getSize(),
        item.getContent(),
        item.getPrice(),
        item.getSale(),
        item.getAmount(),
        Optional.ofNullable(item.getReviews()).orElse(Collections.emptyList())  // Null 방지
            .stream()
            .map(review -> new ReviewResponse(review, new ArrayList<>())) // 변경된 부분
            .collect(Collectors.toList()),
        item.getImages().stream().map(ItemImage::getImagePath).toList(),
        item.getCreatedAt(),
        item.getModifiedAt()
    ));


    return PageResponse.fromPage(allItems);
  }

  @Transactional(readOnly = true)
  public ItemResponse getItem(Long itemId, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!EnumSet.of(UserRole.ADMIN, UserRole.OWNER, UserRole.USER).contains(user.getUserRole())) {
      throw new IllegalArgumentException("잘못된 사용자 역할입니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    ItemResponse itemResponse = ItemResponse.fromEntity(item);

    return itemResponse;
  }

  public Status updateItem(Long userId, ItemResponse request, Long itemId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자만 상품수정이 가능합니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    item.updateItem(
        request.name(),
        request.size(),
        request.content(),
        request.price(),
        request.sale(),
        request.amount()
    );

    itemImageService.updateImages(item, images);

    return Status.builder()
        .status(HttpStatus.OK.value())
        .message("상품 정보 수정완료")
        .build();
  }

  public void deleteItem(Long userId, Long itemId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if(user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("관리자만 상품삭제가 가능합니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    item.softDelete();
  }
}
