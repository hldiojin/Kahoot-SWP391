declare module 'react-animals' {
  interface AnimalProps {
    name?: string;
    color?: string;
    size?: string;
    rounded?: boolean;
    square?: boolean;
    dance?: boolean;
  }

  const Animal: React.FC<AnimalProps>;
  export default Animal;
} 