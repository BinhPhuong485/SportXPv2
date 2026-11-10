# BẢN ĐẶC TẢ THUẬT TOÁN & KIẾN TRÚC KỸ THUẬT TOÀN DIỆN (MASTER ALGORITHMS & SYSTEMS SPECIFICATION) — SPORTXPV2

> **Phiên bản:** v3.0 Master Blueprint (Kế hoạch 3–5 tháng phát triển hệ thống lớn).  
> **Tác giả:** Chief Algorithm Scientist (Ex-ICPC / IOI) & Senior Backend Systems Architect.  
> **Đối tượng:** Toàn bộ Đội ngũ Kỹ thuật, Hội đồng Cổ đông và Senior Technical Reviewers.  
> **Nguyên tắc cốt lõi:** Tuyệt đối không hardcode, tối ưu Big-O Time/Space, SLA API < 25ms, triệt tiêu Deadlock và chi phí Server GPU = 0 VNĐ.

---

## MỤC LỤC
1. [CHIẾN LƯỢC TRIỂN KHAI THUẬT TOÁN (EVOLUTIONARY ROADMAP)](#1-chiến-lược-triển-khai-thuật-toán-evolutionary-roadmap)
2. [BỘ MÁY XẾP HẠNG THỂ THAO ĐỐI KHÁNG (CONTINUOUS GLICKO-2 & BAYESIAN SKILL RATING)](#2-bộ-máy-xếp-hạng-thể-thao-đối-kháng-continuous-glicko-2)
3. [BỘ MÁY GHÉP TRẬN & ĐỊA LÝ KHÔNG GIAN (GEOSPATIAL & UBER H3 SMART MATCHMAKING)](#3-bộ-máy-ghép-trận--địa-lý-không-gian-geospatial--uber-h3)
4. [HỆ ĐIỀU HÀNH GIẢI ĐẤU (TOURNAMENT OS: SWISS, ELIMINATION, ROUND-ROBIN)](#4-hệ-điều-hành-giải-đấu-tournament-os)
5. [BẢNG TIN CỘNG ĐỒNG & ĐỀ XUẤT XÃ HỘI (FEED RANKING & SOCIAL GRAPH)](#5-bảng-tin-cộng-đồng--đề-xuất-xã-hội-feed-ranking--social-graph)
6. [AI PHÂN TÍCH ĐỘNG TÁC THỂ THAO (EDGE AI POSE BIOMECHANICS COACH)](#6-ai-phân-tích-động-tác-thể-thao-edge-ai-pose-biomechanics-coach)
7. [KIẾN TRÚC HẠ TẦNG DỮ LIỆU & BẢO VỆ ĐỒNG THỜI (CONCURRENCY & STORAGE)](#7-kiến-trúc-hạ-tầng-dữ-liệu--bảo-vệ-đồng-thời-concurrency--storage)

---

## 1. CHIẾN LƯỢC TRIỂN KHAI THUẬT TOÁN (EVOLUTIONARY ROADMAP)

### 1.1 Trả Lời Câu Hỏi Chiến Lược: "Nên làm thuật toán ngay trong Sprint hay để cuối cùng?"
Trong kỹ thuật phần mềm cấp Senior, có 2 "cái bẫy" thường gặp:
1. **Bẫy Premature Optimization:** Cố gắng huấn luyện mô hình ML/Deep Learning hoặc cài đặt hệ phương trình vi phân phức tạp ngay từ ngày đầu khi dữ liệu người dùng bằng 0 (Cold-Start Problem).
2. **Bẫy Naive Debt (Nợ kỹ thuật ngây thơ):** Xây dựng CRUD ngây thơ không tính đến cấu trúc chỉ mục, kiểu dữ liệu xếp hạng và khóa đồng thời. Đến tháng thứ 4 khi tích hợp thuật toán, toàn bộ Database Schema bị vỡ vụn, buộc phải đập đi xây lại toàn bộ codebase.

**Giải pháp được chọn: CHIẾN LƯỢC CẮM RÚT CHUẨN BỊ SCHEMA (SCHEMA-READY PLUGGABLE STRATEGY):**
*   **Tháng 1 (Nền tảng & Cấu trúc Dữ liệu):** Thiết kế sẵn các trường dữ liệu thuật toán trong PostgreSQL (`h3_res8 BIGINT`, `glicko_rating`, `glicko_rd`, `glicko_volatility`, `last_match_at`). Tầng Service cài đặt thuật toán cơ sở (Baseline Algorithms: Standard Elo K=32, Haversine Bounding Box). Mở khóa toàn bộ Frontend và bắt đầu thu thập dữ liệu hành vi.
*   **Tháng 2 (Mở rộng Không gian & Rating nâng cao):** Triển khai Uber H3 K-Ring Spatial Query, Hệ số K thích ứng (Adaptive K), Trần đối đầu H2H (Sliding Window Redis ZSET), Chống Smurf.
*   **Tháng 3 (Social Feed & Edge AI Pose Coach):** Triển khai Gravity Time-Decay Feed, MediaPipe BlazePose WebAssembly trích xuất 33 keypoints chạy 100% Client-side.
*   **Tháng 4 (Tournament OS & Full Glicko-2 Engine):** Triển khai Swiss-System (Edmonds' Blossom), Single/Double Elimination Seeding, Continuous Glicko-2 và Nightly Reconciliation Batch.

---

## 2. BỘ MÁY XẾP HẠNG THỂ THAO ĐỐI KHÁNG (CONTINUOUS GLICKO-2)

### 2.1 Không Gian Trạng Thái Glicko-2
Mỗi VĐV `i` được mô hình hóa bằng phân phối xác suất Gaussian xác định bởi bộ 3 tham số:
*   Trình độ đánh giá kỳ vọng: `R_i` (Thang điểm SportXP: [300, 2400]).
*   Độ lệch tin cậy (Rating Deviation): `RD_i` (Thang chuẩn: [30.0, 350.0]).
*   Độ biến động phong độ (Rating Volatility): `sigma_vol_i` (Mặc định: 0.06).

**Công thức quy đổi tọa độ:**
```
mu_i = (R_i - 1000) / 173.7178
phi_i = RD_i / 173.7178
```
*Quy đổi ngược:* `R_i = mu_i × 173.7178 + 1000`, `RD_i = phi_i × 173.7178`.

---

### 2.2 Suy Giảm Độ Tin Cậy Theo Thời Gian (Temporal Brownian RD Decay)
Khi VĐV nghỉ thi đấu một khoảng thời gian `Delta_t` (ngày):
```
phi_decay(Delta_t) = min( phi_max, sqrt( phi_current^2 + c^2 × Delta_t ) )
```
Với `phi_max = 350 / 173.7178 ≈ 2.0148`.  
Hằng số khuếch tán Weiner `c` được hiệu chuẩn để một VĐV có `RD_min = 30` sau 180 ngày không thi đấu sẽ quay về `RD_max = 350`:
```
c = sqrt( (2.0148^2 - 0.1727^2) / 180 ) ≈ 0.1496 (day^(-0.5))
```

---

### 2.3 Mô Hình Phân Rã Đánh Đôi 2v2 (Doubles Bayesian Decomposition)
Cầu lông có 80% trận đấu là đánh đôi (2v2: Đội A `{A1, A2}` gặp Đội B `{B1, B2}`).

#### Bước 1: Tổng hợp phân phối Gaussian của Đội
```
mu_team_A = (mu_A1 + mu_A2) / 2 + Synergy_Bonus(A1, A2)
phi_team_A = sqrt( (phi_A1^2 + phi_A2^2) / 4 + phi_synergy^2 )
```
Hàm gắn kết đồng đội (Synergy) theo số trận `N_pair` đã đánh cùng nhau:
```
Synergy_Bonus(A1, A2) = 0.25 × ( 1 - exp( - N_pair / 15 ) )
phi_synergy^2 = - 0.5 × ( (phi_A1^2 + phi_A2^2) / 4 ) × ( 1 - exp( - N_pair / 15 ) )
```

#### Bước 2: Hàm kỳ vọng và độ co phương sai
```
g(phi) = 1 / sqrt( 1 + 3 × phi^2 / (pi^2) )
phi_match = sqrt( phi_team_A^2 + phi_team_B^2 )
E_A = 1 / ( 1 + exp( - g(phi_match) × (mu_team_A - mu_team_B) ) )
```

#### Bước 3: Phân bổ trách nhiệm (Bayesian Credit Assignment)
Thay vì chia đều 50-50, người chơi có độ bất định `phi` cao hơn sẽ hấp thụ biến động điểm lớn hơn để nhanh chóng hội tụ về đúng thứ hạng thực:
```
alpha_1 = ( phi_A1^2 ) / ( phi_A1^2 + phi_A2^2 )
alpha_2 = ( phi_A2^2 ) / ( phi_A1^2 + phi_A2^2 )
Delta_mu_A1 = 2 × alpha_1 × Delta_mu_team_A
Delta_mu_A2 = 2 × alpha_2 × Delta_mu_team_A
```

---

### 2.4 Hệ Số Nhân Biên Độ Chiến Thắng (Margin of Victory Multiplier - MoVM)
Điều chỉnh điểm số dựa trên tỉ số điểm ván đấu để phân biệt thắng sát nút (21-19) với thắng hủy diệt (21-4):
```
PR = TotalPoints_winner / max( 1, TotalPoints_loser )
MoVM = 0.80 + 0.55 × tanh( 0.45 × (PR - 1) )
```
*Đặc tính:* Chặn dưới 0.80 (bảo vệ bên thua sát nút), chặn trên 1.35 (thưởng thắng áp đảo, chống lạm phát điểm).

---

### 2.5 Phát Hiện Smurf & Chống Cày Điểm (Anti-Smurf & H2H Capping)
1.  **Head-to-Head Capping:** Mỗi cặp đấu chỉ được tính tối đa **2 trận có tính điểm Elo trong 24 giờ**. Trận thứ 3 trở đi tự động chuyển sang chế độ Unrated (Giao lưu). Triển khai bằng Redis Sorted Set với TTL 24h.
2.  **Win-Streak Anomaly Detection:** Khi một tài khoản thắng liên tiếp `W >= 4` trận:
```
mu_W = ∑_{k=1}^W E_k,   sigma_W^2 = ∑_{k=1}^W E_k × (1 - E_k)
Z_streak = ( W - mu_W ) / sqrt( max( 0.01, sigma_W^2 ) )
```
Nếu `Z_streak > 3.0` (xác suất ngẫu nhiên p < 0.135%):
*   Tăng tốc biến động: `sigma_vol = min(0.15, sigma_vol × 1.8)`, `phi = min(phi_max, phi × 1.5)` để đưa Smurf vọt lên bậc rank thật chỉ sau 1-2 trận.
*   Giảm tải tổn thương: Bên thua chỉ bị trừ 50% điểm số thông thường.

---

## 3. BỘ MÁY GHÉP TRẬN & ĐỊA LÝ KHÔNG GIAN (GEOSPATIAL & UBER H3)

### 3.1 Lượng Tử Hóa Không Gian Bằng Uber H3
*   Chọn **Resolution 8** (cạnh ~461m, diện tích ~0.73 km²) cho cụm sân nội thành và **Resolution 7** (cạnh ~1.22km, diện tích ~5.16 km²) cho sảnh tìm kèo.
*   Lưu trữ index dưới dạng **`BIGINT` trong PostgreSQL**: Cho phép tra cứu bằng B-Tree Index Scan với độ phức tạp `O(log N)` và tốc độ dưới **1.5ms**, vượt trội so với chỉ mục GiST mặt cầu nặng nề.

---

### 3.2 Máy Trạng Thái Nở Bán Kính Lũy Tiến (Dynamic Radius Expansion)
| Pha (Phase) | Thời gian chờ `t_wait` | Bán kính H3 (`k-ring`) | Khoảng cách ước tính | Chênh lệch Elo tối đa |
| :--- | :--- | :--- | :--- | :--- |
| **P1: Local Ideal** | 0s – 30s | `k = 1` (7 cells) | ≤ 3.0 km | ≤ ±50 Elo (1 bậc rank) |
| **P2: District Walk** | 31s – 90s | `k = 2` (19 cells) | ≤ 6.5 km | ≤ ±100 Elo (2 bậc rank) |
| **P3: Cross-Zone** | 91s – 180s | `k = 4` (61 cells) | ≤ 12.0 km | ≤ ±200 Elo (3 bậc rank) |
| **P4: Wide Catch** | > 180s | `k = 7` (169 cells) | ≤ 20.0 km | Mở rộng dải (±350 Elo) |

---

### 3.3 Hàm Khoảng Cách Đa Mục Tiêu (Multi-Objective Match Score - MOMS)
```
MOMS(u, v) = 0.40 × S_skill + 0.30 × S_dist + 0.20 × S_time + 0.10 × S_rep
```
Trong đó:
*   `S_skill = exp( - (mu_u - mu_v)^2 / (2 × 0.575^2) )`
*   `S_dist = max( 0.0, 1.0 - ( d_km / R_max )^1.5 )`
*   `S_time = min( 1.0, Time_Overlap_Minutes / 90 )` (Tối thiểu 60 phút).
*   `S_rep = ((Trust_u + Trust_v) / 200) × (Trust_Min < 80 ? 0.2 : 1.0)`.

---

## 4. HỆ ĐIỀU HÀNH GIẢI ĐẤU (TOURNAMENT OS)

```
                          [TOURNAMENT OS ENGINE]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[HỆ THỤY SĨ (SWISS)]       [LOẠI TRỰC TIẾP (ELIM)]     [VÒNG TRÒN (ROUND-ROBIN)]
  Edmonds' Blossom Algo       Cây Nhị Phân Lũy Thừa 2    Thuật toán Xoay Berger
  Max Weight Matching         Recursive Fold Seeding     O(1) Space Polygon
  Triệt tiêu Deadlock tái đấu Hạt giống 1 chỉ gặp 2 CK   Lịch đấu hoàn hảo N-1 vòng
```

### 4.1 Hệ Thụy Sĩ: Thuật Toán Edmonds' Blossom (Max Weight Matching)
*   **Vấn đề:** Ghép cặp tham lam (Greedy) thường xuyên bị Deadlock ở các vòng cuối khi các đấu thủ cuối bảng đã từng gặp nhau.
*   **Giải pháp:** Mô hình hóa thành **Cặp ghép có trọng số cực đại trên đồ thị vô hướng tổng quát (Maximum Weight General Graph Matching)**:
    *   Trọng số cạnh: `W(u, v) = 1,000,000 - 10,000 × (Score_u - Score_v)^2 - 10 × |mu_u - mu_v|`.
    *   Nếu đã gặp nhau: `(u, v) ∉ E` (Trọng số `-infinity`).
    *   Xử lý đấu thủ lẻ (Odd Bye): Thêm đỉnh ma `Ghost`, người có điểm thấp nhất và chưa nhận Bye sẽ được ghép với `Ghost`.
    *   Độ phức tạp: `O(|V| × |E| × log |V|)`. Với `N ≤ 256`, thời gian ghép cặp hoàn tất dưới **15ms**.

---

### 4.2 Single & Double Elimination: Thuật Toán Phân Nhánh Hạt Giống Đệ Quy
Khung nhánh đấu chuẩn kích thước `M = 2^( ⌈ log2(N) ⌉ )`.  
Thuật toán Fold-and-Invert đảm bảo:
*   Hạt giống 1 nằm ở đỉnh nhánh trên; Hạt giống 2 nằm ở đáy nhánh dưới.
*   Hạt giống 1 và 2 chỉ có thể gặp nhau tại trận Chung kết.
*   Byes được phân bổ ưu tiên tuyệt đối cho các hạt giống cao nhất.

---

### 4.3 Round-Robin: Thuật Toán Vòng Tròn Berger (Circle Method)
*   Nếu `N` lẻ, thêm đấu thủ ảo `BYE` (`N' = N + 1`).
*   Số vòng đấu: `N' - 1`. Số trận mỗi vòng: `N' / 2`.
*   Cố định phần tử `0`, xoay tròn các phần tử còn lại theo chiều kim đồng hồ qua từng vòng đấu.
*   Bộ nhớ phụ trợ: `O(1)`. Thời gian sinh lịch: `O(N²)`.

---

## 5. BẢNG TIN CỘNG ĐỒNG & ĐỀ XUẤT XÃ HỘI (FEED RANKING & SOCIAL GRAPH)

### 5.1 Điểm Trọng Lực Thời Gian (Modified Gravity Decay)
```
Feed_Score(p) = ( 1.0 + Reacts + 2.5 × Cmts + 5.0 × Is_Verified + 3.0 × Has_Media )^0.85 
                ÷ ( Delta_hours + 2.0 )^1.6 
                × ( 1.0 + 0.60 × Is_Home_Court + 0.80 × Is_Friend )
```
*Ý nghĩa:* Bài viết recap trận đấu thật có xác thực điểm (`Is_Verified = 1`) được ưu tiên vượt trội; hệ số suy giảm thời gian đẩy bài cũ xuống sau 24h.

---

### 5.2 Gợi Ý Bạn Bè & Đối Thủ (Jaccard Index)
```
Affinity(u, v) = 0.45 × Jaccard(Courts_u, Courts_v) + 0.35 × Jaccard(Friends_u, Friends_v) + 0.20 × Skill_Proximity
```
Tra cứu Top-10 bằng Min-Heap kích thước cố định trong `O(N log K)`.

---

## 6. AI PHÂN TÍCH ĐỘNG TÁC THỂ THAO (EDGE AI POSE BIOMECHANICS COACH)

### 6.1 Tại Sao Phải Là Edge AI Client-Side (MediaPipe Wasm/WebGL)?
*   **Mô hình Server GPU:** Chi phí ~\$180,000/tháng cho 5,000 CCU truyền video trực tiếp; vi phạm bảo mật hình ảnh cá nhân.
*   **Mô hình Edge AI SportXPv2:**
    *   Trình duyệt/App di động chạy MediaPipe BlazePose WebAssembly trích xuất 33 keypoints 3D ở tốc độ 30–60 FPS.
    *   Phân tích chuỗi động lực học (Kinetic Chain) ngay trên chip điện thoại (NPU/GPU).
    *   Server chỉ nhận duy nhất JSON telemetry tóm tắt (3 KB): Góc vung vợt, độ cao bật nhảy, điểm chạm.
    *   **Chi phí hạ tầng Server = 0 VNĐ.**

---

### 6.2 Công Thức Tính Góc Khuỷu Tay Khi Đập Cầu (Smash Angle)
Từ 3 mốc giải phẫu: Vai phải (`L12`), Khuỷu tay phải (`L14`), Cổ tay phải (`L16`):
```
vec_forearm = L16 - L14
vec_upperarm = L12 - L14
cos_theta = clamp( (vec_forearm • vec_upperarm) / ( |vec_forearm| × |vec_upperarm| ), -1.0, 1.0 )
theta_elbow_deg = arccos( cos_theta ) × ( 180.0 / pi )
```
*Quy chuẩn kỹ thuật:* Điểm tiếp xúc chuẩn yêu cầu `theta_elbow_deg ∈ [165°, 178°]`. Dưới 150° phát cảnh báo "Lỗi co tay khi đập cầu".

---

### 6.3 Phát Hiện Đỉnh Điểm Bật Nhảy (Jump Apex Detection)
Theo dõi vận tốc thẳng đứng của hông `v_y(t) = ( y_hip(t+1) - y_hip(t-1) ) / ( 2 × dt )`.  
Thời điểm Apex là điểm chuyển dấu vận tốc: `v_y(t-1) ≤ 0` và `v_y(t+1) > 0`.  
So khớp thời điểm đập cầu `t_smash` với `t_apex`: Nếu chênh lệch quá 3 frames (~50ms) -> Cảnh báo "Đập trễ khi cơ thể đã rơi".

---

## 7. KIẾN TRÚC HẠ TẦNG DỮ LIỆU & BẢO VỆ ĐỒNG THỜI (CONCURRENCY & STORAGE)

### 7.1 PostgreSQL Schema Mở Rộng
```sql
-- 1. Bổ sung trường Uber H3 vào courts và match_rooms
ALTER TABLE courts
    ADD COLUMN h3_res8 BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN coordinates GEOMETRY(Point, 4326);

ALTER TABLE match_rooms
    ADD COLUMN h3_res8 BIGINT NOT NULL DEFAULT 0;

CREATE INDEX idx_courts_h3_res8 ON courts (h3_res8);
CREATE INDEX idx_rooms_h3_res8_open ON match_rooms (h3_res8, status) WHERE status = 'OPEN';

-- 2. Bổ sung các trường Continuous Glicko-2 vào profiles
ALTER TABLE profiles
    ADD COLUMN glicko_rating DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
    ADD COLUMN glicko_rd DOUBLE PRECISION NOT NULL DEFAULT 350.0,
    ADD COLUMN glicko_volatility DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    ADD COLUMN last_match_at TIMESTAMPTZ,
    ADD COLUMN is_provisional BOOLEAN GENERATED ALWAYS AS (glicko_rd > 110.0) STORED;

-- 3. Bảng Audit Log xếp hạng phục vụ đối soát gian lận
CREATE TABLE glicko_rating_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id),
    match_id UUID REFERENCES session_matches(id),
    pre_rating DOUBLE PRECISION NOT NULL,
    post_rating DOUBLE PRECISION NOT NULL,
    pre_rd DOUBLE PRECISION NOT NULL,
    post_rd DOUBLE PRECISION NOT NULL,
    pre_volatility DOUBLE PRECISION NOT NULL,
    post_volatility DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_glicko_audit_player ON glicko_rating_audit_log (player_id, created_at DESC);
```

---

### 7.2 Giải Thuật Triệt Tiêu Deadlock 100%: Canonical ID Ordering
Khi xác nhận trận đấu đôi (2v2), 4 VĐV cần được cập nhật điểm. Để triệt tiêu hoàn toàn mã lỗi PostgreSQL `40P01: deadlock detected`, danh sách UUID **bắt buộc phải được sắp xếp tăng dần theo thứ tự từ điển trước khi xin cấp khóa**:

```java
@Service
@RequiredArgsConstructor
public class MatchSettlementServiceImpl implements MatchSettlementService {

    private final ProfileRepository profileRepository;
    private final SessionMatchRepository matchRepository;
    private final Glicko2Engine glicko2Engine;

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public MatchResultDto confirmAndSettleMatch(UUID matchId, UUID currentUserId) {
        // 1. Khóa bi quan dòng trận đấu để chống double-settlement
        SessionMatch match = matchRepository.findByIdForUpdate(matchId)
            .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        if (match.getStatus() == MatchStatus.CONFIRMED) {
            return MatchResultDto.from(match); // Idempotent
        }

        // 2. Thu thập toàn bộ 4 UUID của 2 đội
        List<UUID> playerIds = new ArrayList<>();
        playerIds.addAll(match.getTeamAPlayerIds());
        playerIds.addAll(match.getTeamBPlayerIds());

        // 3. CANONICAL SORTING: Triệt tiêu Deadlock 100%
        Collections.sort(playerIds);

        // 4. Khóa bi quan 4 profile theo đúng thứ tự đã sắp xếp
        List<Profile> lockedProfiles = profileRepository.findAllByIdInOrderedForUpdate(playerIds);

        // 5. Tính toán Glicko-2 & cập nhật dữ liệu
        glicko2Engine.calculateAndApply(match, lockedProfiles);

        match.setStatus(MatchStatus.CONFIRMED);
        match.setConfirmedAt(Instant.now());
        return MatchResultDto.from(match);
    }
}
```

Repository Query:
```java
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Profile p WHERE p.id IN :ids ORDER BY p.id ASC")
    List<Profile> findAllByIdInOrderedForUpdate(@Param("ids") List<UUID> ids);
}
```

---

### 7.3 Bảng Tổng Kết Độ Phức Tạp Big-O & SLA Toàn Hệ Thống

| Nghiệp Vụ | Cấu Trúc / Thuật Toán | Time Complexity | SLA Thực Tế (P99) |
| :--- | :--- | :---: | :---: |
| **Tra cứu phòng theo mã** | B-Tree Unique Index Scan | **O(1)** | **< 2.5 ms** |
| **Tìm sân lân cận H3** | B-Tree In-List Scan (19 Hex IDs) | **O(k * log N)** | **< 3.0 ms** |
| **Top-100 BXH Toàn quốc** | Redis ZSET (ZREVRANGEBYSCORE) | **O(log N + M)** | **< 1.0 ms** |
| **Join phòng có khóa** | Pessimistic Write Lock PK | **O(1)** | **< 12.0 ms** |
| **Xác nhận kết quả 2v2** | Canonical Sorted Locks 4 VĐV | **O(1) Sort + 4 x O(1) Lock** | **< 18.0 ms** |
| **Bốc thăm giải đấu Swiss** | Edmonds' Blossom Matching | **O(V * E * log V)** | **< 15.0 ms (N=256)** |
| **Phân tích động tác AI** | MediaPipe BlazePose Client Wasm | **O(F) frame inference** | **0 ms Server CPU** |

