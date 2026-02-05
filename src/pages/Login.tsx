import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../components/Router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { signIn, resetPassword, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        await resetPassword(email);
        showToast('success', 'Password reset email sent. Check your inbox.');
        setForgotPassword(false);
      } else {
        await signIn(email, password);
        showToast('success', 'Logged in successfully!');

        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'staff') {
          navigate('/staff');
        } else {
          navigate('/client');
        }
      }
    } catch (error: any) {
      showToast('error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img
            src="/mt-cleaning-logo-transparent-clean.png"
            alt="MT Cleaning Group"
            className="h-20 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {forgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {forgotPassword
              ? 'Enter your email to receive reset instructions'
              : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          {!forgotPassword && (
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          )}

          <Button type="submit" fullWidth loading={loading}>
            {forgotPassword ? 'Send Reset Link' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={() => setForgotPassword(!forgotPassword)}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {forgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
          </button>
        </form>
      </div>
    </div>
  );
}
