import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ComputeResult {
  id: string;
  function: string;
  result: any;
  is_pending: boolean;
  created_at: string;
  updated_at: string;
}

interface ComputeResultsProps {
  projectId: string;
}

export function ComputeResults({ projectId }: ComputeResultsProps) {
  const [results, setResults] = useState<ComputeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [projectId]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('compute_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching compute results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No computation results</h3>
        <p className="text-muted-foreground">No computation results have been created for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{result.function}</CardTitle>
              <Badge variant={result.is_pending ? "secondary" : "default"} className="flex items-center gap-1">
                {result.is_pending ? (
                  <>
                    <Clock className="w-3 h-3" />
                    Pending
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span className="block">Complete</span>
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
            </p>
          </CardHeader>
          <CardContent>
            {result.result && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Result:</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}