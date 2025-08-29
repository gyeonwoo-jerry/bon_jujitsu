package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Popup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PopupRepository extends JpaRepository<Popup, Long> {

    // 활성화된 팝업 목록을 displayOrder 순으로 조회
    List<Popup> findByIsActiveTrueOrderByDisplayOrderAsc();

    // 현재 표시 가능한 팝업들 조회 (기간 내 + 활성화)
    @Query("SELECT p FROM Popup p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now ORDER BY p.displayOrder ASC")
    List<Popup> findActivePopupsInPeriod(@Param("now") LocalDateTime now);

    // 모든 팝업을 displayOrder 순으로 조회 (관리자용)
    List<Popup> findAllByOrderByDisplayOrderAsc();
}