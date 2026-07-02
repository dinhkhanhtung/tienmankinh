"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // Nếu người dùng đã đăng nhập, chuyển hướng đi chỗ khác
    if (!authLoading && user) {
      // Sẽ được AuthProvider tự động handle việc chuyển hướng, nhưng thêm ở đây cho chắc
      const checkOnboarding = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      };
      checkOnboarding();
    }
  }, [user, authLoading, router]);

  // Xử lý lỗi Firebase tiếng Việt
  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case "auth/invalid-email":
        return "Địa chỉ email không đúng định dạng.";
      case "auth/user-disabled":
        return "Tài khoản của bạn đã bị khóa.";
      case "auth/user-not-found":
        return "Không tìm thấy tài khoản với email này.";
      case "auth/wrong-password":
        return "Mật khẩu không đúng.";
      case "auth/email-already-in-use":
        return "Địa chỉ email này đã được sử dụng cho tài khoản khác.";
      case "auth/weak-password":
        return "Mật khẩu quá yếu (phải chứa tối thiểu 6 ký tự).";
      case "auth/invalid-credential":
        return "Thông tin đăng nhập không hợp lệ hoặc đã hết hạn.";
      default:
        return "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
    if (isSignUp && !displayName) {
      toast.error("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Đăng ký tài khoản mới
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Khởi tạo document user trống trên Firestore
        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          photoURL: null,
          isOnboarded: false,
          theme: "light",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
        toast.success("Đăng ký thành công! Hãy thiết lập sức khỏe của bạn.");
        router.push("/onboarding");
      } else {
        // Đăng nhập
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Đăng nhập thành công!");
        // Chuyển hướng sẽ do AuthProvider điều phối dựa trên database
      }
    } catch (error: any) {
      console.error("Auth error: ", error);
      toast.error(getFirebaseErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Kiểm tra xem user profile đã tồn tại trên Firestore chưa
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Tạo profile mới (chưa onboarded)
        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Thành viên",
          photoURL: firebaseUser.photoURL,
          isOnboarded: false,
          theme: "light",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        toast.success("Chào mừng bạn! Hãy thiết lập thông tin ban đầu.");
        router.push("/onboarding");
      } else {
        const profileData = userDocSnap.data();
        toast.success("Mừng bạn quay trở lại!");
        if (profileData.isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (error: any) {
      console.error("Google Auth error: ", error);
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-secondary/20 via-background to-primary/5 min-h-screen max-w-md mx-auto w-full page-transition">
      {/* Brand Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-primary mb-4 shadow-inner ring-4 ring-primary/10">
          <Heart className="w-8 h-8 fill-current text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Tiền Mãn Kinh</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-semibold">
          Đồng hành cùng sức khỏe & sự an tâm của phụ nữ trung niên
        </p>
      </div>

      <Card className="border border-border shadow-md rounded-[28px] overflow-hidden bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-1 pb-6 bg-muted/15 border-b border-border/30">
          <CardTitle className="text-xl font-black text-center text-foreground">
            {isSignUp ? "Tạo tài khoản mới" : "Chào mừng quay trở lại"}
          </CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm font-semibold text-muted-foreground">
            {isSignUp
              ? "Hãy đăng ký để bắt đầu hành trình hiểu bản thân"
              : "Đăng nhập bằng tài khoản của chị để tiếp tục"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">Họ và Tên</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Thị Hoa"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold placeholder:text-muted-foreground/45"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">Địa chỉ Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold placeholder:text-muted-foreground/45"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase">Mật khẩu</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => toast.info("Tính năng khôi phục mật khẩu đang được phát triển.")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold placeholder:text-muted-foreground/45"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 mt-4 transition-all shadow-md shadow-primary/20 active:scale-98 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang xử lý...
                </>
              ) : isSignUp ? (
                "Đăng ký tài khoản"
              ) : (
                "Đăng nhập bằng Email"
              )}
            </Button>
          </form>

          {/* Dấu phân cách */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-3 text-muted-foreground font-black tracking-wider">Hoặc đăng nhập bằng</span>
            </div>
          </div>

          {/* Đăng nhập Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-border hover:bg-muted text-foreground font-bold text-sm transition-all active:scale-98"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-4.5 h-4.5 mr-2 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.44-2.885-6.44-6.44s2.885-6.44 6.44-6.44c1.626 0 3.097.6 4.248 1.587l3.12-3.12C19.29 1.59 15.93 0 12 0 5.37 0 0 5.37 0 12s5.37 12 12 12c6.438 0 11.76-5.19 11.76-12 0-.81-.08-1.575-.24-2.285H12.24z"
              />
            </svg>
            Tài khoản Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/30 bg-muted/5 py-4">
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {isSignUp ? "Chị đã có tài khoản?" : "Chưa có tài khoản sức khỏe?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-black hover:underline cursor-pointer"
            >
              {isSignUp ? "Đăng nhập ngay" : "Đăng ký miễn phí"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
