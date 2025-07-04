import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useConvexQuery<T>(
  queryFn: Parameters<typeof useQuery>[0],
  ...args: Parameters<typeof useQuery>[1][]
): {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
} {
  const result = useQuery(queryFn, args[0]);
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return { data, loading, error };
}

export const useConvexMutation = (mutation: any) => {
  const mutationFn = useMutation(mutation);

  const [data, setData] = useState(undefined);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (...args: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, loading, error, mutate };
};
