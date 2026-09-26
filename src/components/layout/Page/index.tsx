import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Section } from '../../layout/Section';
import { Stack, type StackProps } from '../../layout/Stack';
import styles from './styles.module.scss';

type PageSectionProps = Omit<React.ComponentProps<typeof Section>, 'as' | 'children'>;

export type PageProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  direction?: StackProps['direction'];
  gap?: StackProps['gap'];
  mainProps?: PageSectionProps;
  className?: string;
  children?: React.ReactNode;
};

export const Page = ({ header, sidebar, footer, direction = 'row', gap = 2, mainProps, className = '', children, ...props }: PageProps) => {
  const { className: mainClassName, ...mainSectionProps } = mainProps ?? {};

  return (
    <Stack direction={direction} gap={gap} className={cn(styles.page, className)} {...props}>
      {/* `Box`, not `Section`: Section sets `width: 100%`, which inside this flex
          row resolves against the whole page and pushes the content column
          off-screen. The rail must size to its own content. */}
      {/* A plain wrapper, not an `<aside>`: the rail it holds is itself an
          `<aside>`, and two nested complementary landmarks confuse a screen
          reader about where the navigation actually is. */}
      {sidebar && <Box className={styles.sidebarWrapper}>{sidebar}</Box>}
      <Stack direction="column" className={styles.contentWrapper}>
        {header && <Section as="header" className={styles.header}>{header}</Section>}
        <Section as="main" {...mainSectionProps} className={cn(styles.main, mainClassName)}>{children}</Section>
        {footer && <Section as="footer" className={styles.footer}>{footer}</Section>}
      </Stack>
    </Stack>
  );
};
