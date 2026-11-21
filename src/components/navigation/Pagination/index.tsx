'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/Button';
import { Icon } from '../../primitives/Icon';
import { Span } from '../../primitives/Span';
import styles from './styles.module.scss';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) => {
  const pages: number[] = [];
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  if (totalPages <= 1) return null;

  return (
    <nav className={cn(styles.pagination, className)} aria-label="Pagination">
      <Button
        variant="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <Icon name={ChevronLeft} size="sm" />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant="glass"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <Icon name={ChevronRight} size="sm" />
      </Button>

      <Span variant="muted" className={styles.info}>
        {currentPage} / {totalPages}
      </Span>
    </nav>
  );
};
