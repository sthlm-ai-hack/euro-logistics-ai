import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useMapboxToken = () => {
  const { user } = useAuth();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMapboxToken();
    }
  }, [user]);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("mapbox_token")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.mapbox_token) {
        setMapboxToken(data.mapbox_token);
      }
    } catch (error) {
      console.error("Error fetching mapbox token:", error);
      toast.error("Failed to load map configuration");
    } finally {
      setLoading(false);
    }
  };

  return { mapboxToken, loading };
};