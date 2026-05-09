-- Class message board
CREATE TABLE IF NOT EXISTS class_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  pinned      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS class_messages_class_id_idx ON class_messages(class_id, created_at DESC);

ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;

-- Anyone in the class (teacher or student member) can read messages
CREATE POLICY "class_messages_select" ON class_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM class_members WHERE class_id = class_messages.class_id AND student_id = auth.uid())
    )
  );

-- Only the teacher of that class can post messages
CREATE POLICY "class_messages_insert" ON class_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid())
  );

-- Teacher can update (pin/unpin) their own messages
CREATE POLICY "class_messages_update" ON class_messages FOR UPDATE
  USING (auth.uid() = author_id);

-- Teacher can delete their own messages
CREATE POLICY "class_messages_delete" ON class_messages FOR DELETE
  USING (auth.uid() = author_id);
