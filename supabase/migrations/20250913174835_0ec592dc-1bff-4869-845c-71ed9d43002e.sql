-- Create compute_results table
CREATE TABLE public.compute_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  function TEXT NOT NULL,
  result JSONB,
  is_pending BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.compute_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can access results for their own projects)
CREATE POLICY "Users can view their own computation results" 
ON public.compute_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = compute_results.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create computation results for their own projects" 
ON public.compute_results 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = compute_results.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own computation results" 
ON public.compute_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = compute_results.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own computation results" 
ON public.compute_results 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = compute_results.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_compute_results_updated_at
BEFORE UPDATE ON public.compute_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();