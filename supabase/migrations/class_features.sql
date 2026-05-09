-- ── Class Features Migration ──────────────────────────────────────────────────

-- 1. Add account_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'teacher'));

-- 2. Classes table
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  join_code   TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Class members (students who joined a class)
CREATE TABLE IF NOT EXISTS class_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 4. Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  module      TEXT,  -- e.g. 'budgeting', 'investing', 'debt', 'goals', 'tax'
  due_date    DATE,
  points      INT NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assignment completions
CREATE TABLE IF NOT EXISTS assignment_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 6. Streaks
CREATE TABLE IF NOT EXISTS streaks (
  user_id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak   INT NOT NULL DEFAULT 0,
  longest_streak   INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,  -- e.g. 'first_goal', 'streak_7', 'budget_master'
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- ── RLS Policies ──────────────────────────────────────────────────────────────

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Classes: teacher owns their classes, students can read classes they're in
CREATE POLICY "Teachers manage own classes" ON classes
  FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students read joined classes" ON classes
  FOR SELECT USING (
    id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

-- Class members: teacher reads their class members, students read/insert own membership
CREATE POLICY "Teacher reads class members" ON class_members
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Students manage own membership" ON class_members
  FOR ALL USING (student_id = auth.uid());

-- Assignments: teacher manages, students read their class assignments
CREATE POLICY "Teacher manages assignments" ON assignments
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Students read class assignments" ON assignments
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

-- Completions: students manage own, teachers read their class completions
CREATE POLICY "Students manage own completions" ON assignment_completions
  FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers read class completions" ON assignment_completions
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Streaks & achievements: each user manages their own
CREATE POLICY "Users manage own streak" ON streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL USING (user_id = auth.uid());
-- Teachers can read student streaks/achievements for leaderboard
CREATE POLICY "Teachers read student streaks" ON streaks
  FOR SELECT USING (
    user_id IN (
      SELECT cm.student_id FROM class_members cm
      JOIN classes c ON c.id = cm.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Teachers read student achievements" ON achievements
  FOR SELECT USING (
    user_id IN (
      SELECT cm.student_id FROM class_members cm
      JOIN classes c ON c.id = cm.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );
