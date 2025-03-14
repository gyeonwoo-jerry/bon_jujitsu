package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.ItemRequest;
import bon.bon_jujitsu.dto.response.ItemResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.ItmeService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

  private final ItmeService itmeService;

  @PostMapping("/items")
  public ResponseEntity<Status> createItem(
      @AuthenticationUserId Long id,
      @Valid @RequestBody ItemRequest request
  ) {
    itmeService.createItem(id, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "상품등록 완료"));
  }

  @GetMapping("/items")
  public ResponseEntity<PageResponse<ItemResponse>> getItems (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(itmeService.getItems(page, size));
  }

  @GetMapping("/items/{itemId}")
  public ResponseEntity<ItemResponse> getItem (
      @PathVariable("itemId") Long itemId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(itmeService.getItem(itemId));
  }

  @PatchMapping("/items/{itemId}")
  public ResponseEntity<Status> updateItem(
      @AuthenticationUserId Long id,
      @Valid @RequestBody ItemResponse request,
      @PathVariable("itemId") Long itemId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(itmeService.updateItem(id,request,itemId));
  }

  @DeleteMapping("/items/{itemId}")
  public ResponseEntity<Void> deleteItem(
      @AuthenticationUserId Long id,
      @PathVariable("itemId") Long itemId
  ) {
    itmeService.deleteItem(id, itemId);
    return ResponseEntity.noContent().build();
  }
}
