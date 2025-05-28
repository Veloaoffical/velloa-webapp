import * as React from "react";

// By: mdi
// See: https://v0.app/icon/mdi/checkbook
// Example: <IconMdiCheckbook width="24px" height="24px" style={{color: "#000000"}} />

export const IconMdiCheckbook = ({
  height = "1em",
  fill = "currentColor",
  focusable = "false",
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, "children">) => (
  <svg
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    height={height}
    focusable={focusable}
    {...props}
  >
    <path fill={fill} d="M5 14h14v1H5zm16 3V8H3v9zM1 5h22v14H1zm4 5h7v2H5z" />
  </svg>
);
