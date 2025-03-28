export const IconConfig = {
  pencil: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 14.375V17.5H5.625L14.8417 8.28334L11.7167 5.15834L2.5 14.375ZM17.2583 5.86667C17.5833 5.54167 17.5833 5.01667 17.2583 4.69167L15.3083 2.74167C14.9833 2.41667 14.4583 2.41667 14.1333 2.74167L12.6083 4.26667L15.7333 7.39167L17.2583 5.86667Z" fill="currentColor"/>
  </svg>`,
  link: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 18C1.45 18 0.975 17.8083 0.575 17.425C0.191667 17.025 0 16.55 0 16V2C0 1.45 0.191667 0.983333 0.575 0.599999C0.975 0.199999 1.45 -1.43051e-06 2 -1.43051e-06H9V2H2V16H16V9H18V16C18 16.55 17.8 17.025 17.4 17.425C17.0167 17.8083 16.55 18 16 18H2ZM6.7 12.7L5.3 11.3L14.6 2H11V-1.43051e-06H18V7H16V3.4L6.7 12.7Z" fill="currentColor"/>
  </svg>`
};

export type IconName = keyof typeof IconConfig;
