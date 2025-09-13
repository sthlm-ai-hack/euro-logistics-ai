import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
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

  const truncateResult = (result: any, maxLength = 200) => {
    const resultString = JSON.stringify(result, null, 2);
    if (resultString.length <= maxLength) return resultString;
    return resultString.slice(0, maxLength) + '...';
  };

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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Result:</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Eye className="w-3 h-3 mr-1" />
                        View Full
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>Full Result - {result.function}</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-auto">
                        <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  {truncateResult(result.result)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}