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

    if (!user.isAdmin() && user.getBranchUsers().stream()
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

    if (!user.isAdmin() && user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 상품조회를 이용할 수 없습니다.");
    }

    Item item = itemRepository.findById(itemId).orElseThrow(()-> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    return ItemResponse.fromEntity(item);
  }

  public void updateItem(Long userId, ItemUpdate update, Long itemId, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (!user.isAdmin()) {
      throw new IllegalArgumentException("관리자만 상품수정이 가능합니다.");
    }

    Item item = itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    // 1. 기본 정보 업데이트
    update.name().ifPresent(item::updateName);
    update.content().ifPresent(item::updateContent);
    update.price().ifPresent(item::updatePrice);
    update.sale().ifPresent(item::updateSale);

    // 2. 옵션 업데이트
    update.option().ifPresent(optionRequests -> {
      // 기존 옵션 ID 기준 Map 생성
      List<ItemOption> existingOptions = itemOptionRepository.findByItemId(itemId);
      Map<Long, ItemOption> existingMap = existingOptions.stream()
          .collect(Collectors.toMap(ItemOption::getId, o -> o));

      List<ItemOption> toSave = new ArrayList<>();
      Set<Long> requestIds = new HashSet<>();

      for (ItemOptionUpdate request : optionRequests) {
        if (request.id().isPresent() && existingMap.containsKey(request.id().get())) {
          // 기존 옵션 업데이트
          ItemOption option = existingMap.get(request.id().get());
          request.size().ifPresent(option::updateSize);
          request.color().ifPresent(option::updateColor);
          request.amount().ifPresent(option::updateItemAmount);
          toSave.add(option);
          requestIds.add(option.getId());
        } else {
          // 새 옵션 추가
          ItemOption newOption = new ItemOption(
              null,
              request.size().orElse("NONE"),
              request.color().orElse("DEFAULT"),
              request.amount().orElse(1),
              item
          );
          toSave.add(newOption);
        }
      }

      // 삭제 대상 옵션 = 기존에는 있었는데 요청에서 누락된 ID
      List<ItemOption> toDelete = existingOptions.stream()
          .filter(opt -> !requestIds.contains(opt.getId()))
          .collect(Collectors.toList());

      itemOptionRepository.deleteAll(toDelete);
      itemOptionRepository.saveAll(toSave);
    });

    // 3. 이미지 업데이트
    if (images != null && !images.isEmpty()) {
      itemImageService.updateImages(item, images, keepImageIds);
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
