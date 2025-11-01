-- Create farmer_data table for storing crop submissions from Sindh farmers
CREATE TABLE public.farmer_data (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  crop TEXT NOT NULL,
  area NUMERIC NOT NULL CHECK (area > 0),
  yield NUMERIC NOT NULL CHECK (yield >= 0),
  wastage NUMERIC NOT NULL CHECK (wastage >= 0 AND wastage <= 100),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.farmer_data ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read farmer data (public analytics)
CREATE POLICY "Anyone can view farmer data"
ON public.farmer_data
FOR SELECT
USING (true);

-- Allow anyone to insert farmer data (public submission)
CREATE POLICY "Anyone can submit farmer data"
ON public.farmer_data
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries by region and crop
CREATE INDEX idx_farmer_data_region ON public.farmer_data(region);
CREATE INDEX idx_farmer_data_crop ON public.farmer_data(crop);
CREATE INDEX idx_farmer_data_created_at ON public.farmer_data(created_at DESC);