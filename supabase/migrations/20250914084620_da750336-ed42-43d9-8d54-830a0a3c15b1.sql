-- Create changed_edges table
CREATE TABLE public.changed_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  osm_id TEXT NOT NULL,
  cost FLOAT NOT NULL,
  cap FLOAT NOT NULL,
  color TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.changed_edges ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own changed edges" 
ON public.changed_edges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own changed edges" 
ON public.changed_edges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own changed edges" 
ON public.changed_edges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own changed edges" 
ON public.changed_edges 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_changed_edges_updated_at
BEFORE UPDATE ON public.changed_edges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();