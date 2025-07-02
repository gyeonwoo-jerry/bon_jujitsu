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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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

  @CacheEvict(value = "items", allEntries = true)
  public void createItem(Long userId, ItemRequest request, List<MultipartFile> images) {
    User user = validateUser(userId);
    validateAdmin(user);

    Item item = Item.builder()
        .name(request.name())
        .content(request.content())
        .price(request.price())
        .sale(request.sale())
        .build();

    itemRepository.save(item);

    // 옵션 생성 로직 간소화
    if (request.options() != null && !request.options().isEmpty()) {
      List<ItemOption> itemOptions = request.options().stream()
          .map(optionRequest -> new ItemOption(
              null,
              optionRequest.size() != null ? optionRequest.size() : "NONE",
              optionRequest.color() != null ? optionRequest.color() : "DEFAULT",
              optionRequest.amount(),
              item))
          .toList();

      itemOptionRepository.saveAll(itemOptions);
    }

    if (images != null && !images.isEmpty()) {
      itemImageService.uploadImage(item, images);
    }
  }

  @Transactional(readOnly = true)
  @Cacheable("items")
  public PageResponse<ItemResponse> getItems(int page, int size, Long userId, String name) {
    User user = validateUser(userId);
    validateUserAccess(user);

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Item> items = (name != null && !name.isBlank())
        ? itemRepository.findByNameContainingIgnoreCaseWithFetch(name, pageRequest)
        : itemRepository.findAllWithFetch(pageRequest);

    return PageResponse.fromPage(items.map(ItemResponse::fromEntity));
  }

  @Transactional(readOnly = true)
  @Cacheable(value = "items", key = "#itemId")
  public ItemResponse getItem(Long itemId, Long userId) {
    User user = validateUser(userId);
    validateUserAccess(user);

    Item item = itemRepository.findByIdWithFetch(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    return ItemResponse.fromEntity(item);
  }

  @CacheEvict(value = "items", allEntries = true)
  public void updateItem(Long userId, ItemUpdate update, Long itemId,
      List<MultipartFile> images, List<Long> keepImageIds) {
    User user = validateUser(userId);
    validateAdmin(user);

    Item item = validateItem(itemId);

    // 기본 정보 업데이트
    updateBasicItemInfo(item, update);

    // 옵션 업데이트
    update.option().ifPresent(optionRequests -> updateItemOptions(item, optionRequests));

    // 이미지 업데이트
    if (images != null || keepImageIds != null) {
      itemImageService.updateImages(item, images, keepImageIds);
    }
  }

  private void updateBasicItemInfo(Item item, ItemUpdate update) {
    update.name().ifPresent(item::updateName);
    update.content().ifPresent(item::updateContent);
    update.price().ifPresent(item::updatePrice);
    update.sale().ifPresent(item::updateSale);
  }

  private void updateItemOptions(Item item, List<ItemOptionUpdate> optionRequests) {
    List<ItemOption> existingOptions = itemOptionRepository.findByItemId(item.getId());
    Map<Long, ItemOption> existingMap = existingOptions.stream()
        .collect(Collectors.toMap(ItemOption::getId, o -> o));

    List<ItemOption> toSave = new ArrayList<>();
    Set<Long> requestIds = new HashSet<>();

    // 옵션 업데이트/추가 처리
    for (ItemOptionUpdate request : optionRequests) {
      if (request.id().isPresent() && existingMap.containsKey(request.id().get())) {
        // 기존 옵션 업데이트
        ItemOption option = existingMap.get(request.id().get());
        updateExistingOption(option, request);
        toSave.add(option);
        requestIds.add(option.getId());
      } else {
        // 새 옵션 추가
        toSave.add(createNewOption(request, item));
      }
    }

    // 삭제할 옵션 처리
    List<ItemOption> toDelete = existingOptions.stream()
        .filter(opt -> !requestIds.contains(opt.getId()))
        .toList();

    itemOptionRepository.deleteAll(toDelete);
    itemOptionRepository.saveAll(toSave);
  }

  private void updateExistingOption(ItemOption option, ItemOptionUpdate request) {
    request.size().ifPresent(option::updateSize);
    request.color().ifPresent(option::updateColor);
    request.amount().ifPresent(option::updateItemAmount);
  }

  private ItemOption createNewOption(ItemOptionUpdate request, Item item) {
    return new ItemOption(
        null,
        request.size().orElse("NONE"),
        request.color().orElse("DEFAULT"),
        request.amount().orElse(1),
        item
    );
  }

  @CacheEvict(value = "items", allEntries = true)
  public void deleteItem(Long userId, Long itemId) {
    User user = validateUser(userId);
    validateAdmin(user);

    Item item = validateItem(itemId);
    item.softDelete();
  }

  @Transactional(readOnly = true)
  @Cacheable("items")
  public PageResponse<LatestItemResponse> getMainItems(int page, int size, Long userId) {
    User user = validateUser(userId);
    validateUserAccess(user);

    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Item> items = itemRepository.findTop4ByOrderByCreatedAtDescWithFetch(pageRequest);

    return PageResponse.fromPage(items.map(LatestItemResponse::from));
  }

  @Transactional(readOnly = true)
  public boolean isNameDuplicate(String name) {
    return itemRepository.existsByName(name);
  }

  // 공통 검증 메서드들로 중복 제거
  private User validateUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));
  }

  private void validateAdmin(User user) {
    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 접근 가능합니다.");
    }
  }

  private void validateUserAccess(User user) {
    if (!user.isAdmin() && user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 이용할 수 없습니다.");
    }
  }

  private Item validateItem(Long itemId) {
    return itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
  }

}