'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

export function AdBanner() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="relative w-full overflow-hidden shadow-lg">
      <div className="absolute top-1 right-1 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(false)}
          }
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close Ad</span>
        </Button>
      </div>
      <a href="#" target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.preventDefault()}>
        <Image
          src="https://placehold.co/1200x200.png"
          alt="Advertisement"
          width={1200}
          height={200}
          className="w-full object-cover"
          data-ai-hint="advertisement banner"
        />
      </a>
    </Card>
  );
}
