import React from 'react';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { profileItemOfHolder } from '../../lib/data';
import { usePageTheme } from '../../lib/pageTheme';
import { PersonProfile } from '../../components/Phiegg/PersonProfile';

/** A person's page: the one profile (PersonProfile), wearing their profile PFT's colour when they hold one. */
export const ProfilePage: React.FC = () => {
  const { profileId } = useStore(phieggStore);
  usePageTheme(profileItemOfHolder(profileId)?.bg, undefined, 'vivid', 'entity');
  return <PersonProfile id={profileId} variant="page" />;
};
