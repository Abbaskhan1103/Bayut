-- Create user_favorites table for saving favourite Islamic centres
CREATE TABLE IF NOT EXISTS user_favorites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  center_id   uuid REFERENCES centers(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, center_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own favourites
CREATE POLICY "Users manage own favourites"
  ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
