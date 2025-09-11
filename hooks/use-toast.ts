'use client';

import { toast } from 'sonner';

export function useToast() {
  return {
    toast: (props: any) => {
      toast(props.title, {
        description: props.description,
        ...props,
      });
    },
  };
}