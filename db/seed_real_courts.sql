-- ==============================================================================
-- SportXPv2 Real Badminton Courts Seed Data
-- Khu vực: TP. Thủ Đức, Quận 9, Quận Bình Thạnh (TP. Hồ Chí Minh)
-- Bảng: public.courts
-- ==============================================================================

-- 1. Enable pgcrypto / uuid extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Insert / Upsert Real Badminton Courts
INSERT INTO public.courts (id, name, address, district, city, area_code, rating, review_count, distance_km, amenities)
VALUES
  -- ============================================================================
  -- KHU VỰC 1: THÀNH PHỐ THỦ ĐỨC (TRUNG TÂM & QUẬN 2 CŨ)
  -- ============================================================================
  (
    'c0000001-0000-4000-8000-000000000001',
    'Sân Cầu Lông VSTAR Badminton',
    '629 Đỗ Xuân Hợp, Phường Phước Long B, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.8,
    210,
    1.5,
    '["10 sân thảm đạt chuẩn thi đấu", "Bãi xe ô tô rộng rãi", "Căng tin & Cafe lạnh", "Đèn LED chống chói cao cấp", "Có HLV kèm kỹ thuật", "Shop căng cước lấy liền"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    'Sân Cầu Lông Bình Triệu',
    'Số 8 Đường số 20, KP4, Phường Hiệp Bình Chánh, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.7,
    165,
    2.1,
    '["6 sân thảm PVC êm ái", "Kế bên TTTM Gigamall", "Bãi giữ xe rộng có mái che", "Quầy nước khoáng & thể thao", "Lớp dạy phong trào"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    'Sân Cầu Lông Tada Bình Lợi',
    '42 Kha Vạn Cân, Phường Hiệp Bình Chánh, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.8,
    290,
    2.8,
    '["10 sân tiêu chuẩn", "Trần cao thông thoáng", "Khán đài giao lưu rộng", "Bãi đỗ ô tô thuận tiện", "Shop đồ cầu lông chuyên nghiệp"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000004',
    'Sân Cầu Lông Tô Ngọc Vân',
    '260/6 Tô Ngọc Vân, Phường Tam Phú, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.6,
    140,
    3.2,
    '["8 sân thảm cao su", "Không gian sạch sẽ thoáng mát", "Giá thuê bình dân sinh viên", "Căng tin phục vụ nhanh", "Bãi xe máy rộng"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000005',
    'Sân Cầu Lông An Khánh',
    '26 Lương Định Của, Phường An Khánh, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.9,
    340,
    3.5,
    '["11 sân quy mô lớn hàng đầu", "Thảm Enlio chuyên nghiệp BWF", "Bãi đỗ xe ô tô thoải mái", "Phòng tắm nóng lạnh riêng", "Mở cửa đến 23:00"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000006',
    'Sân Cầu Lông Lavie 2',
    '40 Lương Định Của, Phường An Khánh, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.7,
    185,
    3.6,
    '["8 sân thảm xanh tiêu chuẩn", "Trần cao 11m thoáng khí", "Hệ thống quạt làm mát công nghiệp", "Bãi giữ xe rộng rãi"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000007',
    'Sân Cầu Lông Khánh Hồng',
    '34/9 Đường số 34, Phường Bình An, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.8,
    155,
    3.8,
    '["6 sân thảm cao cấp độ bám cao", "Đèn chiếu sáng chống lóa", "Khu ghế nghỉ sang trọng", "Dịch vụ nước giải khát tận nơi"]'::jsonb
  ),
  (
    'c0000001-0000-4000-8000-000000000008',
    'Sân Cầu Lông UTE (ĐH Sư Phạm Kỹ Thuật)',
    'Số 1 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức',
    'TP. Thủ Đức',
    'TP. Hồ Chí Minh',
    'THUDUC',
    4.7,
    195,
    1.2,
    '["Sân đa năng đạt chuẩn đại học", "Vị trí trung tâm ngã tư Thủ Đức", "Mặt sân bám giày tối đa", "Bãi giữ xe sinh viên an ninh"]'::jsonb
  ),

  -- ============================================================================
  -- KHU VỰC 2: QUẬN 9 (TP. THỦ ĐỨC)
  -- ============================================================================
  (
    'c0000002-0000-4000-8000-000000000001',
    'Sân Cầu Lông An Bình',
    '240A Dương Đình Hội, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.9,
    380,
    1.8,
    '["12 sân thi đấu lớn nhất Quận 9", "Thảm Yonex chính hãng BWF", "Hệ thống chiếu sáng tiêu chuẩn", "Bãi đỗ ô tô không giới hạn", "Phòng thay đồ & tắm nóng lạnh"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000002',
    'Sân Cầu Lông Sky Badminton',
    '462/9 Nguyễn Xiển, Phường Long Thạnh Mỹ, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.8,
    220,
    4.5,
    '["8 sân thảm mới 100%", "Kế bên Vinhomes Grand Park", "Mở cửa xuyên suốt đến 24:00", "Căng tin đồ uống & thức ăn nhẹ"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000003',
    'Sân Cầu Lông Kiến Thiết (Badminton Club)',
    'Số 50 Dân Chủ, Phường Hiệp Phú, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.8,
    260,
    2.0,
    '["8 sân thảm cao cấp", "Quạt thông gió công suất cao", "Bãi xe ô tô và xe máy rộng", "Shop căng cước vợt chuyên nghiệp"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000004',
    'Sân Cầu Lông Tám Khỏe',
    '270 Bưng Ông Thoàn, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.7,
    175,
    2.5,
    '["4 sân thảm cao su non chống chấn thương", "Có lớp huấn luyện kỹ thuật phong trào", "Trần cao thoáng", "Đèn LED dịu mắt"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000005',
    'Sân Cầu Lông Bình Thái',
    'Số 18 Xa lộ Hà Nội, Phường Phước Long B, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.6,
    130,
    1.4,
    '["Ngay mặt tiền Ngã tư Bình Thái", "Thảm bám chống trơn trượt", "Giá thuê hợp lý", "Bảo vệ giữ xe an toàn 24/7"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000006',
    'Sân Cầu Lông Đông Phương',
    '837 Đường Nguyễn Duy Trinh, Phường Phú Hữu, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.6,
    145,
    3.7,
    '["Không gian rộng rãi lâu năm", "Cộng đồng giao lưu đông đảo", "Căng tin phục vụ chu đáo", "Bãi xe máy rộng"]'::jsonb
  ),
  (
    'c0000002-0000-4000-8000-000000000007',
    'Sân Cầu Lông Song Phát',
    '175 Nguyễn Văn Tăng, Phường Long Bình, TP. Thủ Đức',
    'Quận 9',
    'TP. Hồ Chí Minh',
    'Q9',
    4.7,
    190,
    5.0,
    '["8 sân thảm quy mô lớn", "Hoạt động 24/24 cực linh hoạt", "Thảm cao su êm ái", "Dịch vụ căng cước và quầy phụ kiện"]'::jsonb
  ),

  -- ============================================================================
  -- KHU VỰC 3: QUẬN BÌNH THẠNH
  -- ============================================================================
  (
    'c0000003-0000-4000-8000-000000000001',
    'Sân Cầu Lông TADA Thanh Đa',
    '129/15 Bình Quới, Phường 27, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.9,
    410,
    2.2,
    '["8 sân thảm PVC tím đặc trưng", "Trần cao lộng gió bán đảo Thanh Đa", "Đèn LED chống chói tiêu chuẩn thi đấu", "Bãi đỗ ô tô", "Phòng thay đồ sạch sẽ"]'::jsonb
  ),
  (
    'c0000003-0000-4000-8000-000000000002',
    'Sân Cầu Lông Nơ Trang Long',
    '327 Nơ Trang Long, Phường 13, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.8,
    320,
    3.0,
    '["8 sân khang trang sạch sẽ", "Trần cao 10m", "Khu ghế nghỉ chờ thoáng mát", "Bãi giữ xe ô tô & xe máy an ninh 24/24"]'::jsonb
  ),
  (
    'c0000003-0000-4000-8000-000000000003',
    'Sân Cầu Lông CLB Hoàng Hoa Thám',
    '12/16 Hoàng Hoa Thám, Phường 7, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.7,
    215,
    3.4,
    '["Vị trí trung tâm Bình Thạnh", "Thảm cao su mới êm chân", "Đèn chiếu sáng chống lóa", "Phù hợp sinh hoạt CLB và giao lưu"]'::jsonb
  ),
  (
    'c0000003-0000-4000-8000-000000000004',
    'Sân Cầu Lông Thanh Đa',
    '353/7A Bình Quới, Phường 28, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.6,
    160,
    2.6,
    '["5 sân thảm tiêu chuẩn", "Không gian xanh thoáng đãng mát mẻ", "Giá thuê bình dân sinh viên", "Quầy nước giải khát đầy đủ"]'::jsonb
  ),
  (
    'c0000003-0000-4000-8000-000000000005',
    'Sân Cầu Lông Sinh Tố (Sinh Tố Badminton)',
    '283 Bình Quới, Phường 28, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.7,
    180,
    2.5,
    '["Mặt tiền đường Bình Quới dễ tìm", "Thảm bám giày chống trượt tốt", "Trang bị quạt mát khu vực nghỉ ngơi", "Mở cửa từ 05:00 đến 24:00"]'::jsonb
  ),
  (
    'c0000003-0000-4000-8000-000000000006',
    'Sân Cầu Lông Tre Xanh',
    '50/3 Xô Viết Nghệ Tĩnh, Phường 27, Quận Bình Thạnh',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    'BINHTHANH',
    4.6,
    140,
    2.0,
    '["Sân chơi gia đình và nhóm nhỏ", "Phòng thay đồ riêng biệt", "Wifi tốc độ cao miễn phí", "Camera an ninh giám sát 24/7"]'::jsonb
  )

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  district = EXCLUDED.district,
  city = EXCLUDED.city,
  area_code = EXCLUDED.area_code,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  distance_km = EXCLUDED.distance_km,
  amenities = EXCLUDED.amenities;

-- Verify inserted count
SELECT district, count(*) as court_count
FROM public.courts
GROUP BY district
ORDER BY district;

