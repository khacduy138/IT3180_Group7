import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/Form';
import { Toast } from '../../components/ui/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const form = useForm({
    defaultValues: {
      username: '', 
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userRole', result.user.role.name);
        localStorage.setItem('username', result.user.username);

        const roleRedirectMap = {
          admin: '/dashboard',
          accountant: '/billing',
          staff: '/households',
        };
        const redirectPath = roleRedirectMap[result.user.role.name] || '/dashboard';

        setToast({
          open: true,
          variant: 'success',
          title: 'Thành công',
          description: 'Chào mừng bạn quay trở lại!',
        });

        setTimeout(() => navigate(redirectPath), 1500);
      } else {
        throw new Error(result.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setToast({
        open: true,
        variant: 'error',
        title: 'Lỗi đăng nhập',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-8 left-8 flex flex-col">
        <span className="text-3xl font-black text-primary">BMS</span>
      </div>

      <Link to="/signup" className="absolute top-8 right-8">
        <Button variant="outline" size="sm">Sign up</Button>
      </Link>

      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Bạn đang đăng nhập vào</p>
          <h1 className="text-5xl font-black tracking-tighter">
            <span className="text-primary">Blue</span>Manage
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              rules={{ required: 'Vui lòng nhập Email/Tên đăng nhập' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{ required: 'Vui lòng nhập mật khẩu' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="abc@123" 
                        {...field} 
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nên dùng mật khẩu mạnh, bao gồm chữ cái viết thường và hoa, kí tự đặc biệt, và chữ số.
            </p>

            <div className="space-y-4 pt-2">
              <Button type="submit" className="w-full" loading={isLoading}>
                Đăng nhập
              </Button>
              <div className="text-center">
                <Link to="/forgot-password" size="sm" className="text-sm text-muted-foreground hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
          </form>
        </Form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
        </div>

        <Button variant="outline" className="w-full gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản? <Link to="/signup" className="text-primary font-medium hover:underline">Đăng kí</Link>
        </p>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={(open) => setToast({ ...toast, open })}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
      />

      <div className="absolute bottom-8 left-8">
        <Link to="/terms" className="text-xs text-muted-foreground hover:underline">Điều khoản dịch vụ</Link>
      </div>
    </div>
  );
}