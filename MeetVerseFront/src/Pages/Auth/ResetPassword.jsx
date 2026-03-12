/* eslint-disable no-unused-vars */
import { Lock, Eye, EyeOff, LoaderPinwheel, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "user@meetverse.app";

  async function handleReset(values) {
    try {
      setLoading(true);
      // API Logic here
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setApiError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  let validationSchema = Yup.object().shape({
    password: Yup.string()
      .matches(/^[A-z]\w{5,10}$/, "6-10 chars starting with a letter")
      .required("Required"),
    rePassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords don't match")
      .required("Required"),
  });

  let formik = useFormik({
    initialValues: { password: "", rePassword: "" },
    validationSchema,
    onSubmit: handleReset,
  });

  return (
    <>
      <Helmet>
        <title>Reset Password | MeetVerse</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] flex items-center justify-center py-12 px-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-[#181B26] rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-[#2A2E3B] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/10 text-blue-600 rounded-2xl mb-4">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Secure Reset
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              Set a strong password for <br />
              <span className="font-bold text-blue-600">{email}</span>
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  {...formik.getFieldProps("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-12 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.errors.password && formik.touched.password && (
                <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="rePassword"
                  {...formik.getFieldProps("rePassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-12 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {formik.errors.rePassword && formik.touched.rePassword && (
                <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                  {formik.errors.rePassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-900/20 transition-all flex justify-center items-center active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <LoaderPinwheel className="animate-spin" />
              ) : (
                "Update Credentials"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}
