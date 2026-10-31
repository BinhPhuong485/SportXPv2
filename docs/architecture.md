# Kiến trúc Hệ thống SportXP (SportXPv2)

> Cập nhật: 31/10/2026.  
> Phiên bản v2 sử dụng kiến trúc chuẩn doanh nghiệp: **Java Spring Boot Backend + Supabase PostgreSQL Database + React TypeScript Frontend (Responsive Web App)**.

---

## 1. Tổng quan Kiến trúc Toàn diện

```
+-------------------------------------------------------------------------+
|                          CLIENT (Front-End)                             |
|  SportXPv2 Web App (React 18 + Vite + Tailwind CSS + Lucide Icons)      |
|  - Responsive Web / PWA (Mobile-first Shell, Tablet & Desktop Layout)    |
|  - Routing: Trang chủ (Feed), Kèo đấu (Rooms), Xếp hạng, Hồ sơ          |
+------------------------------------+------------------------------------+
                                     |
                                     | RESTful APIs (JSON) + Bearer JWT Token
                                     v
+-------------------------------------------------------------------------+
|                   BACKEND SERVICE (Java Spring Boot 3)                  |
|  Directory: be/ (Java 17/21 + Spring Boot 3.x + Spring Security + JPA)  |
|                                                                         |
|  [Core Modules / Layers]:                                               |
|  * Security & Filter Chain:                                             |
|    - Supabase JWT Bearer Token Validation (Nimbus / Spring OAuth2)      |
|    - User Principal Context Extraction (Auth.UID)                       |
|  * Room Management Service:                                             |
|    - Flow A: Public Recruit (Tuyển người vãng lai, lấp slot, unrated)   |
|    - Flow B: Private Rated (Cáp kèo kín tính điểm Elo có đồng thuận)    |
|    - FIFO Waitlist & Schedule Conflict Validator                        |
|  * Match & Elo Settlement Engine:                                       |
|    - Dynamic K-Factor (K=8-10 bạn bè, K=16-20 đối thủ mới, trần H2H)   |
|    - Mutual Consent (2/2 đơn, 4/4 đôi hoặc đại diện 2 đội)             |
|    - Transactional Elo Ledger & Audit Trail                             |
|  * Social & Community Feed Service:                                     |
|    - Post Recap, Ảnh sau trận, Review & Đánh giá Sân                   |
|    - Like & Comment                                                     |
|  * Leaderboard & Court Ranking Service:                                 |
|    - Xếp hạng theo Cụm Sân gắn liền (Home Court)                       |
|    - Xếp hạng theo Khu vực (Quận/Huyện, Tỉnh/Thành phố)                 |
+------------------------------------+------------------------------------+
                                     |
                                     | JDBC / HikariCP Pool (Spring Data JPA / Hibernate)
                                     v
+-------------------------------------------------------------------------+
|                     DATA LAYER (Supabase Cloud PostgreSQL)             |
|  Directory: db/schema.sql                                               |
|  - PostgreSQL 15 Engine + RLS Policies                                  |
|  - Supabase Auth (auth.users) + Storage Buckets (Ảnh avatar, ảnh bài)   |
|  - Tables: profiles, courts, match_rooms, room_members, session_matches, |
|    posts, post_likes, post_comments, friendships, user_blocks...        |
+------------------------------------+------------------------------------+
```

---

## 2. Phân chia Module & Trách nhiệm Hệ thống

### 2.1 Frontend (`fe/`)
- **Công nghệ:** React 18, Vite, TypeScript, Tailwind CSS v3, React Router v6.
- **Trách nhiệm:**
  - Hiển thị giao diện mobile-first theo chuẩn tương phản WCAG AA/AAA (Court Emerald `#00D665`, Dark `#07080A`, Light `#F8FAF9`).
  - Giao tiếp với Java Spring Boot Backend qua HTTP Client (Axios) có đính kèm Bearer Access Token (JWT lấy từ Supabase Auth Client).
  - Quản lý Client State, xuất file `.ics` đồng bộ vào Google/Apple Calendar.

### 2.2 Backend (`be/` - Java Spring Boot)
- **Công nghệ:** Java 17 hoặc 21 LTS, Spring Boot 3.x, Spring Data JPA, Spring Security, Spring Validation (Jakarta Validation), HikariCP, Maven hoặc Gradle.
- **Trách nhiệm:**
  - **Tập trung hóa toàn bộ Business Logic & Ràng buộc toàn vẹn:** Sử dụng `@Transactional` để đảm bảo tính ACID khi cập nhật số chỗ trong phòng và tính toán điểm Elo.
  - **Xác thực danh tính (Security):** Spring Security OAuth2 Resource Server giải mã và xác thực token JWT do Supabase Auth phát hành. Lấy `sub` (UUID của user) làm định danh thực hiện mọi thao tác.
  - **Quản lý Vòng đời Phòng (Room Lifecycle):**
    - Kiểm tra xung đột lịch (`SCHEDULE_CONFLICT`).
    - Phân luồng Flow A (Public) và Flow B (Private bằng Join Code).
    - Quản lý danh sách chờ (Waitlist FIFO promotion).
  - **Bộ máy Chấm điểm Elo & Chống gian lận (Elo Engine):**
    - Kiểm tra điều kiện đồng thuận (Mutual Consent) trước khi cập nhật điểm.
    - Áp trần tần suất đối đầu (H2H Capping) và hệ số K động.
  - **Feed & Tương tác Cộng đồng:**
    - Cung cấp API bảng tin Trang chủ (bài recap, ảnh trận đấu, review sân).

### 2.3 Database Layer (`db/`)
- **Công nghệ:** Supabase Cloud PostgreSQL 15.
- **Trách nhiệm:** Lưu trữ dữ liệu quan hệ, khóa ngoại, chỉ mục hiệu năng cao.
