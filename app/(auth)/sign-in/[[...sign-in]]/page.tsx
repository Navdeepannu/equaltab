import { SignIn } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="flex justify-center items-center pt-20">
      <SignIn 
        appearance={{
          elements: {
            socialButtonsBlockButton: "hidden",
            socialButtonsBlockButton__apple: "hidden",
          }
        }}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  );
};

export default page;
