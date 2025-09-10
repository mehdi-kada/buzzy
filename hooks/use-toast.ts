'use client';

import { useToast as useSonnerToast } from 'sonner';

export function useToast() {
  const { toast, ...rest } = useSonnerToast();

  return {
    toast: (props: any) => {
      toast(props.title, {
        description: props.description,
        ...props,
      });
    },
    ...rest,
  };
}