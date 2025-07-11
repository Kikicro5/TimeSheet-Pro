'use client';

import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageContext, Language } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-12">
          {language.toUpperCase()}
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('de')} disabled={language === 'de'}>
          Deutsch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')} disabled={language === 'en'}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
