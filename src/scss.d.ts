declare module '*.module.scss' {
  const styles: Record<string, string>;
  export default styles;
}

declare module '*.scss';
declare module '*.svg' {
  const url: string;
  export default url;
}
