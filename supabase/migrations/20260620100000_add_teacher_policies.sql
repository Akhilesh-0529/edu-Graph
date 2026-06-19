-- Create helper function to check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for teachers to read student profiles
CREATE POLICY "Allow teachers to read student profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (public.is_teacher() AND role = 'student');
