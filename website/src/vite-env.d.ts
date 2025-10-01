/// <reference types="vite/client" />

// JSX namespace declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.sass" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}

declare module "*.styl" {
  const content: string;
  export default content;
}

declare module "*.stylus" {
  const content: string;
  export default content;
}

declare module "*.pcss" {
  const content: string;
  export default content;
}

declare module "*.sss" {
  const content: string;
  export default content;
}