// app/register/page.tsx
// Server Component: only sets page metadata, then renders the interactive client form.
import type { Metadata } from 'next';
import { RegisterForm } from '../../components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register Your Restaurant - UP Food Delivery',
  description: 'Sign up your campus eatery as a UP Delivery partner merchant.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
