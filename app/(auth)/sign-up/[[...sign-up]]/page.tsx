import { SignUp } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="flex justify-center items-center pt-20">
      <SignUp />
    </div>
  );
};

export default page;
