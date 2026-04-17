-- ================================================================
-- FitCoach - Supabase Migration
-- PT profili genişletme + Öğrenci Programları
-- ================================================================

-- 1. pt_profiles tablosuna yeni sütunlar ekle
ALTER TABLE pt_profiles
  ADD COLUMN IF NOT EXISTS background text DEFAULT '',
  ADD COLUMN IF NOT EXISTS philosophy text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram text DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_photos jsonb DEFAULT '[]'::jsonb;

-- 2. Öğrenci Programları tablosu oluştur
CREATE TABLE IF NOT EXISTS student_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pt_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  weeks integer DEFAULT 4,
  is_active boolean DEFAULT true,
  exercises jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS politikaları
ALTER TABLE student_programs ENABLE ROW LEVEL SECURITY;

-- PT sadece kendi oluşturduğu programları görebilir/değiştirebilir
CREATE POLICY "PT kendi programlarını yönetebilir" ON student_programs
  FOR ALL USING (pt_id = auth.uid());

-- Atlet kendi programlarını görüntüleyebilir
CREATE POLICY "Atlet kendi programlarını görebilir" ON student_programs
  FOR SELECT USING (athlete_id = auth.uid());

-- 4. Updated_at otomatik güncelleme trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_programs_updated_at
  BEFORE UPDATE ON student_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. pt-photos storage bucket (eğer yoksa)
-- Supabase Dashboard > Storage > New Bucket: "avatars" (zaten var, public)
-- Bu bucket'a avatars/{userId}/photos/ path'i altında fotoğraf yüklenir

-- ================================================================
-- FitCoach - Migration v3
-- Program detay alanları + Chat fotoğraf desteği
-- ================================================================

-- 1. student_programs tablosuna yeni alanlar
ALTER TABLE student_programs
  ADD COLUMN IF NOT EXISTS cautions text DEFAULT '',
  ADD COLUMN IF NOT EXISTS general_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_name text DEFAULT '';

-- 2. messages tablosuna image_url ekle
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text;

-- messages type alanı 'image' değerini desteklemeli (varsa check constraint'i kaldır)
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;

-- 3. gallery bucket'ı zaten varsa chat/ ve programs/ prefix'leri kullanılabilir
-- Supabase Dashboard > Storage > gallery bucket > Public erişim açık olmalı

-- ================================================================
-- FitCoach - Migration v4
-- Vücut Analizi tablosu
-- ================================================================

CREATE TABLE IF NOT EXISTS body_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pt_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  week_number integer DEFAULT 1,
  pt_comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sporcu kendi analizlerini yönetebilir" ON body_analyses
  FOR ALL USING (athlete_id = auth.uid());

CREATE POLICY "pt ogrenci analizlerini gorebilir" ON body_analyses
  FOR ALL USING (pt_id = auth.uid());

CREATE TRIGGER body_analyses_updated_at
  BEFORE UPDATE ON body_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
