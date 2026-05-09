import React from "react";
import  Navbar  from "../../components/LandingComponents/Navbar/Navbar";
import  Hero  from "../../components/LandingComponents/Hero/Hero";
import  Features  from "../../components/LandingComponents/Features/Features";
import  HowItWorks  from "../../components/LandingComponents/HowItWorks/HowItWorks";
import  ProductPreview  from "../../components/LandingComponents/ProductPreview/ProductPreview";
import  UseCases  from "../../components/LandingComponents/UseCases/UseCases";
import  Footer  from "../../components/LandingComponents/Footer/Footer";
const LandingPage = () => {
  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 -left-28 size-[22rem] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-[28rem] -right-24 size-[20rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 left-1/3 size-[18rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <UseCases />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
