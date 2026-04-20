// styled-jsx 타입 선언 — Next.js 14 App Router 호환
// <style jsx> JSX attribute를 TypeScript가 인식하도록 합니다

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

export {};
