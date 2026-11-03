export const handleItemClick = (path: string) => {
  const parts = path.split('/');
  if (parts.length > 2) {
    const sectionId = parts[parts.length - 1];
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }
};
