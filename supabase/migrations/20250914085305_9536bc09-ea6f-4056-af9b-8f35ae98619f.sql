-- Make cost, cap, and color nullable in changed_edges table
ALTER TABLE public.changed_edges 
ALTER COLUMN cost DROP NOT NULL,
ALTER COLUMN cap DROP NOT NULL,
ALTER COLUMN color DROP NOT NULL;

-- Enable realtime for changed_edges table
ALTER TABLE public.changed_edges REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.changed_edges;