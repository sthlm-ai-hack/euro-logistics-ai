-- Create changed_nodes table
CREATE TABLE public.changed_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  osm_id TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  supply FLOAT NOT NULL,
  color TEXT NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.changed_nodes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own changed nodes" 
ON public.changed_nodes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own changed nodes" 
ON public.changed_nodes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own changed nodes" 
ON public.changed_nodes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own changed nodes" 
ON public.changed_nodes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_changed_nodes_updated_at
BEFORE UPDATE ON public.changed_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.changed_nodes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.changed_nodes;