"use client";

import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <section>{children}</section>
    </div>
  );
};

export default AuthLayout;
