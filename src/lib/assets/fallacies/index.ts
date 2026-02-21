export const fallacyFiles = import.meta.glob('./*.md', { 
  eager: true, 
  query: '?raw',
  import: 'default'
});
