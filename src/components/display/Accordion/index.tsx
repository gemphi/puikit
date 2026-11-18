'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Icon } from '../../primitives/Icon';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import { Row } from '../../layout/Row';
import { Col } from '../../layout/Col';
import styles from './styles.module.scss';

type AccordionItemProps = {
  title: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export const AccordionItem = ({ title, open, onToggle, children }: AccordionItemProps) => {
  return (
    <Stack direction="column" className={styles.item}>
      <Row
        align="center"
        justify="between"
        className={styles.header}
        onClick={onToggle}
      >
        <Span className={styles.title}>{title}</Span>
        <Icon name={open ? ChevronDown : ChevronRight} size="sm" />
      </Row>
      {open && <Col className={styles.body}>{children}</Col>}
    </Stack>
  );
};

type AccordionProps = {
  children: React.ReactNode;
  className?: string;
};

export const Accordion = ({ children, className = '' }: AccordionProps) => {
  return <Stack direction="column" className={cn(styles.accordion, className)}>{children}</Stack>;
};
