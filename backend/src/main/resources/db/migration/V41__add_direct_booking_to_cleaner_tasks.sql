-- Make reservation_id nullable and add direct_booking_id for direct booking checkout support
ALTER TABLE cleaner_tasks ALTER COLUMN reservation_id DROP NOT NULL;
ALTER TABLE cleaner_tasks ADD COLUMN IF NOT EXISTS direct_booking_id UUID REFERENCES direct_bookings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cleaner_tasks_direct_booking ON cleaner_tasks(direct_booking_id);
