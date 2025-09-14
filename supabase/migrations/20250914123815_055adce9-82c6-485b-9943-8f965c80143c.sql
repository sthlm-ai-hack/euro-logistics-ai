-- Ensure realtime is enabled for changed_nodes table
ALTER TABLE public.changed_nodes REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already added
DO $$
BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'changed_nodes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.changed_nodes;
    END IF;
END $$;