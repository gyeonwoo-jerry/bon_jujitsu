package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemOption;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.ItemRequest;
import bon.bon_jujitsu.dto.response.ItemResponse;
import bon.bon_jujitsu.dto.response.LatestItemResponse;
import bon.bon_jujitsu.dto.update.ItemOptionUpdate;
import bon.bon_jujitsu.dto.update.ItemUpdate;
import bon.bon_jujitsu.repository.ItemOptionRepository;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
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
public class ItemService {

  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final ItemImageService itemImageService;
  private final ItemOptionRepository itemOptionRepository;

  public void createItem(Long userId, ItemRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if(!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 상품등록이 가능합니다.");
    }

    Item item = Item.builder()
        .name(request.name())
        .content(request.content())
        .price(request.price())
        .sale(request.sale())
        .build();

    itemRepository.save(item);

    List<ItemOption> itemOptions = request.options().stream()
        .map(optionRequest -> new ItemOption(
            null,
            optionRequest.size() != null ? optionRequest.size() : "NONE",  // 기본값 설정
            optionRequest.color() != null ? optionRequest.color() : "DEFAULT", // 기본값 설정
            optionRequest.amount(),
            item))
        .toList();

    itemOptionRepository.saveAll(itemOptions);

    itemImageService.uploadImage(item, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<ItemResponse> getItems(int page, int size, Long userId, String name) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 상품조회를 이용할 수 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Item> items;
    if (name != null && !name.isBlank()) {
      items = itemRepository.findByNameContainingIgnoreCase(name, pageRequest); // 🔍 조건 검색
    } else {
      items = itemRepository.findAll(pageRequest); // 전체 조회
    }

    Page<ItemResponse> allItems = items.map(ItemResponse::fromEntity);

    return PageResponse.fromPage(allItems);
  }

  @Transactional(readOnly = true)
  public ItemResponse getItem(Long itemId, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 상품조회를 이용할 수 없습니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    return ItemResponse.fromEntity(item);
  }

  public void updateItem(Long userId, ItemUpdate update, Long itemId, List<MultipartFile> images) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 상품수정이 가능합니다.");
    }

    Item item = itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    // 기본 정보 업데이트
    update.name().ifPresent(item::updateName);
    update.content().ifPresent(item::updateContent);
    update.price().ifPresent(item::updatePrice);
    update.sale().ifPresent(item::updateSale);

    // 옵션 정보 업데이트 (기존 옵션 삭제 후 다시 저장)
    update.option().ifPresent(optionRequests -> {
      // 기존 옵션 목록 가져오기
      List<ItemOption> existingOptions = itemOptionRepository.findByItemId(itemId);

      // 새로운 옵션 리스트
      List<ItemOption> updatedOptions = new ArrayList<>();

      for (int i = 0; i < optionRequests.size(); i++) {
        ItemOptionUpdate request = optionRequests.get(i);

        // 기존 옵션이 있으면 업데이트, 없으면 새로 추가
        ItemOption option = (i < existingOptions.size()) ? existingOptions.get(i)
            : new ItemOption(null, "NONE", "DEFAULT", 1, item);

        // 값이 들어온 경우에만 업데이트
        request.size().ifPresent(option::updateSize);
        request.color().ifPresent(option::updateColor);
        request.amount().ifPresent(option::updateItemAmount);

        updatedOptions.add(option);
      }

      // 기존 옵션 삭제 후, 새로운 옵션 저장
      itemOptionRepository.deleteAllByItemId(itemId);
      itemOptionRepository.saveAll(updatedOptions);
    });

    // 상품 이미지 업데이트
    if (images != null && !images.isEmpty()) {
      itemImageService.updateImages(item, images);
    }
  }

  public void deleteItem(Long userId, Long itemId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if(!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 상품삭제가 가능합니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    item.softDelete();
  }

  public PageResponse<LatestItemResponse> getMainItems(int page, int size, Long userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 상품조회를 이용할 수 없습니다.");
    }

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Item> items = itemRepository.findTop4ByOrderByCreatedAtDesc(pageRequest);

    Page<LatestItemResponse> latestItems = items.map(LatestItemResponse::from);

    return PageResponse.fromPage(latestItems);
  }

  public boolean isNameDuplicate(String name) {
    return itemRepository.existsByName(name);
  }
}
