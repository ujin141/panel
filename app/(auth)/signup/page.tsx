import { redirect } from 'next/navigation';

// signup 페이지는 더 이상 필요 없음 (PIN 인증 방식)
export default function SignupPage() {
  redirect('/login');
}
