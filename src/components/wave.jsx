import React from "react";

const Wave = ({ color = "#4F46E5", height = 150 }) => {
  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", lineHeight: 0 }}>
      <svg
        viewBox="0 0 1440 150"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: `${height}px` }}
      >
        <path
          fill={color}
          fillOpacity="1"
          d="M0,64L48,58.7C96,53,192,43,288,69.3C384,96,480,160,576,165.3C672,171,768,117,864,96C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
};

export default Wave;
