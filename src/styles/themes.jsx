export const getTheme = (theme) => {
  return theme === 'dark' 
    ? { 
        backgroundColor: '#1f1f1f', 
        color: '#fff' 
      }
    : { 
        backgroundColor: '#fff', 
        color: '#000' 
      };
};