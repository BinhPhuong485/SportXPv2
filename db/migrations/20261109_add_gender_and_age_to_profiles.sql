-- ==============================================================
-- SPORTXP: THÊM THÔNG TIN GIỚI TÍNH & ĐỘ TUỔI VÀO HỒ SƠ VẬN ĐỘNG VIÊN
-- Chạy đoạn script này trên Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================

-- 1. Thêm các cột gender, age, birth_year vào bảng profiles nếu chưa có
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 6 AND age <= 120),
ADD COLUMN IF NOT EXISTS birth_year integer;

-- 2. Thêm chú thích cho các cột
COMMENT ON COLUMN public.profiles.gender IS 'Giới tính VĐV: male (Nam), female (Nữ), other (Khác)';
COMMENT ON COLUMN public.profiles.age IS 'Độ tuổi của VĐV';
COMMENT ON COLUMN public.profiles.birth_year IS 'Năm sinh của VĐV';

-- 3. Cập nhật Trigger tự động ghi nhận khi user đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, gender, age, birth_year)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', 'Vận Động Viên'),
    new.raw_user_meta_data->>'gender',
    NULLIF(new.raw_user_meta_data->>'age', '')::integer,
    NULLIF(new.raw_user_meta_data->>'birth_year', '')::integer
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    gender = COALESCE(EXCLUDED.gender, profiles.gender),
    age = COALESCE(EXCLUDED.age, profiles.age),
    birth_year = COALESCE(EXCLUDED.birth_year, profiles.birth_year);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Kích hoạt trigger khi có tài khoản mới tạo trong auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger bảo đảm tính bất biến: Không cho phép đổi giới tính khi đã có
CREATE OR REPLACE FUNCTION public.prevent_gender_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.gender IS NOT NULL AND NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION 'Giới tính đã được thiết lập và không thể thay đổi.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_gender_modification ON public.profiles;
CREATE TRIGGER trg_prevent_gender_modification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_gender_modification();
