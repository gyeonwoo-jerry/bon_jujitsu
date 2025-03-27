package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.ItemRequest;
import bon.bon_jujitsu.dto.response.ItemResponse;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.ItemUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.ItmeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

  private final ItmeService itmeService;

  @PostMapping("/items")
  public ApiResponse<Void> createItem(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ItemRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    itmeService.createItem(userId, request, images);
    return ApiResponse.success("상품 등록 완료", null);
  }

  @GetMapping("/items")
  public ApiResponse<PageResponse<ItemResponse>> getItems (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @AuthenticationUserId Long userId
  ) {
    PageResponse<ItemResponse> itemList = itmeService.getItems(page, size, userId);
    return ApiResponse.success("상품 목록 조회 성공", itemList);
  }

  @GetMapping("/items/{itemId}")
  public ApiResponse<ItemResponse> getItem (
      @PathVariable("itemId") Long itemId,
      @AuthenticationUserId Long userId
  ) {
    return ApiResponse.success("상품 조회 성공", itmeService.getItem(itemId, userId));
  }

  @PatchMapping("/items/{itemId}")
  public ApiResponse<Void> updateItem(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ItemUpdate update,
      @PathVariable("itemId") Long itemId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    itmeService.updateItem(userId, update, itemId, images);
    return ApiResponse.success("상품 수정 성공", null);
  }

  @DeleteMapping("/items/{itemId}")
  public ApiResponse<Void> deleteItem(
      @AuthenticationUserId Long userId,
      @PathVariable("itemId") Long itemId
  ) {
    itmeService.deleteItem(userId, itemId);
    return ApiResponse.success("상품 삭제 성공", null);
  }
}
