-- Create helper function to check if user is a student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for students to read teacher profiles
CREATE POLICY "Allow students to read teacher profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (public.is_student() AND role = 'teacher');

-- Create student_queries table
CREATE TABLE IF NOT EXISTS student_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL CHECK (char_length(query_text) <= 2000),
    response_text TEXT CHECK (char_length(response_text) <= 4000),
    answered_by TEXT CHECK (answered_by IN ('ai', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_student_queries_student_id ON student_queries(student_id);
CREATE INDEX idx_student_queries_teacher_id ON student_queries(teacher_id);

-- Enable RLS
ALTER TABLE student_queries ENABLE ROW LEVEL SECURITY;

-- Policies for student_queries
CREATE POLICY "Allow students to read own queries"
    ON student_queries FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Allow students to insert queries"
    ON student_queries FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Allow teachers to read sent queries"
    ON student_queries FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

CREATE POLICY "Allow teachers to update queries"
    ON student_queries FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());
