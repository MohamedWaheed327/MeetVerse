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
      <div className="min-h-screen bg-white">
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
