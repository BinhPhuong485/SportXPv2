-- ==============================================================
-- SPORTXP: THÊM CỘT YÊU CẦU GIỚI TÍNH (TARGET_GENDER) VÀO BẢNG MATCH_ROOMS
-- Chạy đoạn script này trên Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================

-- 1. Thêm cột target_gender vào bảng match_rooms
ALTER TABLE public.match_rooms 
ADD COLUMN IF NOT EXISTS target_gender text DEFAULT 'all' CHECK (target_gender IN ('all', 'male', 'female'));

-- 2. Thêm chú thích cho cột target_gender
COMMENT ON COLUMN public.match_rooms.target_gender IS 'Yêu cầu giới tính của kèo: all (Nam & Nữ), male (Chỉ Nam), female (Chỉ Nữ)';

-- 3. Cập nhật các phòng hiện tại (nếu đang null) thành 'all'
UPDATE public.match_rooms
SET target_gender = 'all'
WHERE target_gender IS NULL;
