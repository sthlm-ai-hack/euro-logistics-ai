-- Rename lecture_id column to project_id in chat_messages table
ALTER TABLE public.chat_messages RENAME COLUMN lecture_id TO project_id;