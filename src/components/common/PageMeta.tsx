"use client";

import { useEffect } from "react";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Admin Portal`;
    }

    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export default PageMeta;
