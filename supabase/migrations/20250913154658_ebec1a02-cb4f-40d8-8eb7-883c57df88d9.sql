-- Update the trigger function to use project_id instead of lecture_id
CREATE OR REPLACE FUNCTION public.update_project_awaiting_ai()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the projects table to set is_awaiting_ai to now()
  -- Using project_id (renamed from lecture_id)
  UPDATE public.projects 
  SET is_awaiting_ai = now(), updated_at = now()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;