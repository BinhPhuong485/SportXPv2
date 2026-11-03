# Kiến trúc Hệ thống SportXP (SportXPv2)

> Cập nhật: 31/10/2026.  
> Phiên bản v2 sử dụng kiến trúc chuẩn doanh nghiệp: **Java Spring Boot 3 Modular Monolith Backend + Supabase PostgreSQL Database + React TypeScript Frontend (Responsive Web App)**.

---

## 1. Tổng quan Kiến trúc Toàn diện

```
+-------------------------------------------------------------------------+
|                          CLIENT (Front-End)                             |
|  SportXPv2 Web App (React 18 + Vite + Tailwind CSS + Lucide Icons)      |
|  Directory: frontend/                                                   |
|  - Responsive Web / PWA (Mobile-first Shell, Tablet & Desktop Layout)    |
|  - Routing: Trang chủ (Feed), Kèo đấu (Rooms), Xếp hạng, Hồ sơ          |
+------------------------------------+------------------------------------+
                                     |
                                     | RESTful APIs (JSON) + Bearer JWT Token
                                     v
+-------------------------------------------------------------------------+
|              BACKEND SERVICE (Java Spring Boot 3 Modular Monolith)      |
|  Directory: backend/ (Java 17/21 + Spring Boot 3.x + Spring Security)   |
|  Package Root: exe.sportxp.backend                                      |
|                                                                         |
|  [Modular Feature Packages]:                                            |
|  * core/     : Security (Supabase JWT), Config, Exceptions, Utilities   |
|  * room/     : Flow A (Public Recruit) & Flow B (Private), Waitlist     |
|  * match/    : Ghi ván đấu, Đồng thuận 2 chiều, Bộ máy Elo & K-factor   |
|  * post/     : Bản tin Trang chủ, Match Recap, Review Sân (1-5 sao)     |
|  * ranking/  : BXH Cụm sân nhà (Home Court), BXH theo Khu vực, Toàn quốc|
|  * profile/  : Hộ chiếu QR VĐV, Liên kết Zalo/Facebook, Sân quen       |
|  * court/    : Danh mục sân bãi, Tiện ích, Tính toán Rating             |
+------------------------------------+------------------------------------+
                                     |
                                     | JDBC / HikariCP Pool (Spring Data JPA / Hibernate)
                                     v
+-------------------------------------------------------------------------+
|                     DATA LAYER (Supabase Cloud PostgreSQL)             |
|  Directory: db/schema.sql & db/migration_v2_1_update.sql                |
|  - PostgreSQL 15 Engine + RLS Policies                                  |
|  - Supabase Auth (auth.users) + Storage Buckets (Ảnh avatar, ảnh bài)   |
|  - Tables: profiles, courts, match_rooms, room_members, session_matches, |
|    posts, post_likes, post_comments, friendships, user_blocks...        |
+------------------------------------+------------------------------------+
```

---

## 2. Phân chia Module & Trách nhiệm Hệ thống

### 2.1 Frontend (`frontend/`)
- **Công nghệ:** React 18, Vite, TypeScript, Tailwind CSS v3, React Router v6.
- **Trách nhiệm:**
  - Hiển thị giao diện mobile-first theo chuẩn tương phản WCAG AA/AAA (Court Emerald `#00D665`, Dark `#07080A`, Light `#F8FAF9`).
  - Giao tiếp với Java Spring Boot Backend qua HTTP Client (Axios) có đính kèm Bearer Access Token (JWT lấy từ Supabase Auth Client).
  - Quản lý Client State, xuất file `.ics` đồng bộ vào Google/Apple Calendar.

### 2.2 Backend (`backend/` - Java Spring Boot Modular Monolith)
- **Công nghệ:** Java 17 hoặc 21 LTS, Spring Boot 3.x, Spring Data JPA, Spring Security OAuth2 Resource Server, Jakarta Validation, HikariCP, Maven.
- **Cấu trúc Package:** `exe.sportxp.backend` tổ chức theo **Package by Feature (Modular Monolith)** nhằm tối đa hóa tính gắn kết (High Cohesion) và bảo vệ ranh giới nghiệp vụ (Encapsulation).
- **Trách nhiệm:**
  - **Tập trung hóa toàn bộ Business Logic:** Sử dụng `@Transactional` để đảm bảo tính ACID khi đặt chỗ phòng và cập nhật điểm Elo.
  - **Xác thực danh tính (Security):** Spring Security OAuth2 Resource Server giải mã và xác thực token JWT do Supabase Auth phát hành.
  - **Quản lý Vòng đời Phòng (Room Module):** Flow A (Tuyển vãng lai) & Flow B (Kèo kín tính điểm), đôn Waitlist FIFO tự động.
  - **Bộ máy Chấm điểm Elo & Chống gian lận (Match Module):** Xác thực đồng thuận 2 chiều, trần đối đầu H2H 2 trận/ngày, hệ số K động.
  - **Cộng đồng & Bản tin (Post Module):** Quản lý bài đăng recap, ảnh chụp sân, review đánh giá sân.

### 2.3 Database Layer (`db/`)
- **Công nghệ:** Supabase Cloud PostgreSQL 15.
- **Tập lệnh:** `db/schema.sql` (schema chính thức) và `db/migration_v2_1_update.sql` (migration script).
