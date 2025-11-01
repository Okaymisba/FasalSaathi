-- Create profiles table for farmer information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Add farmer_id column to farmer_data
ALTER TABLE public.farmer_data
ADD COLUMN farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN province TEXT,
ADD COLUMN district TEXT;

-- Create indexes
CREATE INDEX idx_farmer_data_farmer_id ON public.farmer_data(farmer_id);
CREATE INDEX idx_farmer_data_province ON public.farmer_data(province);
CREATE INDEX idx_profiles_province ON public.profiles(province);

-- Update RLS policies for farmer_data
DROP POLICY IF EXISTS "Anyone can submit farmer data" ON public.farmer_data;
DROP POLICY IF EXISTS "Anyone can view farmer data" ON public.farmer_data;

-- Authenticated users can submit their own data
CREATE POLICY "Users can submit own farmer data"
ON public.farmer_data
FOR INSERT
WITH CHECK (auth.uid() = farmer_id);

-- Users can view data from their province
CREATE POLICY "Users can view data from their province"
ON public.farmer_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.province = farmer_data.province
  )
);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, province, district)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'province',
    new.raw_user_meta_data->>'district'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();